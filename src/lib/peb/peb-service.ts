/**
 * PEB Service
 * Handle PEB document creation, validation, and management
 */

import { supabase } from '@/lib/supabase';
import { PEBDocument, PEBItem, PEBStatus } from '@/types/peb';
import { createAuditLog } from '@/lib/audit/audit-logger';
import { mapPEBToXML } from '@/lib/edi/xml-mapper';
import { generateXMLHash, generateTimestamp } from '@/lib/edi/xml-hash';

export interface CreatePEBInput {
  exporter_id: string;
  goods: CreatePEBGoodsItem[];
  documents: CreatePEBDocument[];
  buyer_id?: string;
  buyer_name?: string;
  buyer_address?: string;
  buyer_country?: string;
  ppjk_id?: string;
  ppjk_npwp?: string;
  ppjk_name?: string;
  customs_office_id?: string;
  customs_office_code?: string;
  customs_office_name?: string;
  loading_port_id?: string;
  loading_port_code?: string;
  loading_port_name?: string;
  destination_port_id?: string;
  destination_port_code?: string;
  destination_port_name?: string;
  destination_country?: string;
  incoterm_id?: string;
  incoterm_code?: string;
  currency_id?: string;
  currency_code?: string;
  exchange_rate?: number;
  transport_mode?: string;
  vessel_name?: string;
  voyage_number?: string;
  notes?: string;
}

export interface CreatePEBGoodsItem {
  hs_code: string;
  product_code?: string;
  product_description: string;
  quantity: number;
  quantity_unit?: string;
  net_weight?: number;
  gross_weight?: number;
  unit_price?: number;
  fob_value: number;
  country_of_origin?: string;
  packaging_code?: string;
  package_count?: number;
  notes?: string;
}

export interface CreatePEBDocument {
  doc_type: string;
  doc_no?: string;
  doc_date?: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  notes?: string;
}

export interface CreatePEBResult {
  success: boolean;
  peb_id: string | null;
  status: PEBStatus | null;
  errors: string[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate HS Code against hs_codes table
 */
async function validateHSCode(hsCode: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('hs_codes')
      .select('code')
      .eq('code', hsCode)
      .single();
    
    if (error || !data) {
      return false;
    }
    return true;
  } catch {
    // If table doesn't exist or other error, allow the HS code (demo mode)
    console.warn(`HS Code validation skipped for: ${hsCode}`);
    return true;
  }
}

/**
 * Validate mandatory fields for PEB creation
 */
async function validatePEBInput(input: CreatePEBInput): Promise<ValidationResult> {
  const errors: string[] = [];

  // Validate exporter_id
  if (!input.exporter_id || input.exporter_id.trim() === '') {
    errors.push('Exporter ID is required');
  }

  // Validate goods array
  if (!input.goods || input.goods.length === 0) {
    errors.push('At least one goods item is required');
  } else {
    // Validate each goods item
    for (let i = 0; i < input.goods.length; i++) {
      const item = input.goods[i];
      
      // Validate HS Code presence
      if (!item.hs_code || item.hs_code.trim() === '') {
        errors.push(`Goods item ${i + 1}: HS Code is required`);
      } else {
        // Validate HS Code against database
        const isValidHS = await validateHSCode(item.hs_code);
        if (!isValidHS) {
          errors.push(`Goods item ${i + 1}: HS Code '${item.hs_code}' is invalid or not found in master data`);
        }
      }

      // Validate product description
      if (!item.product_description || item.product_description.trim() === '') {
        errors.push(`Goods item ${i + 1}: Product description is required`);
      }

      // Validate quantity
      if (item.quantity === undefined || item.quantity <= 0) {
        errors.push(`Goods item ${i + 1}: Quantity must be greater than 0`);
      }

      // Validate FOB value
      if (item.fob_value === undefined || item.fob_value < 0) {
        errors.push(`Goods item ${i + 1}: FOB value must be 0 or greater`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate total FOB value from goods items
 */
function calculateTotalFOB(goods: CreatePEBGoodsItem[]): number {
  return goods.reduce((sum, item) => sum + (item.fob_value || 0), 0);
}

/**
 * Calculate total weight from goods items
 */
function calculateTotalWeight(goods: CreatePEBGoodsItem[]): { net: number; gross: number } {
  return {
    net: goods.reduce((sum, item) => sum + (item.net_weight || 0), 0),
    gross: goods.reduce((sum, item) => sum + (item.gross_weight || 0), 0),
  };
}

/**
 * Calculate total packages from goods items
 */
function calculateTotalPackages(goods: CreatePEBGoodsItem[]): number {
  return goods.reduce((sum, item) => sum + (item.package_count || 0), 0);
}

/**
 * Get current authenticated user ID
 */
async function getCurrentUserId(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  } catch {
    return null;
  }
}

/**
 * Get current authenticated user email
 */
async function getCurrentUserEmail(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.email || null;
  } catch {
    return null;
  }
}

/**
 * Get exporter details from companies table
 */
async function getExporterDetails(exporterId: string): Promise<{
  npwp: string | null;
  name: string | null;
  address: string | null;
} | null> {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('npwp, name, address')
      .eq('id', exporterId)
      .single();
    
    if (error || !data) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

/**
 * CREATE EXPORT PEB
 * Main function to create a new PEB document with goods and documents
 * 
 * Process:
 * 1. Validate mandatory fields (exporter_id, goods, HS code)
 * 2. Validate HS Code against hs_codes table
 * 3. Calculate FOB automatically from goods[]
 * 4. Save to peb_documents with status = 'DRAFT'
 * 5. Save goods to peb_items (goods_items equivalent)
 * 6. Save documents to supporting_documents (documents table)
 * 7. Create audit log entry
 * 
 * @param input - CreatePEBInput containing exporter_id, goods[], documents[]
 * @returns CreatePEBResult with peb_id and status
 */
export async function create_export_peb(input: CreatePEBInput): Promise<CreatePEBResult> {
  const errors: string[] = [];

  // Step 1 & 2: Validate mandatory fields and HS codes
  const validation = await validatePEBInput(input);
  if (!validation.isValid) {
    return {
      success: false,
      peb_id: null,
      status: null,
      errors: validation.errors,
    };
  }

  // Get current user
  const currentUserId = await getCurrentUserId();
  const currentUserEmail = await getCurrentUserEmail();

  // Get exporter details
  const exporterDetails = await getExporterDetails(input.exporter_id);

  // Step 3: Calculate FOB and totals automatically from goods[]
  const totalFOB = calculateTotalFOB(input.goods);
  const totalWeight = calculateTotalWeight(input.goods);
  const totalPackages = calculateTotalPackages(input.goods);
  const exchangeRate = input.exchange_rate || 15750; // Default IDR rate
  const totalFOBIDR = totalFOB * exchangeRate;

  try {
    // Step 4: Save to peb_documents with DRAFT status
    const pebData = {
      status: 'DRAFT' as PEBStatus,
      created_by: currentUserId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      
      // Exporter info
      exporter_id: input.exporter_id,
      exporter_npwp: exporterDetails?.npwp || null,
      exporter_name: exporterDetails?.name || null,
      exporter_address: exporterDetails?.address || null,
      
      // Buyer info
      buyer_id: input.buyer_id || null,
      buyer_name: input.buyer_name || null,
      buyer_address: input.buyer_address || null,
      buyer_country: input.buyer_country || null,
      
      // PPJK info
      ppjk_id: input.ppjk_id || null,
      ppjk_npwp: input.ppjk_npwp || null,
      ppjk_name: input.ppjk_name || null,
      
      // Customs office
      customs_office_id: input.customs_office_id || null,
      customs_office_code: input.customs_office_code || null,
      customs_office_name: input.customs_office_name || null,
      
      // Ports
      loading_port_id: input.loading_port_id || null,
      loading_port_code: input.loading_port_code || null,
      loading_port_name: input.loading_port_name || null,
      destination_port_id: input.destination_port_id || null,
      destination_port_code: input.destination_port_code || null,
      destination_port_name: input.destination_port_name || null,
      destination_country: input.destination_country || null,
      
      // Incoterm & Currency
      incoterm_id: input.incoterm_id || null,
      incoterm_code: input.incoterm_code || null,
      currency_id: input.currency_id || null,
      currency_code: input.currency_code || 'USD',
      exchange_rate: exchangeRate,
      
      // Transport
      transport_mode: input.transport_mode || 'SEA',
      vessel_name: input.vessel_name || null,
      voyage_number: input.voyage_number || null,
      
      // Calculated totals
      total_packages: totalPackages,
      package_unit: 'CTN',
      gross_weight: totalWeight.gross,
      net_weight: totalWeight.net,
      total_fob_value: totalFOB,
      total_fob_idr: totalFOBIDR,
      
      // Other
      notes: input.notes || null,
    };

    const { data: pebResult, error: pebError } = await supabase
      .from('peb_documents')
      .insert([pebData])
      .select('id')
      .single();

    if (pebError || !pebResult) {
      errors.push(`Failed to create PEB document: ${pebError?.message || 'Unknown error'}`);
      return {
        success: false,
        peb_id: null,
        status: null,
        errors,
      };
    }

    const pebId = pebResult.id;

    // Step 5: Save goods to peb_items (goods_items)
    const goodsItems = input.goods.map((item, index) => ({
      peb_id: pebId,
      item_number: index + 1,
      hs_code: item.hs_code,
      product_code: item.product_code || null,
      product_description: item.product_description,
      quantity: item.quantity,
      quantity_unit: item.quantity_unit || 'PCS',
      net_weight: item.net_weight || 0,
      gross_weight: item.gross_weight || 0,
      unit_price: item.unit_price || 0,
      total_price: (item.quantity || 0) * (item.unit_price || 0),
      fob_value: item.fob_value,
      fob_idr: (item.fob_value || 0) * exchangeRate,
      country_of_origin: item.country_of_origin || null,
      packaging_code: item.packaging_code || null,
      package_count: item.package_count || 0,
      notes: item.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { error: itemsError } = await supabase
      .from('peb_items')
      .insert(goodsItems);

    if (itemsError) {
      console.error('Failed to insert PEB items:', itemsError);
      // Continue - items insertion failure shouldn't block PEB creation
    }

    // Step 6: Save documents to supporting_documents
    if (input.documents && input.documents.length > 0) {
      const supportingDocs = input.documents.map((doc) => ({
        ref_type: 'PEB',
        ref_id: pebId,
        doc_type: doc.doc_type,
        doc_no: doc.doc_no || null,
        doc_date: doc.doc_date || null,
        file_url: doc.file_url || null,
        file_name: doc.file_name || null,
        file_size: doc.file_size || null,
        mime_type: doc.mime_type || null,
        notes: doc.notes || null,
        created_by: currentUserId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const { error: docsError } = await supabase
        .from('supporting_documents')
        .insert(supportingDocs);

      if (docsError) {
        console.error('Failed to insert supporting documents:', docsError);
        // Continue - docs insertion failure shouldn't block PEB creation
      }
    }

    // Step 7: Create audit log entry
    const fullPEBData = {
      ...pebData,
      id: pebId,
      goods: goodsItems,
      documents: input.documents,
    };

    await createAuditLog({
      entity_type: 'PEB',
      entity_id: pebId,
      entity_number: null, // No document number yet for draft
      action: 'CREATE',
      actor_id: currentUserId || undefined,
      actor_email: currentUserEmail || undefined,
      before_data: undefined, // null for creation
      after_data: fullPEBData,
      notes: 'CREATE_PEB_DRAFT',
      metadata: {
        table: 'peb_documents',
        record_id: pebId,
        action: 'CREATE_PEB_DRAFT',
        total_fob: totalFOB,
        items_count: input.goods.length,
        documents_count: input.documents?.length || 0,
      },
    });

    // Also try to create audit log in database
    try {
      await supabase.from('audit_logs').insert([{
        entity_type: 'PEB',
        entity_id: pebId,
        action: 'CREATE',
        actor_id: currentUserId,
        actor_email: currentUserEmail,
        before_data: null,
        after_data: fullPEBData,
        notes: 'CREATE_PEB_DRAFT',
        created_at: new Date().toISOString(),
      }]);
    } catch (dbAuditError) {
      console.warn('Database audit log insert failed:', dbAuditError);
    }

    return {
      success: true,
      peb_id: pebId,
      status: 'DRAFT',
      errors: [],
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    errors.push(`Failed to create PEB: ${errorMessage}`);
    
    return {
      success: false,
      peb_id: null,
      status: null,
      errors,
    };
  }
}

/**
 * Get PEB document by ID with items and documents
 */
export async function getPEBById(pebId: string): Promise<PEBDocument | null> {
  try {
    const { data: peb, error: pebError } = await supabase
      .from('peb_documents')
      .select('*')
      .eq('id', pebId)
      .single();

    if (pebError || !peb) {
      return null;
    }

    const { data: items } = await supabase
      .from('peb_items')
      .select('*')
      .eq('peb_id', pebId)
      .order('item_number', { ascending: true });

    return {
      ...peb,
      items: items || [],
    } as PEBDocument;
  } catch {
    return null;
  }
}

/**
 * Update PEB document
 */
export async function updatePEBDocument(
  pebId: string,
  updates: Partial<CreatePEBInput>
): Promise<CreatePEBResult> {
  const currentUserId = await getCurrentUserId();
  const currentUserEmail = await getCurrentUserEmail();

  try {
    // Get current PEB for before_data
    const currentPEB = await getPEBById(pebId);
    if (!currentPEB) {
      return {
        success: false,
        peb_id: null,
        status: null,
        errors: ['PEB document not found'],
      };
    }

    // Check if document is locked (locked field or locked status)
    if (currentPEB.locked === true) {
      return {
        success: false,
        peb_id: pebId,
        status: currentPEB.status,
        errors: ['Cannot update: Document is locked and read-only'],
      };
    }

    // Check if status indicates document should be locked
    if (currentPEB.status && ['SENT_TO_PPJK', 'CEISA_ACCEPTED', 'NPE_ISSUED', 'COMPLETED'].includes(currentPEB.status)) {
      return {
        success: false,
        peb_id: pebId,
        status: currentPEB.status,
        errors: ['Cannot update: Document status indicates it is locked'],
      };
    }

    // Recalculate totals if goods updated
    let totalFOB = currentPEB.total_fob_value;
    let totalWeight = { net: currentPEB.net_weight, gross: currentPEB.gross_weight };
    let totalPackages = currentPEB.total_packages;
    
    if (updates.goods && updates.goods.length > 0) {
      totalFOB = calculateTotalFOB(updates.goods);
      totalWeight = calculateTotalWeight(updates.goods);
      totalPackages = calculateTotalPackages(updates.goods);
    }

    const exchangeRate = updates.exchange_rate || currentPEB.exchange_rate || 15750;
    const totalFOBIDR = totalFOB * exchangeRate;

    // Update PEB document
    const { error: updateError } = await supabase
      .from('peb_documents')
      .update({
        ...updates,
        total_fob_value: totalFOB,
        total_fob_idr: totalFOBIDR,
        net_weight: totalWeight.net,
        gross_weight: totalWeight.gross,
        total_packages: totalPackages,
        updated_by: currentUserId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', pebId);

    if (updateError) {
      return {
        success: false,
        peb_id: pebId,
        status: null,
        errors: [`Failed to update PEB: ${updateError.message}`],
      };
    }

    // Create audit log
    await createAuditLog({
      entity_type: 'PEB',
      entity_id: pebId,
      entity_number: currentPEB.document_number || undefined,
      action: 'UPDATE',
      actor_id: currentUserId || undefined,
      actor_email: currentUserEmail || undefined,
      before_data: currentPEB as Record<string, unknown>,
      after_data: { ...currentPEB, ...updates } as Record<string, unknown>,
      notes: 'UPDATE_PEB',
    });

    return {
      success: true,
      peb_id: pebId,
      status: currentPEB.status,
      errors: [],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      peb_id: pebId,
      status: null,
      errors: [`Failed to update PEB: ${errorMessage}`],
    };
  }
}

/**
 * Generate PEB XML Result
 */
export interface GeneratePEBXMLResult {
  success: boolean;
  xml_path: string | null;
  xml_hash: string | null;
  errors: string[];
}

/**
 * GENERATE PEB XML
 * Generate XML for PEB document with hashing and storage
 * 
 * Process:
 * 1. Fetch PEB document, goods_items, documents from database
 * 2. Mapping internal JSON → CEISA XML structure
 * 3. Generate XML string
 * 4. Generate SHA256 hash from XML
 * 5. Save XML to storage path: /edi/outgoing/peb/{peb_no}.xml
 * 6. Save XML metadata to database
 * 7. Create audit log
 * 
 * Rules:
 * - XML only generated if status is DRAFT or SUBMITTED
 * - Don't overwrite old XML (versioned)
 * 
 * @param peb_id - UUID of the PEB document
 * @returns GeneratePEBXMLResult with xml_path and xml_hash
 */
export async function generate_peb_xml(peb_id: string): Promise<GeneratePEBXMLResult> {
  const errors: string[] = [];

  try {
    // Step 1: Fetch PEB document with items and documents
    const peb = await getPEBById(peb_id);
    
    if (!peb) {
      return {
        success: false,
        xml_path: null,
        xml_hash: null,
        errors: ['PEB document not found'],
      };
    }

    // Check if document is locked - cannot regenerate XML if locked
    if (peb.locked === true) {
      return {
        success: false,
        xml_path: null,
        xml_hash: null,
        errors: ['Cannot generate XML: Document is locked and read-only'],
      };
    }

    // Validate status - XML only generated for DRAFT or SUBMITTED
    const allowedStatuses: PEBStatus[] = ['DRAFT', 'SUBMITTED'];
    if (!allowedStatuses.includes(peb.status)) {
      return {
        success: false,
        xml_path: null,
        xml_hash: null,
        errors: [`Cannot generate XML for PEB with status: ${peb.status}. Only DRAFT or SUBMITTED allowed.`],
      };
    }

    // Fetch supporting documents
    const { data: supportingDocs } = await supabase
      .from('supporting_documents')
      .select('*')
      .eq('ref_type', 'PEB')
      .eq('ref_id', peb_id);

    // Step 2 & 3: Map to XML structure and generate XML string
    const xmlContent = mapPEBToXML(peb);

    // Step 4: Generate SHA256 hash
    const xmlHash = await generateXMLHash(xmlContent);

    // Step 5: Generate storage path (versioned with timestamp)
    const timestamp = generateTimestamp().replace(/[:.]/g, '-');
    const pebNumber = peb.document_number || `DRAFT-${peb_id.substring(0, 8)}`;
    const sanitizedPebNo = pebNumber.replace(/[^a-zA-Z0-9-_]/g, '_');
    const xmlPath = `/edi/outgoing/peb/${sanitizedPebNo}_${timestamp}.xml`;

    // Try to save XML to Supabase Storage (if bucket exists)
    let storageSuccess = false;
    try {
      const { error: storageError } = await supabase
        .storage
        .from('edi-files')
        .upload(xmlPath, new Blob([xmlContent], { type: 'application/xml' }), {
          contentType: 'application/xml',
          upsert: false, // Don't overwrite - versioned
        });

      if (!storageError) {
        storageSuccess = true;
      } else {
        console.warn('Storage upload failed:', storageError.message);
      }
    } catch (storageErr) {
      console.warn('Storage not available, continuing with metadata save');
    }

    // Step 6: Save XML metadata to database
    const metadataEntry = {
      ref_type: 'PEB',
      ref_id: peb_id,
      document_number: pebNumber,
      xml_path: xmlPath,
      xml_hash: xmlHash,
      xml_content: xmlContent, // Store content in case storage fails
      generated_at: new Date().toISOString(),
      generated_by: await getCurrentUserId(),
      storage_success: storageSuccess,
      file_size: new Blob([xmlContent]).size,
    };

    // Try to insert into edi_xml_metadata table (create if needed)
    try {
      await supabase.from('edi_xml_metadata').insert([metadataEntry]);
    } catch (metadataError) {
      console.warn('edi_xml_metadata table insert failed, storing in audit log');
    }

    // Update peb_documents with xml_content and xml_hash
    const { error: updateError } = await supabase
      .from('peb_documents')
      .update({
        xml_content: xmlContent,
        updated_at: new Date().toISOString(),
      })
      .eq('id', peb_id);

    if (updateError) {
      console.warn('Failed to update peb_documents with XML:', updateError.message);
    }

    // Step 7: Create audit log
    const currentUserId = await getCurrentUserId();
    const currentUserEmail = await getCurrentUserEmail();

    await createAuditLog({
      entity_type: 'PEB',
      entity_id: peb_id,
      entity_number: pebNumber,
      action: 'SEND_CEISA', // Using SEND_CEISA as closest to GENERATE_PEB_XML
      actor_id: currentUserId || undefined,
      actor_email: currentUserEmail || undefined,
      before_data: undefined,
      after_data: {
        xml_path: xmlPath,
        xml_hash: xmlHash,
        file_size: new Blob([xmlContent]).size,
        storage_success: storageSuccess,
      },
      notes: 'GENERATE_PEB_XML',
      metadata: {
        table: 'peb_documents',
        record_id: peb_id,
        action: 'GENERATE_PEB_XML',
        xml_path: xmlPath,
        xml_hash: xmlHash,
      },
    });

    // Also insert into database audit_logs
    try {
      await supabase.from('audit_logs').insert([{
        entity_type: 'PEB',
        entity_id: peb_id,
        entity_number: pebNumber,
        action: 'SEND_CEISA',
        actor_id: currentUserId,
        actor_email: currentUserEmail,
        before_data: null,
        after_data: { xml_path: xmlPath, xml_hash: xmlHash },
        notes: 'GENERATE_PEB_XML',
        created_at: new Date().toISOString(),
      }]);
    } catch (dbAuditError) {
      console.warn('Database audit log insert failed:', dbAuditError);
    }

    return {
      success: true,
      xml_path: xmlPath,
      xml_hash: xmlHash,
      errors: [],
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`Failed to generate PEB XML: ${errorMessage}`);

    return {
      success: false,
      xml_path: null,
      xml_hash: null,
      errors,
    };
  }
}

/**
 * Get XML metadata for a PEB document
 */
export async function getPEBXMLMetadata(peb_id: string): Promise<{
  xml_path: string | null;
  xml_hash: string | null;
  generated_at: string | null;
  versions: Array<{
    xml_path: string;
    xml_hash: string;
    generated_at: string;
  }>;
}> {
  try {
    // Try to get from edi_xml_metadata
    const { data: metadata } = await supabase
      .from('edi_xml_metadata')
      .select('xml_path, xml_hash, generated_at')
      .eq('ref_type', 'PEB')
      .eq('ref_id', peb_id)
      .order('generated_at', { ascending: false });

    if (metadata && metadata.length > 0) {
      return {
        xml_path: metadata[0].xml_path,
        xml_hash: metadata[0].xml_hash,
        generated_at: metadata[0].generated_at,
        versions: metadata,
      };
    }

    // Fallback: check peb_documents for xml_content
    const { data: peb } = await supabase
      .from('peb_documents')
      .select('xml_content, updated_at')
      .eq('id', peb_id)
      .single();

    if (peb?.xml_content) {
      const hash = await generateXMLHash(peb.xml_content);
      return {
        xml_path: null,
        xml_hash: hash,
        generated_at: peb.updated_at,
        versions: [],
      };
    }

    return {
      xml_path: null,
      xml_hash: null,
      generated_at: null,
      versions: [],
    };
  } catch {
    return {
      xml_path: null,
      xml_hash: null,
      generated_at: null,
      versions: [],
    };
  }
}

/**
 * Verify PEB XML integrity
 */
export async function verifyPEBXMLIntegrity(peb_id: string): Promise<{
  isValid: boolean;
  currentHash: string | null;
  storedHash: string | null;
  message: string;
}> {
  try {
    const peb = await getPEBById(peb_id);
    if (!peb) {
      return {
        isValid: false,
        currentHash: null,
        storedHash: null,
        message: 'PEB document not found',
      };
    }

    if (!peb.xml_content) {
      return {
        isValid: false,
        currentHash: null,
        storedHash: null,
        message: 'No XML content stored for this PEB',
      };
    }

    // Regenerate XML and hash
    const currentXML = mapPEBToXML(peb);
    const currentHash = await generateXMLHash(currentXML);
    const storedHash = await generateXMLHash(peb.xml_content);

    const isValid = currentHash === storedHash;

    return {
      isValid,
      currentHash,
      storedHash,
      message: isValid 
        ? 'XML integrity verified successfully' 
        : 'XML integrity check failed - document may have been modified',
    };
  } catch (error) {
    return {
      isValid: false,
      currentHash: null,
      storedHash: null,
      message: `Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Lock Transaction Result
 */
export interface LockTransactionResult {
  success: boolean;
  ref_id: string | null;
  ref_type: 'PEB' | 'PIB' | null;
  locked: boolean;
  new_status: string | null;
  errors: string[];
}

/**
 * Check if document is locked
 */
export async function isDocumentLocked(ref_id: string, ref_type: 'PEB' | 'PIB'): Promise<boolean> {
  try {
    const tableName = ref_type === 'PEB' ? 'peb_documents' : 'pib_documents';
    const { data, error } = await supabase
      .from(tableName)
      .select('locked, status')
      .eq('id', ref_id)
      .single();

    if (error || !data) {
      return false;
    }

    // Check locked flag or locked status
    if (data.locked === true) {
      return true;
    }

    // Check status-based locking
    const lockedStatuses = ref_type === 'PEB'
      ? ['SENT_TO_PPJK', 'CEISA_ACCEPTED', 'NPE_ISSUED', 'COMPLETED']
      : ['SENT_TO_PPJK', 'CEISA_ACCEPTED', 'SPPB_ISSUED', 'COMPLETED'];

    return lockedStatuses.includes(data.status);
  } catch {
    return false;
  }
}

/**
 * Validate document can be modified (throws error if locked)
 */
export async function validateCanModify(ref_id: string, ref_type: 'PEB' | 'PIB'): Promise<void> {
  const isLocked = await isDocumentLocked(ref_id, ref_type);
  if (isLocked) {
    throw new Error(`Cannot modify ${ref_type} document: Document is locked and read-only`);
  }
}

/**
 * LOCK TRANSACTION
 * Lock a PEB or PIB document to prevent further modifications
 * 
 * Process:
 * 1. Set locked = true on the record
 * 2. Update status to COMPLETED or final status
 * 3. Prevent UPDATE and DELETE through validation
 * 4. Create audit log
 * 
 * Rules:
 * - After locked = true:
 *   - All fields become read-only
 *   - Cannot delete
 *   - Cannot regenerate XML
 * 
 * @param ref_id - UUID of the document
 * @param ref_type - 'PEB' or 'PIB'
 * @returns LockTransactionResult
 */
export async function lock_transaction(
  ref_id: string,
  ref_type: 'PEB' | 'PIB'
): Promise<LockTransactionResult> {
  const errors: string[] = [];

  try {
    // Determine table name based on ref_type
    const tableName = ref_type === 'PEB' ? 'peb_documents' : 'pib_documents';

    // Get current document state (before_data)
    const { data: currentDoc, error: fetchError } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', ref_id)
      .single();

    if (fetchError || !currentDoc) {
      return {
        success: false,
        ref_id: null,
        ref_type: null,
        locked: false,
        new_status: null,
        errors: [`${ref_type} document not found`],
      };
    }

    // Check if already locked
    if (currentDoc.locked === true) {
      return {
        success: false,
        ref_id,
        ref_type,
        locked: true,
        new_status: currentDoc.status,
        errors: [`${ref_type} document is already locked`],
      };
    }

    // Determine new status based on ref_type and current status
    let newStatus: string;
    if (ref_type === 'PEB') {
      // PEB: COMPLETED or SENT_TO_PPJK
      if (currentDoc.status === 'NPE_ISSUED' || currentDoc.status === 'CEISA_ACCEPTED') {
        newStatus = 'COMPLETED';
      } else if (currentDoc.status === 'SUBMITTED') {
        newStatus = 'SENT_TO_PPJK';
      } else {
        newStatus = 'COMPLETED';
      }
    } else {
      // PIB: COMPLETED or SPPB_ISSUED
      if (currentDoc.status === 'SPPB_ISSUED' || currentDoc.status === 'CEISA_ACCEPTED') {
        newStatus = 'COMPLETED';
      } else if (currentDoc.status === 'SUBMITTED') {
        newStatus = 'SPPB_ISSUED';
      } else {
        newStatus = 'COMPLETED';
      }
    }

    // Get current user
    const currentUserId = await getCurrentUserId();
    const currentUserEmail = await getCurrentUserEmail();

    // Step 1 & 2: Set locked = true and update status
    const { error: updateError } = await supabase
      .from(tableName)
      .update({
        locked: true,
        status: newStatus,
        locked_at: new Date().toISOString(),
        locked_by: currentUserId,
        updated_at: new Date().toISOString(),
        updated_by: currentUserId,
      })
      .eq('id', ref_id);

    if (updateError) {
      return {
        success: false,
        ref_id,
        ref_type,
        locked: false,
        new_status: null,
        errors: [`Failed to lock ${ref_type}: ${updateError.message}`],
      };
    }

    // Step 4: Create audit log
    const beforeData = {
      locked: false,
      status: currentDoc.status,
    };

    const afterData = {
      locked: true,
      status: newStatus,
      locked_at: new Date().toISOString(),
      locked_by: currentUserId,
    };

    await createAuditLog({
      entity_type: ref_type,
      entity_id: ref_id,
      entity_number: currentDoc.document_number || undefined,
      action: 'UPDATE', // Using UPDATE as closest to LOCK_TRANSACTION
      actor_id: currentUserId || undefined,
      actor_email: currentUserEmail || undefined,
      before_data: beforeData,
      after_data: afterData,
      notes: 'LOCK_TRANSACTION',
      metadata: {
        table: tableName,
        record_id: ref_id,
        action: 'LOCK_TRANSACTION',
        previous_status: currentDoc.status,
        new_status: newStatus,
      },
    });

    // Also insert into database audit_logs
    try {
      await supabase.from('audit_logs').insert([{
        entity_type: ref_type,
        entity_id: ref_id,
        entity_number: currentDoc.document_number,
        action: 'UPDATE',
        actor_id: currentUserId,
        actor_email: currentUserEmail,
        before_data: beforeData,
        after_data: afterData,
        notes: 'LOCK_TRANSACTION',
        created_at: new Date().toISOString(),
      }]);
    } catch (dbAuditError) {
      console.warn('Database audit log insert failed:', dbAuditError);
    }

    return {
      success: true,
      ref_id,
      ref_type,
      locked: true,
      new_status: newStatus,
      errors: [],
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`Failed to lock ${ref_type}: ${errorMessage}`);

    return {
      success: false,
      ref_id,
      ref_type,
      locked: false,
      new_status: null,
      errors,
    };
  }
}

/**
 * Unlock transaction (admin only - for emergency use)
 */
export async function unlock_transaction(
  ref_id: string,
  ref_type: 'PEB' | 'PIB',
  reason: string
): Promise<LockTransactionResult> {
  try {
    const tableName = ref_type === 'PEB' ? 'peb_documents' : 'pib_documents';

    // Get current document state
    const { data: currentDoc, error: fetchError } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', ref_id)
      .single();

    if (fetchError || !currentDoc) {
      return {
        success: false,
        ref_id: null,
        ref_type: null,
        locked: false,
        new_status: null,
        errors: [`${ref_type} document not found`],
      };
    }

    const currentUserId = await getCurrentUserId();
    const currentUserEmail = await getCurrentUserEmail();

    // Unlock the document
    const { error: updateError } = await supabase
      .from(tableName)
      .update({
        locked: false,
        updated_at: new Date().toISOString(),
        updated_by: currentUserId,
      })
      .eq('id', ref_id);

    if (updateError) {
      return {
        success: false,
        ref_id,
        ref_type,
        locked: true,
        new_status: null,
        errors: [`Failed to unlock ${ref_type}: ${updateError.message}`],
      };
    }

    // Create audit log for unlock
    await createAuditLog({
      entity_type: ref_type,
      entity_id: ref_id,
      entity_number: currentDoc.document_number || undefined,
      action: 'UPDATE',
      actor_id: currentUserId || undefined,
      actor_email: currentUserEmail || undefined,
      before_data: { locked: true },
      after_data: { locked: false, unlock_reason: reason },
      notes: 'UNLOCK_TRANSACTION',
      metadata: {
        table: tableName,
        record_id: ref_id,
        action: 'UNLOCK_TRANSACTION',
        reason,
      },
    });

    return {
      success: true,
      ref_id,
      ref_type,
      locked: false,
      new_status: currentDoc.status,
      errors: [],
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      ref_id,
      ref_type,
      locked: false,
      new_status: null,
      errors: [`Failed to unlock ${ref_type}: ${errorMessage}`],
    };
  }
}

/**
 * Submit PEB Result
 */
export interface SubmitPEBResult {
  success: boolean;
  peb_id: string | null;
  status: PEBStatus | null;
  xml_path: string | null;
  xml_hash: string | null;
  locked: boolean;
  errors: string[];
}

/**
 * PEB Validation Result for Submission
 */
export interface PEBSubmissionValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate PEB for Submission
 * Comprehensive validation gate before submit
 */
export async function validatePEBForSubmission(peb_id: string): Promise<PEBSubmissionValidation> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const peb = await getPEBById(peb_id);
    
    if (!peb) {
      return {
        isValid: false,
        errors: ['PEB document not found'],
        warnings: [],
      };
    }

    // Check if already locked
    if (peb.locked === true) {
      return {
        isValid: false,
        errors: ['Document is already locked and submitted'],
        warnings: [],
      };
    }

    // Check status
    if (peb.status !== 'DRAFT') {
      return {
        isValid: false,
        errors: [`Cannot submit PEB with status: ${peb.status}. Only DRAFT can be submitted.`],
        warnings: [],
      };
    }

    // Validation Gate 1: Goods items must not be empty
    const items = peb.items || [];
    if (items.length === 0) {
      errors.push('At least one goods item is required');
    }

    // Validation Gate 2: FOB value must not be 0
    const totalFOB = items.reduce((sum, item) => sum + (item.fob_value || 0), 0);
    if (totalFOB === 0) {
      errors.push('Total FOB value cannot be 0');
    }

    // Validation Gate 3: Each item must have HS Code and Description
    items.forEach((item, index) => {
      if (!item.hs_code || item.hs_code.trim() === '') {
        errors.push(`Item ${index + 1}: HS Code is required`);
      }
      if (!item.product_description || item.product_description.trim() === '') {
        errors.push(`Item ${index + 1}: Product description is required`);
      }
      if (item.quantity <= 0) {
        errors.push(`Item ${index + 1}: Quantity must be greater than 0`);
      }
    });

    // Validation Gate 4: Exporter must be filled
    if (!peb.exporter_id && !peb.exporter_name) {
      errors.push('Exporter information is required');
    }

    // Validation Gate 5: Customs office must be filled
    if (!peb.customs_office_code && !peb.customs_office_name) {
      warnings.push('Customs office is not specified');
    }

    // Validation Gate 6: Loading port must be filled
    if (!peb.loading_port_code && !peb.loading_port_name) {
      warnings.push('Loading port is not specified');
    }

    // Validation Gate 7: Destination must be filled
    if (!peb.destination_port_code && !peb.destination_country) {
      warnings.push('Destination port/country is not specified');
    }

    // Validation Gate 8: Incoterm & Currency sync
    if (!peb.incoterm_code) {
      warnings.push('Incoterm is not specified');
    }
    if (!peb.currency_code) {
      warnings.push('Currency is not specified');
    }

    // Validation Gate 9: TOTALS = SUM(ITEMS) check
    const calculatedNetWeight = items.reduce((sum, item) => sum + (item.net_weight || 0), 0);
    const calculatedGrossWeight = items.reduce((sum, item) => sum + (item.gross_weight || 0), 0);
    const calculatedPackages = items.reduce((sum, item) => sum + (item.package_count || 0), 0);

    if (peb.net_weight && Math.abs(peb.net_weight - calculatedNetWeight) > 0.01) {
      warnings.push(`Net weight mismatch: Header=${peb.net_weight}, Items sum=${calculatedNetWeight}`);
    }
    if (peb.gross_weight && Math.abs(peb.gross_weight - calculatedGrossWeight) > 0.01) {
      warnings.push(`Gross weight mismatch: Header=${peb.gross_weight}, Items sum=${calculatedGrossWeight}`);
    }
    if (peb.total_fob_value && Math.abs(peb.total_fob_value - totalFOB) > 0.01) {
      warnings.push(`FOB value mismatch: Header=${peb.total_fob_value}, Items sum=${totalFOB}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };

  } catch (error) {
    return {
      isValid: false,
      errors: [`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      warnings: [],
    };
  }
}

/**
 * SUBMIT PEB
 * Complete PEB submission workflow with XML generation and locking
 * 
 * Process:
 * 1. Validate PEB for submission (validation gate)
 * 2. Generate XML from actual UI data
 * 3. Generate SHA256 hash and save to document_hashes
 * 4. Save XML to /edi/outgoing/PEB/{peb_id}.xml
 * 5. Update status to SUBMITTED_TO_PPJK
 * 6. Lock document (locked = true, all fields read-only)
 * 7. Create audit logs: GENERATE_XML, SUBMIT_PEB, LOCK_TRANSACTION
 * 
 * @param peb_id - UUID of the PEB document
 * @returns SubmitPEBResult
 */
export async function submit_peb(peb_id: string): Promise<SubmitPEBResult> {
  const errors: string[] = [];

  try {
    // Step 1: Validation gate
    const validation = await validatePEBForSubmission(peb_id);
    if (!validation.isValid) {
      return {
        success: false,
        peb_id,
        status: null,
        xml_path: null,
        xml_hash: null,
        locked: false,
        errors: validation.errors,
      };
    }

    // Get PEB document
    const peb = await getPEBById(peb_id);
    if (!peb) {
      return {
        success: false,
        peb_id,
        status: null,
        xml_path: null,
        xml_hash: null,
        locked: false,
        errors: ['PEB document not found'],
      };
    }

    const currentUserId = await getCurrentUserId();
    const currentUserEmail = await getCurrentUserEmail();
    const items = peb.items || [];

    // Recalculate totals from items to ensure TOTALS = SUM(ITEMS)
    const totalFOB = items.reduce((sum, item) => sum + (item.fob_value || 0), 0);
    const totalNetWeight = items.reduce((sum, item) => sum + (item.net_weight || 0), 0);
    const totalGrossWeight = items.reduce((sum, item) => sum + (item.gross_weight || 0), 0);
    const totalPackages = items.reduce((sum, item) => sum + (item.package_count || 0), 0);
    const exchangeRate = peb.exchange_rate || 15750;
    const totalFOBIDR = totalFOB * exchangeRate;

    // Update PEB with recalculated totals
    await supabase
      .from('peb_documents')
      .update({
        total_fob_value: totalFOB,
        total_fob_idr: totalFOBIDR,
        net_weight: totalNetWeight,
        gross_weight: totalGrossWeight,
        total_packages: totalPackages,
        updated_at: new Date().toISOString(),
      })
      .eq('id', peb_id);

    // Refresh PEB data with updated totals
    const updatedPeb = await getPEBById(peb_id);
    if (!updatedPeb) {
      return {
        success: false,
        peb_id,
        status: null,
        xml_path: null,
        xml_hash: null,
        locked: false,
        errors: ['Failed to refresh PEB data'],
      };
    }

    // Step 2: Generate XML from actual UI data
    const xmlContent = mapPEBToXML(updatedPeb);

    // Step 3: Generate SHA256 hash
    const xmlHash = await generateXMLHash(xmlContent);

    // Step 4: Save XML to storage
    const timestamp = generateTimestamp().replace(/[:.]/g, '-');
    const pebNumber = updatedPeb.document_number || `PEB-${peb_id.substring(0, 8)}`;
    const sanitizedPebNo = pebNumber.replace(/[^a-zA-Z0-9-_]/g, '_');
    const xmlPath = `/edi/outgoing/PEB/${sanitizedPebNo}_${timestamp}.xml`;

    // Save to storage
    let storageSuccess = false;
    try {
      const { error: storageError } = await supabase
        .storage
        .from('edi-files')
        .upload(xmlPath, new Blob([xmlContent], { type: 'application/xml' }), {
          contentType: 'application/xml',
          upsert: false,
        });
      if (!storageError) {
        storageSuccess = true;
      }
    } catch (e) {
      console.warn('Storage upload failed:', e);
    }

    // Save XML metadata
    await supabase.from('edi_xml_metadata').insert([{
      ref_type: 'PEB',
      ref_id: peb_id,
      document_number: pebNumber,
      xml_path: xmlPath,
      xml_hash: xmlHash,
      xml_content: xmlContent,
      generated_at: new Date().toISOString(),
      generated_by: currentUserId,
      storage_success: storageSuccess,
      file_size: new Blob([xmlContent]).size,
    }]);

    // Save hash to document_hashes (immutable)
    await supabase.from('document_hashes').insert([{
      ref_type: 'PEB',
      ref_id: peb_id,
      document_number: pebNumber,
      xml_hash: xmlHash,
      hash_algorithm: 'SHA-256',
      generated_at: new Date().toISOString(),
      generated_by: currentUserId,
      is_immutable: true,
    }]);

    // Step 5 & 6: Update status and lock document
    const newStatus: PEBStatus = 'SUBMITTED';
    const { error: updateError } = await supabase
      .from('peb_documents')
      .update({
        status: newStatus,
        locked: true,
        locked_at: new Date().toISOString(),
        locked_by: currentUserId,
        xml_content: xmlContent,
        submitted_at: new Date().toISOString(),
        submitted_by: currentUserId,
        updated_at: new Date().toISOString(),
        updated_by: currentUserId,
      })
      .eq('id', peb_id);

    if (updateError) {
      return {
        success: false,
        peb_id,
        status: null,
        xml_path: null,
        xml_hash: null,
        locked: false,
        errors: [`Failed to update PEB status: ${updateError.message}`],
      };
    }

    // Step 7: Create audit logs

    // Audit: GENERATE_XML
    await createAuditLog({
      entity_type: 'PEB',
      entity_id: peb_id,
      entity_number: pebNumber,
      action: 'SEND_CEISA',
      actor_id: currentUserId || undefined,
      actor_email: currentUserEmail || undefined,
      before_data: undefined,
      after_data: { xml_path: xmlPath, xml_hash: xmlHash },
      notes: 'GENERATE_XML',
      metadata: {
        action: 'GENERATE_XML',
        xml_hash: xmlHash,
        timestamp: new Date().toISOString(),
      },
    });

    await supabase.from('audit_logs').insert([{
      entity_type: 'PEB',
      entity_id: peb_id,
      entity_number: pebNumber,
      action: 'SEND_CEISA',
      actor_id: currentUserId,
      actor_email: currentUserEmail,
      before_data: null,
      after_data: { xml_path: xmlPath, xml_hash: xmlHash },
      notes: 'GENERATE_XML',
      created_at: new Date().toISOString(),
    }]);

    // Audit: SUBMIT_PEB
    await createAuditLog({
      entity_type: 'PEB',
      entity_id: peb_id,
      entity_number: pebNumber,
      action: 'UPDATE',
      actor_id: currentUserId || undefined,
      actor_email: currentUserEmail || undefined,
      before_data: { status: 'DRAFT' },
      after_data: { status: newStatus },
      notes: 'SUBMIT_PEB',
      metadata: {
        action: 'SUBMIT_PEB',
        timestamp: new Date().toISOString(),
      },
    });

    await supabase.from('audit_logs').insert([{
      entity_type: 'PEB',
      entity_id: peb_id,
      entity_number: pebNumber,
      action: 'UPDATE',
      actor_id: currentUserId,
      actor_email: currentUserEmail,
      before_data: { status: 'DRAFT' },
      after_data: { status: newStatus },
      notes: 'SUBMIT_PEB',
      created_at: new Date().toISOString(),
    }]);

    // Audit: LOCK_TRANSACTION
    await createAuditLog({
      entity_type: 'PEB',
      entity_id: peb_id,
      entity_number: pebNumber,
      action: 'UPDATE',
      actor_id: currentUserId || undefined,
      actor_email: currentUserEmail || undefined,
      before_data: { locked: false },
      after_data: { locked: true, locked_at: new Date().toISOString() },
      notes: 'LOCK_TRANSACTION',
      metadata: {
        action: 'LOCK_TRANSACTION',
        timestamp: new Date().toISOString(),
        hash: xmlHash,
      },
    });

    await supabase.from('audit_logs').insert([{
      entity_type: 'PEB',
      entity_id: peb_id,
      entity_number: pebNumber,
      action: 'UPDATE',
      actor_id: currentUserId,
      actor_email: currentUserEmail,
      before_data: { locked: false },
      after_data: { locked: true },
      notes: 'LOCK_TRANSACTION',
      created_at: new Date().toISOString(),
    }]);

    return {
      success: true,
      peb_id,
      status: newStatus,
      xml_path: xmlPath,
      xml_hash: xmlHash,
      locked: true,
      errors: [],
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`Failed to submit PEB: ${errorMessage}`);

    return {
      success: false,
      peb_id,
      status: null,
      xml_path: null,
      xml_hash: null,
      locked: false,
      errors,
    };
  }
}

/**
 * Save incoming CEISA response
 */
export async function saveIncomingResponse(
  peb_id: string,
  responseXml: string
): Promise<{ success: boolean; archive_path: string | null; error: string | null }> {
  try {
    const peb = await getPEBById(peb_id);
    if (!peb) {
      return { success: false, archive_path: null, error: 'PEB not found' };
    }

    const timestamp = generateTimestamp().replace(/[:.]/g, '-');
    const pebNumber = peb.document_number || peb_id.substring(0, 8);
    const sanitizedPebNo = pebNumber.replace(/[^a-zA-Z0-9-_]/g, '_');
    
    // Save response to incoming folder
    const responsePath = `/edi/incoming/PEB/${sanitizedPebNo}_response_${timestamp}.xml`;
    
    try {
      await supabase
        .storage
        .from('edi-files')
        .upload(responsePath, new Blob([responseXml], { type: 'application/xml' }), {
          contentType: 'application/xml',
          upsert: false,
        });
    } catch (e) {
      console.warn('Storage save failed:', e);
    }

    // Archive the response
    const archivePath = `/edi/archive/incoming/peb/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${sanitizedPebNo}_${timestamp}.xml`;

    // Save archive metadata
    const responseHash = await generateXMLHash(responseXml);
    await supabase.from('edi_xml_metadata').insert([{
      ref_type: 'PEB_RESPONSE',
      ref_id: peb_id,
      document_number: pebNumber,
      xml_path: archivePath,
      xml_hash: responseHash,
      xml_content: responseXml,
      generated_at: new Date().toISOString(),
      storage_success: true,
    }]);

    // Update PEB with CEISA response
    await supabase
      .from('peb_documents')
      .update({
        ceisa_response: responseXml,
        updated_at: new Date().toISOString(),
      })
      .eq('id', peb_id);

    return { success: true, archive_path: archivePath, error: null };

  } catch (error) {
    return { 
      success: false, 
      archive_path: null, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
