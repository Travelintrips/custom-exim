/**
 * XML Hashing Module for Anti-Tamper Protection
 * Uses SHA-256 for secure hashing of XML content
 */

export async function generateXMLHash(xmlContent: string): Promise<string> {
  // Normalize XML by removing whitespace between tags for consistent hashing
  const normalizedXML = normalizeXML(xmlContent);
  
  // Convert string to Uint8Array
  const encoder = new TextEncoder();
  const data = encoder.encode(normalizedXML);
  
  // Generate SHA-256 hash
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  
  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}

export async function verifyXMLHash(xmlContent: string, expectedHash: string): Promise<boolean> {
  const actualHash = await generateXMLHash(xmlContent);
  return actualHash === expectedHash;
}

function normalizeXML(xml: string): string {
  return xml
    // Remove XML declaration variations
    .replace(/<\?xml[^?]*\?>/gi, '')
    // Remove comments
    .replace(/<!--[\s\S]*?-->/g, '')
    // Normalize whitespace between tags
    .replace(/>\s+</g, '><')
    // Trim leading/trailing whitespace
    .trim();
}

export function generateTimestamp(): string {
  return new Date().toISOString();
}

export function generateMessageId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `MSG-${timestamp}-${random}`.toUpperCase();
}

export interface HashVerificationResult {
  isValid: boolean;
  originalHash: string;
  computedHash: string;
  timestamp: string;
}

export async function verifyAndReport(
  xmlContent: string, 
  expectedHash: string
): Promise<HashVerificationResult> {
  const computedHash = await generateXMLHash(xmlContent);
  return {
    isValid: computedHash === expectedHash,
    originalHash: expectedHash,
    computedHash,
    timestamp: generateTimestamp(),
  };
}

export function createSignedXML(xmlContent: string, hash: string): string {
  // Add hash signature to XML envelope
  const signatureBlock = `
  <SIGNATURE>
    <HASH_ALGORITHM>SHA-256</HASH_ALGORITHM>
    <HASH_VALUE>${hash}</HASH_VALUE>
    <TIMESTAMP>${generateTimestamp()}</TIMESTAMP>
  </SIGNATURE>`;
  
  // Insert before closing root tag
  const closingTagMatch = xmlContent.match(/<\/([A-Z]+)>\s*$/);
  if (closingTagMatch) {
    const closingTag = closingTagMatch[0];
    return xmlContent.replace(closingTag, `${signatureBlock}\n${closingTag}`);
  }
  
  return xmlContent + signatureBlock;
}

export function extractHashFromSignedXML(xmlContent: string): string | null {
  const match = xmlContent.match(/<HASH_VALUE>([a-f0-9]+)<\/HASH_VALUE>/i);
  return match ? match[1] : null;
}

export function removeSignatureFromXML(xmlContent: string): string {
  return xmlContent.replace(/<SIGNATURE>[\s\S]*?<\/SIGNATURE>/gi, '');
}
