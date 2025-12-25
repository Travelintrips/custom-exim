/**
 * PEB Module - Main Export
 */

export * from './peb-service';

// Explicit exports for key functions
export { 
  create_export_peb,
  generate_peb_xml,
  submit_peb,
  validatePEBForSubmission,
  getPEBById,
  updatePEBDocument,
  getPEBXMLMetadata,
  verifyPEBXMLIntegrity,
  lock_transaction,
  unlock_transaction,
  isDocumentLocked,
  validateCanModify,
  saveIncomingResponse,
} from './peb-service';

// Type exports
export type {
  CreatePEBInput,
  CreatePEBGoodsItem,
  CreatePEBDocument,
  CreatePEBResult,
  GeneratePEBXMLResult,
  SubmitPEBResult,
  PEBSubmissionValidation,
  LockTransactionResult,
} from './peb-service';
