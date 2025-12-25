import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  FileOutput, 
  FileInput, 
  RefreshCw, 
  Users, 
  Package, 
  Anchor, 
  DollarSign,
  Shield,
  BarChart3,
  Settings,
  UsersRound,
  Warehouse,
  Truck,
  ShoppingCart,
  Globe,
  Ship,
  FileText,
  Banknote,
  Building2,
  Box,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRole, getRoleLabel, UserRole } from '@/hooks/useRole';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type PermissionKey = 
  | 'canAccessPEB'
  | 'canAccessPIB'
  | 'canAccessCEISA'
  | 'canAccessMasterData'
  | 'canAccessAuditLog'
  | 'canAccessReports'
  | 'canAccessUserManagement'
  | 'canAccessSettings';

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  permission?: PermissionKey;
}

interface NavGroup {
  title: string;
  items: NavItem[];
  permission?: PermissionKey;
}

const navigation: NavGroup[] = [
  {
    title: 'OPERATIONS',
    items: [
      { title: 'Dashboard', href: '/dashboard', icon: <Home size={18} /> },
      { title: 'Export - PEB', href: '/peb', icon: <FileOutput size={18} />, permission: 'canAccessPEB' },
      { title: 'Import - PIB', href: '/pib', icon: <FileInput size={18} />, permission: 'canAccessPIB' },
      { title: 'EDI / CEISA', href: '/ceisa', icon: <RefreshCw size={18} />, permission: 'canAccessCEISA' },
    ],
  },
  {
    title: 'SINGLE CORE',
    permission: 'canAccessCEISA',
    items: [
      { title: 'Dokumen Pabean', href: '/single-core', icon: <FileText size={18} /> },
    ],
  },
  {
    title: 'MASTER DATA',
    permission: 'canAccessMasterData',
    items: [
      { title: 'Companies', href: '/master/companies', icon: <Building2 size={18} /> },
      { title: 'Warehouses / TPS', href: '/master/warehouses', icon: <Warehouse size={18} /> },
      { title: 'Suppliers', href: '/master/suppliers', icon: <Truck size={18} /> },
      { title: 'Buyers', href: '/master/buyers', icon: <ShoppingCart size={18} /> },
      { title: 'HS Codes', href: '/master/hs-codes', icon: <Package size={18} /> },
      { title: 'Products', href: '/master/products', icon: <Box size={18} /> },
      { title: 'Packaging', href: '/master/packaging', icon: <Package size={18} /> },
      { title: 'Countries', href: '/master/countries', icon: <Globe size={18} /> },
      { title: 'Ports', href: '/master/ports', icon: <Ship size={18} /> },
      { title: 'Incoterms', href: '/master/incoterms', icon: <FileText size={18} /> },
      { title: 'Currencies', href: '/master/currencies', icon: <Banknote size={18} /> },
      { title: 'PPJK', href: '/master/ppjk', icon: <Users size={18} /> },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      { title: 'Audit Log', href: '/audit-log', icon: <Shield size={18} />, permission: 'canAccessAuditLog' },
      { title: 'Reports', href: '/reports', icon: <BarChart3 size={18} />, permission: 'canAccessReports' },
      { title: 'User Management', href: '/users', icon: <UsersRound size={18} />, permission: 'canAccessUserManagement' },
      { title: 'Settings', href: '/settings', icon: <Settings size={18} />, permission: 'canAccessSettings' },
    ],
  },
];

const roleBadgeColors: Record<UserRole, string> = {
  export_staff: 'bg-blue-100 text-blue-800 border-blue-200',
  import_staff: 'bg-purple-100 text-purple-800 border-purple-200',
  finance: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  viewer: 'bg-slate-100 text-slate-800 border-slate-200',
  super_admin: 'bg-amber-100 text-amber-800 border-amber-200',
};

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const location = useLocation();
  const { role, permissions, loading } = useRole();

  const filteredNavigation = navigation
    .filter((group) => {
      if (group.permission) {
        return permissions[group.permission];
      }
      return true;
    })
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (item.permission) {
          return permissions[item.permission];
        }
        return true;
      }),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <aside className="w-60 h-full bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border">
      <div className="p-4 border-b border-sidebar-border flex items-start justify-between">
        <div>
          <h1 className="text-base font-semibold">Customs Operations</h1>
          <p className="text-xs text-sidebar-foreground/70 mt-0.5">Export-Import System</p>
          {role && !loading && (
            <Badge 
              variant="outline" 
              className={cn(
                "mt-2 text-xs font-medium border",
                roleBadgeColors[role]
              )}
            >
              {getRoleLabel(role)}
            </Badge>
          )}
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-8 w-8 text-sidebar-foreground/70 hover:text-sidebar-foreground"
            onClick={onClose}
          >
            <X size={18} />
          </Button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        {filteredNavigation.map((group) => (
          <div key={group.title} className="mb-4">
            <h2 className="px-4 text-[10px] font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-1">
              {group.title}
            </h2>
            <ul className="space-y-0.5 px-2">
              {group.items.map((item) => (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-2.5 px-2 py-1.5 text-sm rounded-md',
                      location.pathname === item.href
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                        : 'text-sidebar-foreground/90 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                    )}
                  >
                    {item.icon}
                    <span>{item.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-sidebar-border text-[10px] text-sidebar-foreground/50">
        <div>System v1.0.0</div>
        <div className="mt-0.5">Support: support@customs.gov</div>
      </div>
    </aside>
  );
}
