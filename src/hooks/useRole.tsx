import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from '../../supabase/auth';
import { supabase } from '@/lib/supabase';

export type UserRole = 'export_staff' | 'import_staff' | 'finance' | 'viewer' | 'super_admin';

interface RolePermissions {
  canAccessPEB: boolean;
  canAccessPIB: boolean;
  canAccessCEISA: boolean;
  canAccessMasterData: boolean;
  canAccessAuditLog: boolean;
  canAccessReports: boolean;
  canAccessUserManagement: boolean;
  canAccessSettings: boolean;
  canCreatePEB: boolean;
  canEditPEB: boolean;
  canDeletePEB: boolean;
  canCreatePIB: boolean;
  canEditPIB: boolean;
  canDeletePIB: boolean;
  canApproveDocs: boolean;
  canSyncCEISA: boolean;
  canViewTax: boolean;
  canEditMasterData: boolean;
  canAccessDebugMode: boolean;
  isReadOnly: boolean;
}

interface RoleContextType {
  role: UserRole | null;
  permissions: RolePermissions;
  loading: boolean;
}

const defaultPermissions: RolePermissions = {
  canAccessPEB: false,
  canAccessPIB: false,
  canAccessCEISA: false,
  canAccessMasterData: false,
  canAccessAuditLog: false,
  canAccessReports: false,
  canAccessUserManagement: false,
  canAccessSettings: false,
  canCreatePEB: false,
  canEditPEB: false,
  canDeletePEB: false,
  canCreatePIB: false,
  canEditPIB: false,
  canDeletePIB: false,
  canApproveDocs: false,
  canSyncCEISA: false,
  canViewTax: false,
  canEditMasterData: false,
  canAccessDebugMode: false,
  isReadOnly: true,
};

const rolePermissionsMap: Record<UserRole, RolePermissions> = {
  export_staff: {
    canAccessPEB: true,
    canAccessPIB: false,
    canAccessCEISA: true,
    canAccessMasterData: true,
    canAccessAuditLog: false,
    canAccessReports: false,
    canAccessUserManagement: false,
    canAccessSettings: false,
    canCreatePEB: true,
    canEditPEB: true,
    canDeletePEB: true,
    canCreatePIB: false,
    canEditPIB: false,
    canDeletePIB: false,
    canApproveDocs: false,
    canSyncCEISA: true,
    canViewTax: false,
    canEditMasterData: false,
    canAccessDebugMode: false,
    isReadOnly: false,
  },
  import_staff: {
    canAccessPEB: false,
    canAccessPIB: true,
    canAccessCEISA: true,
    canAccessMasterData: true,
    canAccessAuditLog: false,
    canAccessReports: false,
    canAccessUserManagement: false,
    canAccessSettings: false,
    canCreatePEB: false,
    canEditPEB: false,
    canDeletePEB: false,
    canCreatePIB: true,
    canEditPIB: true,
    canDeletePIB: true,
    canApproveDocs: false,
    canSyncCEISA: true,
    canViewTax: false,
    canEditMasterData: false,
    canAccessDebugMode: false,
    isReadOnly: false,
  },
  finance: {
    canAccessPEB: true,
    canAccessPIB: true,
    canAccessCEISA: false,
    canAccessMasterData: true,
    canAccessAuditLog: true,
    canAccessReports: true,
    canAccessUserManagement: false,
    canAccessSettings: false,
    canCreatePEB: false,
    canEditPEB: false,
    canDeletePEB: false,
    canCreatePIB: false,
    canEditPIB: false,
    canDeletePIB: false,
    canApproveDocs: false,
    canSyncCEISA: false,
    canViewTax: true,
    canEditMasterData: false,
    canAccessDebugMode: false,
    isReadOnly: true,
  },
  viewer: {
    canAccessPEB: true,
    canAccessPIB: true,
    canAccessCEISA: false,
    canAccessMasterData: true,
    canAccessAuditLog: true,
    canAccessReports: true,
    canAccessUserManagement: false,
    canAccessSettings: false,
    canCreatePEB: false,
    canEditPEB: false,
    canDeletePEB: false,
    canCreatePIB: false,
    canEditPIB: false,
    canDeletePIB: false,
    canApproveDocs: false,
    canSyncCEISA: false,
    canViewTax: false,
    canEditMasterData: false,
    canAccessDebugMode: false,
    isReadOnly: true,
  },
  super_admin: {
    canAccessPEB: true,
    canAccessPIB: true,
    canAccessCEISA: true,
    canAccessMasterData: true,
    canAccessAuditLog: true,
    canAccessReports: true,
    canAccessUserManagement: true,
    canAccessSettings: true,
    canCreatePEB: true,
    canEditPEB: true,
    canDeletePEB: true,
    canCreatePIB: true,
    canEditPIB: true,
    canDeletePIB: true,
    canApproveDocs: true,
    canSyncCEISA: true,
    canViewTax: true,
    canEditMasterData: true,
    canAccessDebugMode: true,
    isReadOnly: false,
  },
};

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserRole() {
      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          // Default to viewer if error (table may not exist or network issue)
          setRole('viewer');
        } else if (data?.role) {
          setRole(data.role as UserRole);
        } else {
          // No user record found, default to viewer
          setRole('viewer');
        }
      } catch (err) {
        // Default to viewer on any error
        setRole('viewer');
      } finally {
        setLoading(false);
      }
    }

    fetchUserRole();
  }, [user]);

  const permissions = role ? rolePermissionsMap[role] : defaultPermissions;

  return (
    <RoleContext.Provider value={{ role, permissions, loading }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}

export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    export_staff: 'Export Staff',
    import_staff: 'Import Staff',
    finance: 'Finance',
    viewer: 'Viewer',
    super_admin: 'Super Admin',
  };
  return labels[role];
}
