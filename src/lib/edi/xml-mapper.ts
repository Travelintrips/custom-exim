/**
 * XML Mapper - Internal JSON to CEISA XML Conversion
 * Supports PEB (Export) and PIB (Import) document formats
 */

import { PEBDocument, PEBItem } from '@/types/peb';
import { PIBDocument, PIBItem } from '@/types/pib';
import { generateXMLHash, createSignedXML, generateTimestamp, generateMessageId } from './xml-hash';

// XML Escape utility
function escapeXML(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Format date to CEISA format (YYYY-MM-DD)
function formatDate(date: string | null | undefined): string {
  if (!date) return '';
  return date.substring(0, 10);
}

// Format number with fixed decimals
function formatNumber(value: number | null | undefined, decimals: number = 2): string {
  if (value === null || value === undefined) return '0';
  return value.toFixed(decimals);
}

// Format NPWP (remove dots and dashes for CEISA)
function formatNPWP(npwp: string | null | undefined): string {
  if (!npwp) return '';
  return npwp.replace(/[.\-]/g, '');
}

/**
 * Map PEB Document to CEISA XML Format
 */
export function mapPEBToXML(peb: PEBDocument): string {
  const items = peb.items || [];
  const timestamp = generateTimestamp();
  const messageId = generateMessageId();
  
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<CEISA_PEB>
  <MESSAGE>
    <MESSAGE_ID>${messageId}</MESSAGE_ID>
    <MESSAGE_TYPE>PEB</MESSAGE_TYPE>
    <TIMESTAMP>${timestamp}</TIMESTAMP>
    <VERSION>2.0</VERSION>
  </MESSAGE>
  <HEADER>
    <DOCUMENT_NUMBER>${escapeXML(peb.document_number)}</DOCUMENT_NUMBER>
    <REGISTRATION_NUMBER>${escapeXML(peb.registration_number)}</REGISTRATION_NUMBER>
    <REGISTRATION_DATE>${formatDate(peb.registration_date)}</REGISTRATION_DATE>
    <NPE_NUMBER>${escapeXML(peb.npe_number)}</NPE_NUMBER>
    <NPE_DATE>${formatDate(peb.npe_date)}</NPE_DATE>
    <STATUS>${peb.status}</STATUS>
    <CUSTOMS_OFFICE>
      <CODE>${escapeXML(peb.customs_office_code)}</CODE>
      <NAME>${escapeXML(peb.customs_office_name)}</NAME>
    </CUSTOMS_OFFICE>
  </HEADER>
  <EXPORTER>
    <NPWP>${formatNPWP(peb.exporter_npwp)}</NPWP>
    <NAME>${escapeXML(peb.exporter_name)}</NAME>
    <ADDRESS>${escapeXML(peb.exporter_address)}</ADDRESS>
  </EXPORTER>
  <BUYER>
    <NAME>${escapeXML(peb.buyer_name)}</NAME>
    <ADDRESS>${escapeXML(peb.buyer_address)}</ADDRESS>
    <COUNTRY>${escapeXML(peb.buyer_country)}</COUNTRY>
  </BUYER>
  <PPJK>
    <NPWP>${formatNPWP(peb.ppjk_npwp)}</NPWP>
    <NAME>${escapeXML(peb.ppjk_name)}</NAME>
  </PPJK>
  <TRANSPORT>
    <MODE>${escapeXML(peb.transport_mode)}</MODE>
    <VESSEL_NAME>${escapeXML(peb.vessel_name)}</VESSEL_NAME>
    <VOYAGE_NUMBER>${escapeXML(peb.voyage_number)}</VOYAGE_NUMBER>
    <LOADING_PORT>
      <CODE>${escapeXML(peb.loading_port_code)}</CODE>
      <NAME>${escapeXML(peb.loading_port_name)}</NAME>
    </LOADING_PORT>
    <DESTINATION_PORT>
      <CODE>${escapeXML(peb.destination_port_code)}</CODE>
      <NAME>${escapeXML(peb.destination_port_name)}</NAME>
    </DESTINATION_PORT>
    <DESTINATION_COUNTRY>${escapeXML(peb.destination_country)}</DESTINATION_COUNTRY>
  </TRANSPORT>
  <TRADE_TERMS>
    <INCOTERM>${escapeXML(peb.incoterm_code)}</INCOTERM>
    <CURRENCY>${escapeXML(peb.currency_code)}</CURRENCY>
    <EXCHANGE_RATE>${formatNumber(peb.exchange_rate, 6)}</EXCHANGE_RATE>
  </TRADE_TERMS>
  <TOTALS>
    <PACKAGES>${peb.total_packages || 0}</PACKAGES>
    <PACKAGE_UNIT>${escapeXML(peb.package_unit)}</PACKAGE_UNIT>
    <GROSS_WEIGHT>${formatNumber(peb.gross_weight, 4)}</GROSS_WEIGHT>
    <NET_WEIGHT>${formatNumber(peb.net_weight, 4)}</NET_WEIGHT>
    <FOB_VALUE>${formatNumber(peb.total_fob_value, 2)}</FOB_VALUE>
    <FOB_IDR>${formatNumber(peb.total_fob_idr, 0)}</FOB_IDR>
    <FREIGHT>${formatNumber(peb.freight_value, 2)}</FREIGHT>
    <INSURANCE>${formatNumber(peb.insurance_value, 2)}</INSURANCE>
  </TOTALS>
  <ITEMS>
${items.map(item => mapPEBItemToXML(item)).join('\n')}
  </ITEMS>
</CEISA_PEB>`;

  return xml;
}

function mapPEBItemToXML(item: PEBItem): string {
  return `    <ITEM>
      <NUMBER>${item.item_number}</NUMBER>
      <HS_CODE>${escapeXML(item.hs_code)}</HS_CODE>
      <DESCRIPTION>${escapeXML(item.product_description)}</DESCRIPTION>
      <QUANTITY>${formatNumber(item.quantity, 4)}</QUANTITY>
      <UNIT>${escapeXML(item.quantity_unit)}</UNIT>
      <NET_WEIGHT>${formatNumber(item.net_weight, 4)}</NET_WEIGHT>
      <GROSS_WEIGHT>${formatNumber(item.gross_weight, 4)}</GROSS_WEIGHT>
      <UNIT_PRICE>${formatNumber(item.unit_price, 4)}</UNIT_PRICE>
      <TOTAL_PRICE>${formatNumber(item.total_price, 2)}</TOTAL_PRICE>
      <FOB_VALUE>${formatNumber(item.fob_value, 2)}</FOB_VALUE>
      <FOB_IDR>${formatNumber(item.fob_idr, 0)}</FOB_IDR>
      <COUNTRY_OF_ORIGIN>${escapeXML(item.country_of_origin)}</COUNTRY_OF_ORIGIN>
      <PACKAGING>
        <CODE>${escapeXML(item.packaging_code)}</CODE>
        <COUNT>${item.package_count || 0}</COUNT>
      </PACKAGING>
    </ITEM>`;
}

/**
 * Map PIB Document to CEISA XML Format
 */
export function mapPIBToXML(pib: PIBDocument): string {
  const items = pib.items || [];
  const timestamp = generateTimestamp();
  const messageId = generateMessageId();
  
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<CEISA_PIB>
  <MESSAGE>
    <MESSAGE_ID>${messageId}</MESSAGE_ID>
    <MESSAGE_TYPE>PIB</MESSAGE_TYPE>
    <TIMESTAMP>${timestamp}</TIMESTAMP>
    <VERSION>2.0</VERSION>
  </MESSAGE>
  <HEADER>
    <DOCUMENT_NUMBER>${escapeXML(pib.document_number)}</DOCUMENT_NUMBER>
    <REGISTRATION_NUMBER>${escapeXML(pib.registration_number)}</REGISTRATION_NUMBER>
    <REGISTRATION_DATE>${formatDate(pib.registration_date)}</REGISTRATION_DATE>
    <SPPB_NUMBER>${escapeXML(pib.sppb_number)}</SPPB_NUMBER>
    <SPPB_DATE>${formatDate(pib.sppb_date)}</SPPB_DATE>
    <STATUS>${pib.status}</STATUS>
    <LANE>${pib.lane || ''}</LANE>
    <CUSTOMS_OFFICE>
      <CODE>${escapeXML(pib.customs_office_code)}</CODE>
      <NAME>${escapeXML(pib.customs_office_name)}</NAME>
    </CUSTOMS_OFFICE>
  </HEADER>
  <IMPORTER>
    <NPWP>${formatNPWP(pib.importer_npwp)}</NPWP>
    <NAME>${escapeXML(pib.importer_name)}</NAME>
    <ADDRESS>${escapeXML(pib.importer_address)}</ADDRESS>
    <API>${escapeXML(pib.importer_api)}</API>
  </IMPORTER>
  <SUPPLIER>
    <NAME>${escapeXML(pib.supplier_name)}</NAME>
    <ADDRESS>${escapeXML(pib.supplier_address)}</ADDRESS>
    <COUNTRY>${escapeXML(pib.supplier_country)}</COUNTRY>
  </SUPPLIER>
  <PPJK>
    <NPWP>${formatNPWP(pib.ppjk_npwp)}</NPWP>
    <NAME>${escapeXML(pib.ppjk_name)}</NAME>
  </PPJK>
  <TRANSPORT>
    <MODE>${escapeXML(pib.transport_mode)}</MODE>
    <VESSEL_NAME>${escapeXML(pib.vessel_name)}</VESSEL_NAME>
    <VOYAGE_NUMBER>${escapeXML(pib.voyage_number)}</VOYAGE_NUMBER>
    <BL_AWB_NUMBER>${escapeXML(pib.bl_awb_number)}</BL_AWB_NUMBER>
    <BL_AWB_DATE>${formatDate(pib.bl_awb_date)}</BL_AWB_DATE>
    <LOADING_PORT>
      <CODE>${escapeXML(pib.loading_port_code)}</CODE>
      <NAME>${escapeXML(pib.loading_port_name)}</NAME>
      <COUNTRY>${escapeXML(pib.loading_country)}</COUNTRY>
    </LOADING_PORT>
    <DISCHARGE_PORT>
      <CODE>${escapeXML(pib.discharge_port_code)}</CODE>
      <NAME>${escapeXML(pib.discharge_port_name)}</NAME>
    </DISCHARGE_PORT>
  </TRANSPORT>
  <TRADE_TERMS>
    <INCOTERM>${escapeXML(pib.incoterm_code)}</INCOTERM>
    <CURRENCY>${escapeXML(pib.currency_code)}</CURRENCY>
    <EXCHANGE_RATE>${formatNumber(pib.exchange_rate, 6)}</EXCHANGE_RATE>
  </TRADE_TERMS>
  <TOTALS>
    <PACKAGES>${pib.total_packages || 0}</PACKAGES>
    <PACKAGE_UNIT>${escapeXML(pib.package_unit)}</PACKAGE_UNIT>
    <GROSS_WEIGHT>${formatNumber(pib.gross_weight, 4)}</GROSS_WEIGHT>
    <NET_WEIGHT>${formatNumber(pib.net_weight, 4)}</NET_WEIGHT>
    <FOB_VALUE>${formatNumber(pib.fob_value, 2)}</FOB_VALUE>
    <FREIGHT>${formatNumber(pib.freight_value, 2)}</FREIGHT>
    <INSURANCE>${formatNumber(pib.insurance_value, 2)}</INSURANCE>
    <CIF_VALUE>${formatNumber(pib.total_cif_value, 2)}</CIF_VALUE>
    <CIF_IDR>${formatNumber(pib.total_cif_idr, 0)}</CIF_IDR>
  </TOTALS>
  <TAX_SUMMARY>
    <BM_TOTAL>${formatNumber(pib.total_bm, 0)}</BM_TOTAL>
    <PPN_TOTAL>${formatNumber(pib.total_ppn, 0)}</PPN_TOTAL>
    <PPH_TOTAL>${formatNumber(pib.total_pph, 0)}</PPH_TOTAL>
    <TAX_TOTAL>${formatNumber(pib.total_tax, 0)}</TAX_TOTAL>
  </TAX_SUMMARY>
  <ITEMS>
${items.map(item => mapPIBItemToXML(item)).join('\n')}
  </ITEMS>
</CEISA_PIB>`;

  return xml;
}

function mapPIBItemToXML(item: PIBItem): string {
  return `    <ITEM>
      <NUMBER>${item.item_number}</NUMBER>
      <HS_CODE>${escapeXML(item.hs_code)}</HS_CODE>
      <DESCRIPTION>${escapeXML(item.product_description)}</DESCRIPTION>
      <QUANTITY>${formatNumber(item.quantity, 4)}</QUANTITY>
      <UNIT>${escapeXML(item.quantity_unit)}</UNIT>
      <NET_WEIGHT>${formatNumber(item.net_weight, 4)}</NET_WEIGHT>
      <GROSS_WEIGHT>${formatNumber(item.gross_weight, 4)}</GROSS_WEIGHT>
      <UNIT_PRICE>${formatNumber(item.unit_price, 4)}</UNIT_PRICE>
      <TOTAL_PRICE>${formatNumber(item.total_price, 2)}</TOTAL_PRICE>
      <CIF_VALUE>${formatNumber(item.cif_value, 2)}</CIF_VALUE>
      <CIF_IDR>${formatNumber(item.cif_idr, 0)}</CIF_IDR>
      <COUNTRY_OF_ORIGIN>${escapeXML(item.country_of_origin)}</COUNTRY_OF_ORIGIN>
      <TAX>
        <BM_RATE>${formatNumber(item.bm_rate, 4)}</BM_RATE>
        <BM_AMOUNT>${formatNumber(item.bm_amount, 0)}</BM_AMOUNT>
        <PPN_RATE>${formatNumber(item.ppn_rate, 4)}</PPN_RATE>
        <PPN_AMOUNT>${formatNumber(item.ppn_amount, 0)}</PPN_AMOUNT>
        <PPH_RATE>${formatNumber(item.pph_rate, 4)}</PPH_RATE>
        <PPH_AMOUNT>${formatNumber(item.pph_amount, 0)}</PPH_AMOUNT>
        <TOTAL_TAX>${formatNumber(item.total_tax, 0)}</TOTAL_TAX>
      </TAX>
      <PACKAGING>
        <CODE>${escapeXML(item.packaging_code)}</CODE>
        <COUNT>${item.package_count || 0}</COUNT>
      </PACKAGING>
    </ITEM>`;
}

/**
 * Generate signed XML with hash for transmission
 */
export async function generateSignedPEBXML(peb: PEBDocument): Promise<{ xml: string; hash: string }> {
  const xml = mapPEBToXML(peb);
  const hash = await generateXMLHash(xml);
  const signedXML = createSignedXML(xml, hash);
  return { xml: signedXML, hash };
}

export async function generateSignedPIBXML(pib: PIBDocument): Promise<{ xml: string; hash: string }> {
  const xml = mapPIBToXML(pib);
  const hash = await generateXMLHash(xml);
  const signedXML = createSignedXML(xml, hash);
  return { xml: signedXML, hash };
}
