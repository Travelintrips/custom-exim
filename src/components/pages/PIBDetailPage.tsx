import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  ArrowLeft,
  Pencil,
  Send,
  CheckCircle,
  XCircle,
  Code,
  FileText,
  Clock,
  Lock,
  AlertTriangle,
  Calculator,
} from "lucide-react";
import { PIBStatusBadge, PIBLaneBadge } from "@/components/pib/PIBStatusBadge";
import { PIBStatusTimeline } from "@/components/pib/PIBStatusTimeline";
import { PIBXMLPreview } from "@/components/pib/PIBXMLPreview";
import { PIBTaxBreakdown } from "@/components/pib/PIBTaxBreakdown";
import {
  PIBDocument,
  PIBItem,
  PIBStatusHistory,
  PIB_STATUS_CONFIG,
  PIBStatus,
  PIB_LANE_CONFIG,
} from "@/types/pib";
import { useRole } from "@/hooks/useRole";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import { submitPIBToCEISAFromMetadata } from "@/lib/edi/ceisa-submit";
import { validatePIBMetadata, PIBMetadata } from "@/lib/pib/pib-metadata";
import { createAuditLog } from "@/lib/audit/audit-logger";

export default function PIBDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { permissions, role } = useRole();
  const [xmlPreviewOpen, setXmlPreviewOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<
    "approve" | "reject" | "send_ppjk"
  >("approve");
  const [actionNotes, setActionNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [pib, setPib] = useState<PIBDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);

  // Fetch PIB document from Supabase
  const fetchPIB = useCallback(async () => {
    if (!id) {
      setError("No document ID provided");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("pib_documents")
        .select(
          `
          *,
          pib_items (*),
          pib_status_history (*)
        `,
        )
        .eq("id", id)
        .single();

      if (fetchError) {
        console.error("Error fetching PIB:", fetchError);
        setError(`Failed to load document: ${fetchError.message}`);
        setPib(null);
        return;
      }

      if (data) {
        // Transform the data to match PIBDocument structure
        const pibDoc: PIBDocument = {
          ...data,
          items: data.pib_items || [],
          status_history: data.pib_status_history || [],
        };
        setPib(pibDoc);

        // Fetch supporting documents
        const { data: docsData, error: docsError } = await supabase
          .from("supporting_documents")
          .select("*")
          .eq("ref_type", "PIB")
          .eq("ref_id", id);

        if (docsError) {
          console.error("Error fetching supporting documents:", docsError);
        } else {
          setDocuments(docsData || []);
        }
      } else {
        setError("Document not found");
        setPib(null);
      }
    } catch (err) {
      console.error("Error fetching PIB:", err);
      setError("An unexpected error occurred");
      setPib(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPIB();
  }, [fetchPIB]);

  // Loading state
  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/pib")}>
              <ArrowLeft size={16} className="mr-1" />
              Back
            </Button>
          </div>
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  // Error state
  if (error || !pib) {
    return (
      <AppLayout>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/pib")}>
              <ArrowLeft size={16} className="mr-1" />
              Back
            </Button>
          </div>
          <Card>
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">Document Not Found</h2>
              <p className="text-muted-foreground mb-4">
                {error || "The requested document could not be found."}
              </p>
              <Button onClick={() => navigate("/pib")}>
                Return to PIB List
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const isLocked = PIB_STATUS_CONFIG[pib.status]?.isLocked || false;
  const canEdit =
    !isLocked && (permissions.canEditPIB || role === "super_admin");
  const canApprove = permissions.canApproveDocs || role === "super_admin";

  const handleAction = async () => {
    if (!pib || !id) return;

    setIsProcessing(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (actionType === "approve") {
        // Step 1: Validate metadata exists
        const metadata = (pib as any).metadata as PIBMetadata | undefined;

        if (!metadata || Object.keys(metadata).length === 0) {
          toast.error(
            "Cannot approve: Metadata is empty. Please edit and save the PIB first.",
          );
          return;
        }

        // Step 2: Validate metadata
        const validation = validatePIBMetadata(metadata);
        if (!validation.isValid) {
          toast.error(`Validation failed:\n${validation.errors.join("\n")}`);
          return;
        }

        // Step 3: Update status to APPROVED
        const { error: updateError } = await supabase
          .from("pib_documents")
          .update({
            status: "APPROVED",
            approved_at: new Date().toISOString(),
            approved_by: user?.id,
            notes: actionNotes || pib.notes,
            updated_at: new Date().toISOString(),
            updated_by: user?.id,
          })
          .eq("id", id);

        if (updateError) {
          throw new Error(`Failed to update status: ${updateError.message}`);
        }

        // Step 4: Log audit event
        await createAuditLog({
          action: "APPROVE",
          entity_type: "PIB",
          entity_id: id,
          entity_number: pib.document_number || undefined,
          before_data: { status: pib.status },
          after_data: { status: "APPROVED" },
          actor_id: user?.id,
          notes: `PIB ${pib.document_number || id} approved`,
        });

        // Step 5: Submit to CEISA
        toast.info("Submitting to CEISA...");
        console.log("PIBDetailPage: Calling submitPIBToCEISAFromMetadata with id:", id);
        console.log("PIBDetailPage: PIB metadata:", (pib as any).metadata);
        const result = await submitPIBToCEISAFromMetadata(id);
        console.log("PIBDetailPage: CEISA submission result:", result);

        if (result.success) {
          // Update status to sent
          await supabase
            .from("pib_documents")
            .update({
              status: "CEISA_ACCEPTED",
              ceisa_response: JSON.stringify(result),
              updated_at: new Date().toISOString(),
            })
            .eq("id", id);

          toast.success("Document approved and sent to CEISA successfully!");

          // Log CEISA submission
          await createAuditLog({
            action: "SUBMIT",
            entity_type: "PIB",
            entity_id: id,
            entity_number: pib.document_number || undefined,
            after_data: {
              registration_number: result.registration_number,
              status: "CEISA_ACCEPTED",
            },
            actor_id: user?.id,
            notes: `PIB ${pib.document_number || id} submitted to CEISA`,
          });
        } else {
          // Still approved but CEISA failed
          toast.error(
            `Approved but CEISA submission failed: ${result.error_message}`,
          );

          // Log failed submission
          await createAuditLog({
            action: "SUBMIT",
            entity_type: "PIB",
            entity_id: id,
            entity_number: pib.document_number || undefined,
            after_data: {
              error: result.error_message,
              error_type: result.error_type,
              status: "submission_failed",
            },
            actor_id: user?.id,
            notes: `CEISA submission failed: ${result.error_message}`,
          });
        }
      } else if (actionType === "reject") {
        if (!actionNotes.trim()) {
          toast.error("Please provide rejection reason");
          return;
        }

        const { error: updateError } = await supabase
          .from("pib_documents")
          .update({
            status: "CEISA_REJECTED",
            notes: actionNotes,
            updated_at: new Date().toISOString(),
            updated_by: user?.id,
          })
          .eq("id", id);

        if (updateError) {
          throw new Error(`Failed to reject: ${updateError.message}`);
        }

        await createAuditLog({
          action: "REJECT",
          entity_type: "PIB",
          entity_id: id,
          entity_number: pib.document_number || undefined,
          before_data: { status: pib.status },
          after_data: { status: "CEISA_REJECTED", reason: actionNotes },
          actor_id: user?.id,
          notes: `PIB ${pib.document_number || id} rejected: ${actionNotes}`,
        });

        toast.success("Document rejected");
      } else if (actionType === "send_ppjk") {
        const { error: updateError } = await supabase
          .from("pib_documents")
          .update({
            status: "SENT_TO_PPJK",
            notes: actionNotes || pib.notes,
            updated_at: new Date().toISOString(),
            updated_by: user?.id,
          })
          .eq("id", id);

        if (updateError) {
          throw new Error(`Failed to send to PPJK: ${updateError.message}`);
        }

        await createAuditLog({
          action: "UPDATE",
          entity_type: "PIB",
          entity_id: id,
          entity_number: pib.document_number || undefined,
          before_data: { status: pib.status },
          after_data: { status: "SENT_TO_PPJK" },
          actor_id: user?.id,
          notes: `PIB ${pib.document_number || id} sent to PPJK for review`,
        });

        toast.success("Document sent to PPJK");
      }

      // Refresh data
      await fetchPIB();
      setActionDialogOpen(false);
      setActionNotes("");
    } catch (error) {
      console.error("Action failed:", error);
      toast.error(error instanceof Error ? error.message : "Action failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const openActionDialog = (type: "approve" | "reject" | "send_ppjk") => {
    setActionType(type);
    setActionDialogOpen(true);
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/pib")}
            >
              <ArrowLeft size={18} />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold font-mono">
                  {pib.document_number}
                </h1>
                <PIBStatusBadge status={pib.status} showIcon />
                {pib.lane && <PIBLaneBadge lane={pib.lane} />}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {pib.registration_number
                  ? `Reg: ${pib.registration_number}`
                  : "Not registered"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/pib/${id}/edit`)}
                className="gap-1.5"
              >
                <Pencil size={14} />
                Edit
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setXmlPreviewOpen(true)}
              className="gap-1.5"
            >
              <Code size={14} />
              View XML
            </Button>
            {canApprove && pib.status === "SUBMITTED" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openActionDialog("send_ppjk")}
                  className="gap-1.5"
                >
                  <Send size={14} />
                  Send to PPJK
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openActionDialog("reject")}
                  className="gap-1.5 text-destructive"
                >
                  <XCircle size={14} />
                  Reject
                </Button>
                <Button
                  size="sm"
                  onClick={() => openActionDialog("approve")}
                  className="gap-1.5"
                >
                  <CheckCircle size={14} />
                  Approve & Send
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Lock Banner */}
        {isLocked && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2">
            <Lock className="h-4 w-4 text-amber-600" />
            <span className="text-sm text-amber-700">
              This document is locked and cannot be edited. Status:{" "}
              {PIB_STATUS_CONFIG[pib.status].description}
            </span>
          </div>
        )}

        {/* Lane Info */}
        {pib.lane && (
          <div
            className={cn(
              "rounded-lg p-3 flex items-center gap-2 border",
              PIB_LANE_CONFIG[pib.lane].color,
            )}
          >
            <span className="text-sm font-medium">
              {PIB_LANE_CONFIG[pib.lane].label}:{" "}
              {PIB_LANE_CONFIG[pib.lane].description}
            </span>
          </div>
        )}

        {/* Content */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <Tabs defaultValue="details">
              <TabsList>
                <TabsTrigger value="details" className="text-xs">
                  Details
                </TabsTrigger>
                <TabsTrigger value="items" className="text-xs">
                  Items ({pib.items?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="documents" className="text-xs">
                  Documents
                </TabsTrigger>
                <TabsTrigger value="timeline" className="text-xs">
                  Timeline
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Importer */}
                  <Card>
                    <CardHeader className="py-3 px-4">
                      <CardTitle className="text-sm">Importer</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 pt-0 text-sm space-y-2">
                      <div>
                        <span className="text-muted-foreground text-xs">
                          Name
                        </span>
                        <p className="font-medium">{pib.importer_name}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">
                          NPWP
                        </span>
                        <p className="font-mono">{pib.importer_npwp}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">
                          API
                        </span>
                        <p className="font-mono">
                          {pib.importer_api || (
                            <span className="text-amber-600">
                              Not Available
                            </span>
                          )}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">
                          Address
                        </span>
                        <p>{pib.importer_address}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Supplier */}
                  <Card>
                    <CardHeader className="py-3 px-4">
                      <CardTitle className="text-sm">Supplier</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 pt-0 text-sm space-y-2">
                      <div>
                        <span className="text-muted-foreground text-xs">
                          Name
                        </span>
                        <p className="font-medium">{pib.supplier_name}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">
                          Country
                        </span>
                        <p>{pib.supplier_country}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">
                          Address
                        </span>
                        <p>{pib.supplier_address}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Transport */}
                <Card>
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-sm">
                      Transport & Shipping
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 pt-0">
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground text-xs">
                          Customs Office
                        </span>
                        <p className="font-medium">{pib.customs_office_name}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {pib.customs_office_code}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">
                          Loading Port
                        </span>
                        <p className="font-medium">{pib.loading_port_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {pib.loading_country}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">
                          Discharge Port
                        </span>
                        <p className="font-medium">{pib.discharge_port_name}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {pib.discharge_port_code}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">
                          Vessel
                        </span>
                        <p className="font-medium">{pib.vessel_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Voyage: {pib.voyage_number}
                        </p>
                      </div>
                    </div>
                    <Separator className="my-3" />
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground text-xs">
                          B/L Number
                        </span>
                        <p className="font-mono">{pib.bl_awb_number}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">
                          B/L Date
                        </span>
                        <p className="font-mono">{pib.bl_awb_date}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">
                          Incoterm
                        </span>
                        <p className="font-medium">{pib.incoterm_code}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">
                          PPJK
                        </span>
                        <p className="font-medium">{pib.ppjk_name || "-"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Summary */}
                <Card>
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-sm">Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 pt-0">
                    <div className="grid grid-cols-5 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground text-xs">
                          Packages
                        </span>
                        <p className="font-mono font-medium">
                          {pib.total_packages} {pib.package_unit}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">
                          Gross Weight
                        </span>
                        <p className="font-mono font-medium">
                          {pib.gross_weight?.toLocaleString()} kg
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">
                          Net Weight
                        </span>
                        <p className="font-mono font-medium">
                          {pib.net_weight?.toLocaleString()} kg
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">
                          CIF Value
                        </span>
                        <p className="font-mono font-bold text-primary">
                          {pib.currency_code}{" "}
                          {pib.total_cif_value?.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">
                          Total Tax
                        </span>
                        <p className="font-mono font-bold text-primary">
                          IDR {pib.total_tax?.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="items" className="mt-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/30 border-b">
                          <tr className="text-left">
                            <th className="p-2 px-3 font-medium text-muted-foreground text-xs">
                              #
                            </th>
                            <th className="p-2 font-medium text-muted-foreground text-xs">
                              HS Code
                            </th>
                            <th className="p-2 font-medium text-muted-foreground text-xs">
                              Description
                            </th>
                            <th className="p-2 font-medium text-muted-foreground text-xs text-right">
                              Qty
                            </th>
                            <th className="p-2 font-medium text-muted-foreground text-xs text-right">
                              CIF (IDR)
                            </th>
                            <th className="p-2 font-medium text-muted-foreground text-xs text-right">
                              BM
                            </th>
                            <th className="p-2 font-medium text-muted-foreground text-xs text-right">
                              PPN
                            </th>
                            <th className="p-2 font-medium text-muted-foreground text-xs text-right">
                              PPh
                            </th>
                            <th className="p-2 font-medium text-muted-foreground text-xs text-right">
                              Total Tax
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {pib.items?.map((item) => (
                            <tr
                              key={item.id}
                              className="border-b last:border-0"
                            >
                              <td className="p-2 px-3">{item.item_number}</td>
                              <td className="p-2 font-mono text-xs">
                                {item.hs_code}
                              </td>
                              <td className="p-2 max-w-[150px] truncate">
                                {item.product_description}
                              </td>
                              <td className="p-2 text-right font-mono">
                                {item.quantity} {item.quantity_unit}
                              </td>
                              <td className="p-2 text-right font-mono">
                                {item.cif_idr?.toLocaleString()}
                              </td>
                              <td className="p-2 text-right font-mono text-xs">
                                {item.bm_amount?.toLocaleString()}
                                <br />
                                <span className="text-muted-foreground">
                                  ({item.bm_rate}%)
                                </span>
                              </td>
                              <td className="p-2 text-right font-mono text-xs">
                                {item.ppn_amount?.toLocaleString()}
                                <br />
                                <span className="text-muted-foreground">
                                  ({item.ppn_rate}%)
                                </span>
                              </td>
                              <td className="p-2 text-right font-mono text-xs">
                                {item.pph_amount?.toLocaleString()}
                                <br />
                                <span className="text-muted-foreground">
                                  ({item.pph_rate}%)
                                </span>
                              </td>
                              <td className="p-2 text-right font-mono font-medium">
                                {item.total_tax?.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="documents" className="mt-4">
                <Card>
                  <CardContent className="p-4">
                    {documents.length > 0 ? (
                      <div className="space-y-2">
                        {documents.map((doc, index) => (
                          <div
                            key={doc.id || index}
                            className="flex items-center justify-between p-3 border rounded-lg bg-slate-50"
                          >
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">
                                  {doc.file_name || "Unknown file"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {doc.doc_type === "INVOICE" &&
                                    "Commercial Invoice"}
                                  {doc.doc_type === "PACKING_LIST" &&
                                    "Packing List"}
                                  {doc.doc_type === "BL" && "Bill of Lading"}
                                  {doc.doc_type === "AWB" && "Airway Bill"}
                                  {doc.doc_type === "INSURANCE" &&
                                    "Insurance Certificate"}
                                  {doc.doc_type === "COO" &&
                                    "Certificate of Origin"}
                                  {doc.doc_type === "PERMIT" && "Import Permit"}
                                  {doc.doc_type === "OTHER" && "Other Document"}
                                  {![
                                    "INVOICE",
                                    "PACKING_LIST",
                                    "BL",
                                    "AWB",
                                    "INSURANCE",
                                    "COO",
                                    "PERMIT",
                                    "OTHER",
                                  ].includes(doc.doc_type) && doc.doc_type}
                                </p>
                              </div>
                            </div>
                            {doc.file_url && (
                              <a
                                href={doc.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-sm"
                              >
                                View
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground py-8">
                        <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No documents attached</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="timeline" className="mt-4">
                <Card>
                  <CardContent className="p-4">
                    <PIBStatusTimeline history={pib.status_history || []} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Tax Breakdown Panel */}
          <div className="col-span-1">
            <PIBTaxBreakdown
              items={pib.items || []}
              currencyCode={pib.currency_code || "USD"}
              exchangeRate={pib.exchange_rate || 15750}
              fobValue={pib.fob_value}
              freightValue={pib.freight_value}
              insuranceValue={pib.insurance_value}
              hasAPI={!!pib.importer_api}
            />
          </div>
        </div>

        {/* Created/Updated Info */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Created: {new Date(pib.created_at).toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Updated: {new Date(pib.updated_at).toLocaleString()}
          </span>
        </div>
      </div>

      {/* XML Preview */}
      <PIBXMLPreview
        pib={pib}
        isOpen={xmlPreviewOpen}
        onClose={() => setXmlPreviewOpen(false)}
      />

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              {actionType === "approve" && (
                <CheckCircle className="h-4 w-4 text-emerald-600" />
              )}
              {actionType === "reject" && (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              {actionType === "send_ppjk" && (
                <Send className="h-4 w-4 text-blue-600" />
              )}
              {actionType === "approve" && "Approve & Send to CEISA"}
              {actionType === "reject" && "Reject Document"}
              {actionType === "send_ppjk" && "Send to PPJK"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {actionType === "reject" && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                <p className="text-sm text-amber-700">
                  Rejecting will allow the operator to make corrections and
                  resubmit.
                </p>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium">Notes</label>
              <Textarea
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder={
                  actionType === "reject"
                    ? "Please provide reason for rejection..."
                    : "Add notes (optional)..."
                }
                className="text-sm min-h-[80px]"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActionDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleAction}
              disabled={
                isProcessing || (actionType === "reject" && !actionNotes)
              }
              className={cn(
                actionType === "reject" &&
                  "bg-destructive hover:bg-destructive/90",
              )}
            >
              {isProcessing ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
