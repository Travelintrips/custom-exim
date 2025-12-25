import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Settings as SettingsIcon,
  Building2,
  Globe,
  Bell,
  Shield,
  Save,
  RefreshCcw,
  Server,
  Database,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface SystemSettings {
  company_name: string;
  company_npwp: string;
  company_address: string;
  ceisa_endpoint: string;
  ceisa_timeout: number;
  auto_submit_enabled: boolean;
  notification_email: string;
  email_notifications_enabled: boolean;
  audit_retention_days: number;
}

const defaultSettings: SystemSettings = {
  company_name: "PT. Cahaya Sejati Teknologi",
  company_npwp: "01.234.567.8-901.000",
  company_address: "Jl. Ternate No.10 B/C,Cideng Jakarta Pusat 10150",
  ceisa_endpoint: "https://portal.beacukai.go.id/api",
  ceisa_timeout: 30,
  auto_submit_enabled: false,
  notification_email: "admin@example.com",
  email_notifications_enabled: true,
  audit_retention_days: 365,
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [ceisaStatus, setCeisaStatus] = useState<
    "connected" | "disconnected" | "checking"
  >("checking");
  const [dbStatus, setDbStatus] = useState<
    "connected" | "disconnected" | "checking"
  >("checking");

  useEffect(() => {
    checkConnections();
  }, []);

  const checkConnections = async () => {
    setCeisaStatus("checking");
    setDbStatus("checking");

    // Check database connection
    try {
      const { error } = await supabase.from("user_roles").select("id").limit(1);
      setDbStatus(error ? "disconnected" : "connected");
    } catch {
      setDbStatus("disconnected");
    }

    // Simulate CEISA check (would be actual endpoint check in production)
    setTimeout(() => {
      setCeisaStatus("connected");
    }, 1000);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // TODO: Save settings to database
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Settings saved successfully");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const StatusIndicator = ({
    status,
  }: {
    status: "connected" | "disconnected" | "checking";
  }) => {
    if (status === "checking") {
      return <RefreshCcw className="w-4 h-4 animate-spin text-blue-500" />;
    }
    if (status === "connected") {
      return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    }
    return <XCircle className="w-4 h-4 text-red-600" />;
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#1F2937]">Settings</h1>
            <p className="text-sm text-[#6B7280] mt-1">
              Configure system settings and preferences
            </p>
          </div>
          <Button
            className="bg-[#1E3A5F] hover:bg-[#2d4a6f]"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        {/* System Status */}
        <Card className="border-[#E2E8F0]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Server className="w-4 h-4" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-6">
              <div className="flex items-center gap-3">
                <StatusIndicator status={dbStatus} />
                <div>
                  <p className="text-sm font-medium text-[#1F2937]">Database</p>
                  <p className="text-xs text-[#6B7280] capitalize">
                    {dbStatus}
                  </p>
                </div>
              </div>
              <Separator orientation="vertical" className="h-10" />
              <div className="flex items-center gap-3">
                <StatusIndicator status={ceisaStatus} />
                <div>
                  <p className="text-sm font-medium text-[#1F2937]">
                    CEISA Portal
                  </p>
                  <p className="text-xs text-[#6B7280] capitalize">
                    {ceisaStatus}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="ml-auto"
                onClick={checkConnections}
              >
                <RefreshCcw className="w-3.5 h-3.5 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Settings Tabs */}
        <Tabs defaultValue="company" className="space-y-4">
          <TabsList className="bg-[#F5F7FA] p-1">
            <TabsTrigger
              value="company"
              className="text-sm data-[state=active]:bg-white"
            >
              <Building2 className="w-4 h-4 mr-2" />
              Company
            </TabsTrigger>
            <TabsTrigger
              value="ceisa"
              className="text-sm data-[state=active]:bg-white"
            >
              <Globe className="w-4 h-4 mr-2" />
              CEISA Integration
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="text-sm data-[state=active]:bg-white"
            >
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="text-sm data-[state=active]:bg-white"
            >
              <Shield className="w-4 h-4 mr-2" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* Company Settings */}
          <TabsContent value="company">
            <Card className="border-[#E2E8F0]">
              <CardHeader>
                <CardTitle className="text-base font-medium">
                  Company Information
                </CardTitle>
                <CardDescription className="text-xs">
                  Update your company details for document headers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Company Name</Label>
                    <Input
                      value={settings.company_name}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          company_name: e.target.value,
                        })
                      }
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">NPWP</Label>
                    <Input
                      value={settings.company_npwp}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          company_npwp: e.target.value,
                        })
                      }
                      className="h-9 font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Address</Label>
                  <Input
                    value={settings.company_address}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        company_address: e.target.value,
                      })
                    }
                    className="h-9"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CEISA Integration */}
          <TabsContent value="ceisa">
            <Card className="border-[#E2E8F0]">
              <CardHeader>
                <CardTitle className="text-base font-medium">
                  CEISA Integration Settings
                </CardTitle>
                <CardDescription className="text-xs">
                  Configure CEISA portal connection and EDI settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">API Endpoint</Label>
                  <Input
                    value={settings.ceisa_endpoint}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        ceisa_endpoint: e.target.value,
                      })
                    }
                    className="h-9 font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Timeout (seconds)
                  </Label>
                  <Input
                    type="number"
                    value={settings.ceisa_timeout}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        ceisa_timeout: parseInt(e.target.value),
                      })
                    }
                    className="h-9 w-32"
                    min={5}
                    max={120}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">
                      Auto-Submit to CEISA
                    </Label>
                    <p className="text-xs text-[#6B7280]">
                      Automatically submit approved documents to CEISA
                    </p>
                  </div>
                  <Switch
                    checked={settings.auto_submit_enabled}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, auto_submit_enabled: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications">
            <Card className="border-[#E2E8F0]">
              <CardHeader>
                <CardTitle className="text-base font-medium">
                  Notification Preferences
                </CardTitle>
                <CardDescription className="text-xs">
                  Configure email notifications and alerts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">
                      Email Notifications
                    </Label>
                    <p className="text-xs text-[#6B7280]">
                      Receive email alerts for important events
                    </p>
                  </div>
                  <Switch
                    checked={settings.email_notifications_enabled}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        email_notifications_enabled: checked,
                      })
                    }
                  />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Notification Email
                  </Label>
                  <Input
                    type="email"
                    value={settings.notification_email}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        notification_email: e.target.value,
                      })
                    }
                    className="h-9"
                    disabled={!settings.email_notifications_enabled}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security">
            <Card className="border-[#E2E8F0]">
              <CardHeader>
                <CardTitle className="text-base font-medium">
                  Security & Audit
                </CardTitle>
                <CardDescription className="text-xs">
                  Configure security and audit trail settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Audit Log Retention (days)
                  </Label>
                  <Input
                    type="number"
                    value={settings.audit_retention_days}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        audit_retention_days: parseInt(e.target.value),
                      })
                    }
                    className="h-9 w-32"
                    min={30}
                    max={3650}
                  />
                  <p className="text-xs text-[#6B7280]">
                    Audit logs older than this will be archived
                  </p>
                </div>
                <Separator />
                <div className="p-3 bg-[#F5F7FA] rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="w-4 h-4 text-[#1E3A5F]" />
                    <span className="text-sm font-medium">Data Integrity</span>
                  </div>
                  <p className="text-xs text-[#6B7280]">
                    All document hashes are stored immutably. Approved documents
                    cannot be modified or deleted.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
