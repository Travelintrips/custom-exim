import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/lib/supabase";
import { Search, Plus, X, Check } from "lucide-react";
import { toast } from "sonner";

interface PPJK {
  id: string;
  code: string;
  name: string;
  npwp: string | null;
  nib: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  license_number: string | null;
  license_expiry: string | null;
  is_active: boolean;
}

interface PPJKSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (ppjk: PPJK) => void;
  selectedId?: string;
}

export function PPJKSearchDialog({
  open,
  onOpenChange,
  onSelect,
  selectedId,
}: PPJKSearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [ppjkList, setPpjkList] = useState<PPJK[]>([]);
  const [filteredList, setFilteredList] = useState<PPJK[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Form state for creating new PPJK
  const [formData, setFormData] = useState({
    name: "",
    npwp: "",
    nib: "",
    address: "",
    city: "",
    phone: "",
    license_number: "",
    license_expiry: "",
    is_active: true,
  });

  // Load PPJK list
  useEffect(() => {
    if (open) {
      loadPPJKList();
    }
  }, [open]);

  // Filter list based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredList(ppjkList);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredList(
        ppjkList.filter(
          (p) =>
            p.code.toLowerCase().includes(query) ||
            p.name.toLowerCase().includes(query) ||
            p.npwp?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, ppjkList]);

  const loadPPJKList = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("ppjk")
        .select("*")
        .eq("is_active", true)
        .order("code");

      if (error) throw error;
      setPpjkList(data || []);
      setFilteredList(data || []);
    } catch (error: any) {
      toast.error("Failed to load PPJK list: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const generateNextCode = async (): Promise<string> => {
    try {
      const { data, error } = await supabase
        .from("ppjk")
        .select("code")
        .like("code", "PPJK-%-___")
        .order("code", { ascending: false })
        .limit(1);

      if (error) throw error;

      if (!data || data.length === 0) {
        return `PPJK-${new Date().getFullYear()}-001`;
      }

      const lastCode = data[0].code;
      const match = lastCode.match(/PPJK-(\d{4})-(\d{3})/);

      if (match) {
        const year = new Date().getFullYear();
        const lastYear = parseInt(match[1]);
        const lastNumber = parseInt(match[2]);

        if (year === lastYear) {
          const nextNumber = (lastNumber + 1).toString().padStart(3, "0");
          return `PPJK-${year}-${nextNumber}`;
        } else {
          return `PPJK-${year}-001`;
        }
      }

      return `PPJK-${new Date().getFullYear()}-001`;
    } catch (error) {
      console.error("Error generating code:", error);
      return `PPJK-${new Date().getFullYear()}-001`;
    }
  };

  const handleCreateNew = async () => {
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    setLoading(true);
    try {
      const code = await generateNextCode();

      const { data, error } = await supabase
        .from("ppjk")
        .insert([
          {
            code,
            name: formData.name,
            npwp: formData.npwp || null,
            nib: formData.nib || null,
            address: formData.address || null,
            city: formData.city || null,
            phone: formData.phone || null,
            license_number: formData.license_number || null,
            license_expiry: formData.license_expiry || null,
            is_active: formData.is_active,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      toast.success("PPJK created successfully");
      
      // Reset form
      setFormData({
        name: "",
        npwp: "",
        nib: "",
        address: "",
        city: "",
        phone: "",
        license_number: "",
        license_expiry: "",
        is_active: true,
      });
      
      setShowCreateForm(false);
      await loadPPJKList();
      
      // Auto-select the newly created PPJK
      if (data) {
        onSelect(data);
        onOpenChange(false);
      }
    } catch (error: any) {
      toast.error("Failed to create PPJK: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (ppjk: PPJK) => {
    onSelect(ppjk);
    onOpenChange(false);
  };

  const handleClearSelection = () => {
    onSelect({
      id: "",
      code: "",
      name: "",
      npwp: null,
      nib: null,
      address: null,
      city: null,
      phone: null,
      license_number: null,
      license_expiry: null,
      is_active: true,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {showCreateForm ? "Create New PPJK" : "Search PPJK"}
          </DialogTitle>
        </DialogHeader>

        {!showCreateForm ? (
          <>
            {/* Search and actions */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by code, name, or NPWP..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowCreateForm(true)}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New
              </Button>
              {selectedId && (
                <Button
                  variant="outline"
                  onClick={handleClearSelection}
                  size="sm"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>

            {/* Results list */}
            <ScrollArea className="flex-1 border rounded-md min-h-[300px] max-h-[500px]">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <p className="text-sm text-muted-foreground">Loading...</p>
                </div>
              ) : filteredList.length === 0 ? (
                <div className="flex items-center justify-center h-32">
                  <p className="text-sm text-muted-foreground">
                    {searchQuery
                      ? "No PPJK found matching your search"
                      : "No active PPJK found"}
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredList.map((ppjk) => (
                    <button
                      key={ppjk.id}
                      onClick={() => handleSelect(ppjk)}
                      className="w-full text-left p-4 hover:bg-muted/50 transition-colors flex items-start gap-3"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-sm font-medium">
                            {ppjk.code}
                          </span>
                          {selectedId === ppjk.id && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <p className="font-medium">{ppjk.name}</p>
                        {ppjk.npwp && (
                          <p className="text-sm text-muted-foreground">
                            NPWP: {ppjk.npwp}
                          </p>
                        )}
                        {ppjk.address && (
                          <p className="text-sm text-muted-foreground">
                            {ppjk.address}
                            {ppjk.city && `, ${ppjk.city}`}
                          </p>
                        )}
                        {ppjk.phone && (
                          <p className="text-sm text-muted-foreground">
                            Phone: {ppjk.phone}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </>
        ) : (
          <>
            {/* Create form */}
            <ScrollArea className="flex-1 pr-4 max-h-[500px]">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>
                    Code <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value="Auto-generated (e.g., PPJK-2026-001)"
                    disabled
                    className="bg-muted/30"
                  />
                </div>

                <div className="space-y-2">
                  <Label>
                    Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter PPJK name"
                  />
                </div>

                <div className="space-y-2">
                  <Label>NPWP</Label>
                  <Input
                    value={formData.npwp}
                    onChange={(e) =>
                      setFormData({ ...formData, npwp: e.target.value })
                    }
                    placeholder="Enter NPWP"
                  />
                </div>

                <div className="space-y-2">
                  <Label>NIB</Label>
                  <Input
                    value={formData.nib}
                    onChange={(e) =>
                      setFormData({ ...formData, nib: e.target.value })
                    }
                    placeholder="Enter NIB"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder="Enter address"
                  />
                </div>

                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    placeholder="Enter city"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="Enter phone"
                  />
                </div>

                <div className="space-y-2">
                  <Label>License Number</Label>
                  <Input
                    value={formData.license_number}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        license_number: e.target.value,
                      })
                    }
                    placeholder="Enter license number"
                  />
                </div>

                <div className="space-y-2">
                  <Label>License Expiry</Label>
                  <Input
                    type="date"
                    value={formData.license_expiry}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        license_expiry: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_active: !!checked })
                    }
                  />
                  <Label
                    htmlFor="is_active"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Active
                  </Label>
                </div>
              </div>
            </ScrollArea>

            {/* Form actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false);
                  setFormData({
                    name: "",
                    npwp: "",
                    nib: "",
                    address: "",
                    city: "",
                    phone: "",
                    license_number: "",
                    license_expiry: "",
                    is_active: true,
                  });
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateNew} disabled={loading}>
                {loading ? "Creating..." : "Create PPJK"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
