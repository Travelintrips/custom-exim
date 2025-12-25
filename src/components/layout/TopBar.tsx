import { Bell, Search, User, LogOut, Activity, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../../../supabase/auth';
import { useNavigate } from 'react-router-dom';
import { useRole, getRoleLabel, UserRole } from '@/hooks/useRole';
import { cn } from '@/lib/utils';

const roleBadgeColors: Record<UserRole, string> = {
  export_staff: 'bg-blue-100 text-blue-800 border-blue-200',
  import_staff: 'bg-purple-100 text-purple-800 border-purple-200',
  finance: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  viewer: 'bg-slate-100 text-slate-800 border-slate-200',
  super_admin: 'bg-amber-100 text-amber-800 border-amber-200',
};

interface TopBarProps {
  onMenuClick?: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { user, signOut } = useAuth();
  const { role, permissions } = useRole();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <header className="h-14 bg-card border-b border-border flex items-center justify-between px-3 sm:px-4">
      <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-md">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-8 w-8"
          onClick={onMenuClick}
        >
          <Menu size={18} />
        </Button>

        <div className="relative flex-1 hidden sm:block">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            type="text"
            placeholder="Quick search..."
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {permissions.canAccessCEISA && (
          <div className="flex items-center gap-1.5 text-xs">
            <Activity size={14} className="text-emerald-600" />
            <span className="text-muted-foreground">CEISA:</span>
            <span className="text-emerald-600 font-medium">Connected</span>
          </div>
        )}

        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Bell size={16} />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-destructive rounded-full"></span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 h-8 px-2">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                <User size={14} />
              </div>
              <div className="text-left hidden md:block">
                <div className="text-xs font-medium">{user?.email?.split('@')[0] || 'User'}</div>
                {role && (
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-[10px] px-1 py-0 font-medium border",
                      roleBadgeColors[role]
                    )}
                  >
                    {getRoleLabel(role)}
                  </Badge>
                )}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="text-xs">My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-sm">
              <User className="mr-2 h-3.5 w-3.5" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout} className="text-sm">
              <LogOut className="mr-2 h-3.5 w-3.5" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
