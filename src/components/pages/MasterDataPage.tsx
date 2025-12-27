import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MasterDataTable } from '@/components/master-data/MasterDataTable';
import { MasterDataForm } from '@/components/master-data/MasterDataForm';
import { MasterDataHistoryDialog } from '@/components/master-data/MasterDataHistory';
import { ImportExcelDialog } from '@/components/master-data/ImportExcelDialog';
import { 
  MasterDataType, 
  BaseMasterData, 
  Company, 
  HSCode, 
  Warehouse,
  Supplier,
  Buyer,
  Product,
  Packaging,
  Country,
  Port,
  Incoterm,
  Currency,
  PPJK,
  MasterDataHistory,
} from '@/types/master-data';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/lib/supabase';
import { syncHSCodes } from '@/lib/edi/ceisa-sync-service';

const tabConfig: { value: MasterDataType; label: string }[] = [
  { value: 'companies', label: 'Companies' },
  { value: 'warehouses', label: 'Warehouses' },
  { value: 'suppliers', label: 'Suppliers' },
  { value: 'buyers', label: 'Buyers' },
  { value: 'hs_codes', label: 'HS Codes' },
  { value: 'products', label: 'Products' },
  { value: 'packaging', label: 'Packaging' },
  { value: 'countries', label: 'Countries' },
  { value: 'ports', label: 'Ports' },
  { value: 'incoterms', label: 'Incoterms' },
  { value: 'currencies', label: 'Currencies' },
  { value: 'ppjk', label: 'PPJK' },
];

// Map URL paths to tab values
const urlToTabMap: Record<string, MasterDataType> = {
  'companies': 'companies',
  'warehouses': 'warehouses',
  'suppliers': 'suppliers',
  'buyers': 'buyers',
  'hs-codes': 'hs_codes',
  'products': 'products',
  'packaging': 'packaging',
  'countries': 'countries',
  'ports': 'ports',
  'incoterms': 'incoterms',
  'currencies': 'currencies',
  'ppjk': 'ppjk',
};

// Map tab values to URL paths
const tabToUrlMap: Record<MasterDataType, string> = {
  'companies': 'companies',
  'warehouses': 'warehouses',
  'suppliers': 'suppliers',
  'buyers': 'buyers',
  'hs_codes': 'hs-codes',
  'products': 'products',
  'packaging': 'packaging',
  'countries': 'countries',
  'ports': 'ports',
  'incoterms': 'incoterms',
  'currencies': 'currencies',
  'ppjk': 'ppjk',
};

export default function MasterDataPage() {
  const { '*': subPath } = useParams();
  const navigate = useNavigate();
  
  // Initialize tab from URL parameter or default to 'companies'
  const initialTab = subPath && urlToTabMap[subPath] ? urlToTabMap[subPath] : 'companies';
  const [activeTab, setActiveTab] = useState<MasterDataType>(initialTab);
  const [data, setData] = useState<Record<MasterDataType, BaseMasterData[]>>({
    companies: [],
    warehouses: [],
    suppliers: [],
    buyers: [],
    hs_codes: [],
    products: [],
    packaging: [],
    countries: [],
    ports: [],
    incoterms: [],
    currencies: [],
    ppjk: [],
  });
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<MasterDataHistory[]>([]);
  
  // Sync tab with URL parameter changes
  useEffect(() => {
    if (subPath && urlToTabMap[subPath]) {
      setActiveTab(urlToTabMap[subPath]);
    } else if (!subPath) {
      // If no subpath, default to companies
      setActiveTab('companies');
    }
  }, [subPath]);

  // Fetch data from Supabase
  const fetchData = useCallback(async (tab: MasterDataType) => {
    setLoading(true);
    try {
      const { data: fetchedData, error } = await supabase
        .from(tab)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setData(prev => ({
        ...prev,
        [tab]: fetchedData || [],
      }));
    } catch (error) {
      console.error(`Error fetching ${tab}:`, error);
      // Set empty array on error - no fallback to dummy data
      setData(prev => ({
        ...prev,
        [tab]: [],
      }));
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch data when tab changes
  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab, fetchData]);
  
  // Handle tab change and update URL
  const handleTabChange = (value: string) => {
    const newTab = value as MasterDataType;
    setActiveTab(newTab);
    navigate(`/master/${tabToUrlMap[newTab]}`);
  };
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedItem, setSelectedItem] = useState<BaseMasterData | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<BaseMasterData | null>(null);



  const getDataForTab = (tab: MasterDataType): BaseMasterData[] => {
    return data[tab] || [];
  };

  const handleAdd = () => {
    setSelectedItem(null);
    setFormMode('create');
    setFormOpen(true);
  };

  const handleEdit = (item: BaseMasterData) => {
    setSelectedItem(item);
    setFormMode('edit');
    setFormOpen(true);
  };

  const handleView = (item: BaseMasterData) => {
    setSelectedItem(item);
    setFormMode('view');
    setFormOpen(true);
  };

  const handleDelete = (item: BaseMasterData) => {
    setItemToDelete(item);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    
    try {
      // For companies, use soft delete (set is_active = false)
      if (activeTab === 'companies') {
        const { error } = await supabase
          .from('companies')
          .update({ is_active: false })
          .eq('id', itemToDelete.id);

        if (error) {
          if (error.message.includes('Cannot delete company')) {
            toast.error('Cannot delete: Company is referenced by existing documents');
            return;
          }
          throw error;
        }
        toast.success(`${itemToDelete.code} deactivated successfully`);
      } else {
        // For other tables, attempt actual delete
        const { error } = await supabase
          .from(activeTab)
          .delete()
          .eq('id', itemToDelete.id);

        if (error) throw error;
        toast.success(`${itemToDelete.code} deleted successfully`);
      }
      
      fetchData(activeTab);
    } catch (error: unknown) {
      console.error('Error deleting record:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete record';
      toast.error(errorMessage);
    } finally {
      setDeleteOpen(false);
      setItemToDelete(null);
    }
  };

  const handleViewHistory = async (item: BaseMasterData) => {
    setSelectedItem(item);
    // Fetch history for this item
    try {
      const { data: historyData, error } = await supabase
        .from('master_data_history')
        .select('*')
        .eq('table_name', activeTab)
        .eq('record_id', item.id)
        .order('changed_at', { ascending: false });

      if (!error && historyData) {
        setHistory(historyData as MasterDataHistory[]);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      setHistory([]);
    }
    setHistoryOpen(true);
  };

  const handleFormSubmit = async (formData: Record<string, unknown>) => {
    try {
      if (formMode === 'create') {
        // Remove id if present for new records and auto-fill metadata
        const { id, created_at, updated_at, created_by, updated_by, ...insertData } = formData;
        
        // Auto-fill source and effective_date for enterprise compliance
        const enrichedData = {
          ...insertData,
          source: 'manual',
          effective_date: new Date().toISOString().split('T')[0],
        };
        
        const { error } = await supabase
          .from(activeTab)
          .insert([enrichedData]);

        if (error) throw error;
        toast.success('Record created successfully');
      } else if (formMode === 'edit' && selectedItem) {
        // Check if record is referenced by PEB/PIB before update (for companies)
        if (activeTab === 'companies') {
          const [pebCheck, pibCheck] = await Promise.all([
            supabase.from('peb_documents').select('id', { count: 'exact', head: true }).eq('exporter_id', selectedItem.id),
            supabase.from('pib_documents').select('id', { count: 'exact', head: true }).eq('importer_id', selectedItem.id),
          ]);
          
          const pebCount = pebCheck.count || 0;
          const pibCount = pibCheck.count || 0;
          
          if (pebCount > 0 || pibCount > 0) {
            // Only allow is_active field update for referenced records
            const criticalFields = ['code', 'npwp', 'type'];
            const hasChangedCriticalFields = criticalFields.some(
              field => formData[field] !== (selectedItem as unknown as Record<string, unknown>)[field]
            );
            
            if (hasChangedCriticalFields) {
              toast.error(`Cannot modify critical fields: Company is referenced by ${pebCount} PEB and ${pibCount} PIB documents`);
              return;
            }
          }
        }
        
        // Update existing record
        const { id, created_at, created_by, ...updateData } = formData;
        
        const { error } = await supabase
          .from(activeTab)
          .update(updateData)
          .eq('id', selectedItem.id);

        if (error) throw error;
        toast.success('Record updated successfully');
      }
      
      setFormOpen(false);
      fetchData(activeTab); // Refresh data
    } catch (error: unknown) {
      console.error('Error saving record:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save record';
      toast.error(errorMessage);
    }
  };

  const handleImport = async (importData: Record<string, unknown>[]) => {
    try {
      // Auto-fill source = 'import_excel' and effective_date for imported records
      const enrichedData = importData.map(row => ({
        ...row,
        source: 'import_excel',
        effective_date: new Date().toISOString().split('T')[0],
        is_active: row.is_active ?? true,
      }));
      
      const { error } = await supabase
        .from(activeTab)
        .insert(enrichedData);

      if (error) throw error;
      toast.success(`${importData.length} records imported successfully`);
      setImportOpen(false);
      fetchData(activeTab);
    } catch (error: unknown) {
      console.error('Error importing records:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to import records';
      toast.error(errorMessage);
    }
  };

  const handleExport = () => {
    toast.info('Export started...');
  };

  const handleSyncCeisa = async () => {
    if (activeTab !== 'hs_codes') {
      toast.error('Sync CEISA only available for HS Codes');
      return;
    }

    toast.info('Syncing HS Codes from CEISA...');
    
    try {
      const result = await syncHSCodes();
      
      if (result.success) {
        toast.success(
          `Sync selesai! ${result.inserted} inserted, ${result.updated} updated`,
          { duration: 5000 }
        );
        // Refresh data
        fetchData(activeTab);
      } else {
        toast.error(`Sync failed: ${result.errors.join(', ')}`);
      }
    } catch (error: any) {
      toast.error('Gagal sync CEISA: ' + error.message);
    }
  };

  const renderExtraColumns = (item: BaseMasterData) => {
    if (activeTab === 'companies') {
      const company = item as Company;
      return (
        <Badge variant="outline" className="text-xs">
          {company.type || '-'}
        </Badge>
      );
    }
    if (activeTab === 'hs_codes') {
      const hsCode = item as HSCode;
      return (
        <span className="text-xs text-muted-foreground">
          BM: {hsCode.bm_rate ?? 0}% | PPN: {hsCode.ppn_rate ?? 0}%
        </span>
      );
    }
    if (activeTab === 'currencies') {
      const currency = item as Currency;
      return (
        <span className="text-xs font-mono">
          {currency.symbol || ''} {currency.exchange_rate?.toLocaleString() ?? '-'}
        </span>
      );
    }
    if (activeTab === 'ports') {
      const port = item as Port;
      return (
        <Badge variant="outline" className="text-xs">
          {port.type || '-'}
        </Badge>
      );
    }
    return null;
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        <Card>
          <CardContent className="p-4">
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="flex flex-wrap gap-1 h-auto bg-muted/30 p-1">
                {tabConfig.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="text-xs px-3 py-1.5 data-[state=active]:bg-background"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {tabConfig.map((tab) => (
                <TabsContent key={tab.value} value={tab.value} className="mt-4">
                  <MasterDataTable
                    dataType={tab.value}
                    data={getDataForTab(tab.value)}
                    onAdd={handleAdd}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onView={handleView}
                    onViewHistory={handleViewHistory}
                    onImportExcel={() => setImportOpen(true)}
                    onExportExcel={handleExport}
                    onSyncCeisa={tab.value === 'hs_codes' ? handleSyncCeisa : undefined}
                    renderExtraColumns={renderExtraColumns}
                  />
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Form Dialog */}
      <MasterDataForm
        dataType={activeTab}
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={selectedItem as unknown as Record<string, unknown> | null}
        mode={formMode}
      />

      {/* History Dialog */}
      <MasterDataHistoryDialog
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        itemCode={selectedItem?.code || ''}
        itemName={selectedItem?.name || ''}
        history={history}
      />

      {/* Import Dialog */}
      <ImportExcelDialog
        dataType={activeTab}
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={handleImport}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{itemToDelete?.code}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
