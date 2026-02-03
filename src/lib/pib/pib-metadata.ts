/**
 * PIB Canonical Metadata Structure
 * 
 * This is the single source of truth for PIB data.
 * XML generation and CEISA integration MUST use this structure.
 */

import { PIBDocument, PIBItem } from "@/types/pib";

// ============================================
// CANONICAL METADATA TYPES
// ============================================

export interface PIBMetadataImporter {
  npwp: string;
  name: string;
  address: string;
  api: string | null;
}

export interface PIBMetadataSupplier {
  name: string;
  address: string;
  country: string;
}

export interface PIBMetadataCustomsOffice {
  code: string;
  name: string;
}

export interface PIBMetadataTransport {
  mode: string;
  vessel: string;
  voyage: string;
  bl_number: string;
  bl_date: string;
  loading_port: {
    code: string;
    name: string;
    country: string;
  };
  discharge_port: {
    code: string;
    name: string;
  };
}

export interface PIBMetadataTradeTerms {
  incoterm: string;
  currency: string;
  exchange_rate: number;
}

export interface PIBMetadataTotals {
  packages: number;
  package_unit: string;
  gross_weight: number;
  net_weight: number;
  fob: number;
  freight: number;
  insurance: number;
  cif: number;
  cif_idr: number;
}

export interface PIBMetadataItemPackaging {
  code: string;
  count: number;
}

export interface PIBMetadataItemTax {
  bm_rate: number;
  bm_amount: number;
  ppn_rate: number;
  ppn_amount: number;
  pph_rate: number;
  pph_amount: number;
}

export interface PIBMetadataItem {
  item_number: number;
  hs_code: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  net_weight: number;
  gross_weight: number;
  country_of_origin: string;
  packaging: PIBMetadataItemPackaging;
  tax: PIBMetadataItemTax;
}

export interface PIBMetadataHeader {
  document_type: string;
  document_number: string | null;
  registration_number: string | null;
  registration_date: string | null;
  importer: PIBMetadataImporter;
  supplier: PIBMetadataSupplier;
  customs_office: PIBMetadataCustomsOffice;
  transport: PIBMetadataTransport;
  trade_terms: PIBMetadataTradeTerms;
  totals: PIBMetadataTotals;
}

export interface PIBMetadata {
  version: string;
  generated_at: string;
  header: PIBMetadataHeader;
  items: PIBMetadataItem[];
  tax_summary: {
    total_bm: number;
    total_ppn: number;
    total_pph: number;
    total_tax: number;
  };
}

// ============================================
// VALIDATION
// ============================================

export interface PIBMetadataValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validatePIBMetadata(metadata: PIBMetadata | null | undefined): PIBMetadataValidationResult {
  const errors: string[] = [];

  if (!metadata) {
    errors.push("Metadata is empty. Please save the PIB first.");
    return { isValid: false, errors };
  }

  // Header validation
  if (!metadata.header) {
    errors.push("Header data is missing");
  } else {
    if (!metadata.header.importer?.npwp) {
      errors.push("Importer NPWP is required");
    }
    if (!metadata.header.importer?.name) {
      errors.push("Importer name is required");
    }
    if (!metadata.header.customs_office?.code) {
      errors.push("Customs office code is required");
    }
    if (!metadata.header.transport?.mode) {
      errors.push("Transport mode is required");
    }
    if (!metadata.header.trade_terms?.incoterm) {
      errors.push("Incoterm is required");
    }
    if (!metadata.header.totals?.package_unit) {
      errors.push("Package unit (PACKAGE_UNIT) is required at header level");
    }
  }

  // Items validation
  if (!metadata.items || metadata.items.length === 0) {
    errors.push("At least one item is required");
  } else {
    metadata.items.forEach((item, index) => {
      const itemNum = index + 1;
      
      if (!item.hs_code) {
        errors.push(`Item ${itemNum}: HS Code is required`);
      }
      
      if (!item.packaging?.code) {
        errors.push(`Item ${itemNum}: PACKAGING.CODE is required. Select Package Type in the Goods form.`);
      }
      
      if (item.quantity <= 0) {
        errors.push(`Item ${itemNum}: Quantity must be greater than 0`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ============================================
// BUILDER FUNCTIONS
// ============================================

interface BuildMetadataParams {
  formData: Partial<PIBDocument>;
  items: Partial<PIBItem>[];
  documentNumber?: string | null;
}

/**
 * Build canonical PIB metadata from form data and items
 * This is the ONLY function that should be used to create metadata
 */
export function buildPIBMetadata(params: BuildMetadataParams): PIBMetadata {
  const { formData, items, documentNumber } = params;

  // Determine package_unit from items (most common packaging_code)
  const packageCodes = items
    .map(item => item.packaging_code)
    .filter((code): code is string => Boolean(code));
  
  let headerPackageUnit = formData.package_unit || "";
  if (packageCodes.length > 0) {
    const codeCounts = packageCodes.reduce((acc, code) => {
      acc[code] = (acc[code] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    headerPackageUnit = Object.entries(codeCounts)
      .sort(([, a], [, b]) => b - a)[0][0];
  }

  // Build items metadata
  const metadataItems: PIBMetadataItem[] = items.map((item, index) => ({
    item_number: index + 1,
    hs_code: item.hs_code || "",
    description: item.product_description || "",
    quantity: item.quantity || 0,
    unit: item.quantity_unit || "",
    unit_price: item.unit_price || 0,
    total_price: item.total_price || 0,
    net_weight: item.net_weight || 0,
    gross_weight: item.gross_weight || 0,
    country_of_origin: item.country_of_origin || "",
    packaging: {
      code: item.packaging_code || "",
      count: item.package_count || 0,
    },
    tax: {
      bm_rate: item.bm_rate || 0,
      bm_amount: item.bm_amount || 0,
      ppn_rate: item.ppn_rate || 0,
      ppn_amount: item.ppn_amount || 0,
      pph_rate: item.pph_rate || 0,
      pph_amount: item.pph_amount || 0,
    },
  }));

  // Calculate totals from items
  const totalNetWeight = items.reduce((sum, item) => sum + (item.net_weight || 0), 0);
  const totalGrossWeight = items.reduce((sum, item) => sum + (item.gross_weight || 0), 0);
  const totalPackages = items.reduce((sum, item) => sum + (item.package_count || 0), 0);
  const totalBM = items.reduce((sum, item) => sum + (item.bm_amount || 0), 0);
  const totalPPN = items.reduce((sum, item) => sum + (item.ppn_amount || 0), 0);
  const totalPPh = items.reduce((sum, item) => sum + (item.pph_amount || 0), 0);

  const metadata: PIBMetadata = {
    version: "1.0",
    generated_at: new Date().toISOString(),
    header: {
      document_type: formData.jenis_dokumen || "PIB",
      document_number: documentNumber || formData.document_number || null,
      registration_number: formData.registration_number || null,
      registration_date: formData.registration_date || null,
      importer: {
        npwp: formData.importer_npwp || "",
        name: formData.importer_name || "",
        address: formData.importer_address || "",
        api: formData.importer_api || null,
      },
      supplier: {
        name: formData.supplier_name || "",
        address: formData.supplier_address || "",
        country: formData.supplier_country || "",
      },
      customs_office: {
        code: formData.customs_office_code || "",
        name: formData.customs_office_name || "",
      },
      transport: {
        mode: formData.transport_mode || "",
        vessel: formData.vessel_name || "",
        voyage: formData.voyage_number || "",
        bl_number: formData.bl_awb_number || "",
        bl_date: formData.bl_awb_date || "",
        loading_port: {
          code: formData.loading_port_code || "",
          name: formData.loading_port_name || "",
          country: formData.loading_country || "",
        },
        discharge_port: {
          code: formData.discharge_port_code || "",
          name: formData.discharge_port_name || "",
        },
      },
      trade_terms: {
        incoterm: formData.incoterm_code || "",
        currency: formData.currency_code || "",
        exchange_rate: formData.exchange_rate || 0,
      },
      totals: {
        packages: formData.total_packages || totalPackages,
        package_unit: headerPackageUnit,
        gross_weight: formData.gross_weight || totalGrossWeight,
        net_weight: formData.net_weight || totalNetWeight,
        fob: formData.fob_value || 0,
        freight: formData.freight_value || 0,
        insurance: formData.insurance_value || 0,
        cif: formData.total_cif_value || 0,
        cif_idr: formData.total_cif_idr || 0,
      },
    },
    items: metadataItems,
    tax_summary: {
      total_bm: formData.total_bm || totalBM,
      total_ppn: formData.total_ppn || totalPPN,
      total_pph: formData.total_pph || totalPPh,
      total_tax: formData.total_tax || (totalBM + totalPPN + totalPPh),
    },
  };

  return metadata;
}

// ============================================
// SAMPLE METADATA (for testing/documentation)
// ============================================

/**
 * Sample metadata for HS 0101210000 (Live Pure-bred Breeding Horses)
 * This demonstrates the correct structure for CEISA H2H integration
 */
export const SAMPLE_PIB_METADATA_LIVE_HORSES: PIBMetadata = {
  version: "1.0",
  generated_at: "2024-01-20T10:00:00.000Z",
  header: {
    document_type: "PIB",
    document_number: "PIB-20240120-0001",
    registration_number: null,
    registration_date: null,
    importer: {
      npwp: "01.234.567.8-901.000",
      name: "PT Kuda Sejahtera",
      address: "Jl. Peternakan No. 123, Jakarta Selatan",
      api: "API-U-123456789",
    },
    supplier: {
      name: "Australian Horse Trading Pty Ltd",
      address: "123 Farm Road, Sydney NSW 2000",
      country: "AU",
    },
    customs_office: {
      code: "040300",
      name: "KPU BC Tipe A Tanjung Priok",
    },
    transport: {
      mode: "SEA",
      vessel: "MV LIVESTOCK CARRIER",
      voyage: "V2024-001",
      bl_number: "SEALV2024001",
      bl_date: "2024-01-15",
      loading_port: {
        code: "AUSYD",
        name: "Sydney",
        country: "AU",
      },
      discharge_port: {
        code: "IDTPP",
        name: "Tanjung Priok",
      },
    },
    trade_terms: {
      incoterm: "CIF",
      currency: "USD",
      exchange_rate: 15500,
    },
    totals: {
      packages: 10,
      package_unit: "CR",
      gross_weight: 5000,
      net_weight: 4500,
      fob: 100000,
      freight: 5000,
      insurance: 500,
      cif: 105500,
      cif_idr: 1635250000,
    },
  },
  items: [
    {
      item_number: 1,
      hs_code: "0101210000",
      description: "PURE-BRED BREEDING HORSES",
      quantity: 10,
      unit: "HEAD",
      unit_price: 10000,
      total_price: 100000,
      net_weight: 4500,
      gross_weight: 5000,
      country_of_origin: "AU",
      packaging: {
        code: "CR",
        count: 10,
      },
      tax: {
        bm_rate: 0,
        bm_amount: 0,
        ppn_rate: 11,
        ppn_amount: 179877500,
        pph_rate: 2.5,
        pph_amount: 40881250,
      },
    },
  ],
  tax_summary: {
    total_bm: 0,
    total_ppn: 179877500,
    total_pph: 40881250,
    total_tax: 220758750,
  },
};
