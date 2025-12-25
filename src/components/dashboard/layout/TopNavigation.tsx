import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Bell, Home, Search, Settings, User, CheckCircle2, XCircle, Clock, FileText } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../../supabase/auth";
import { 
  fetchNotifications, 
  fetchUnreadCount, 
  markAsRead, 
  markAllAsRead,
  subscribeToNotifications,
  Notification 
} from "@/lib/notifications/notification-service";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TopNavigationProps {
  onSearch?: (query: string) => void;
}

const TopNavigation = ({
  onSearch = () => { },
}: TopNavigationProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  
  // Notification state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);

  // Fetch notifications on mount
  useEffect(() => {
    const loadNotifications = async () => {
      setIsLoadingNotifications(true);
      const [notifs, count] = await Promise.all([
        fetchNotifications({ limit: 10 }),
        fetchUnreadCount(),
      ]);
      setNotifications(notifs);
      setUnreadCount(count);
      setIsLoadingNotifications(false);
    };

    loadNotifications();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    
    // Subscribe to realtime notifications
    const unsubscribe = subscribeToNotifications((newNotif) => {
      setNotifications(prev => [newNotif, ...prev.slice(0, 9)]);
      setUnreadCount(prev => prev + 1);
    });
    
    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead(notificationId);
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const getNotificationIcon = (type: string, newStatus?: string) => {
    if (newStatus === 'APPROVED') return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
    if (newStatus === 'REJECTED') return <XCircle className="h-4 w-4 text-red-600" />;
    if (newStatus === 'PENDING') return <Clock className="h-4 w-4 text-amber-600" />;
    return <FileText className="h-4 w-4 text-blue-600" />;
  };

  if (!user) return null;

  return (
    <div className="w-full h-16 border-b border-gray-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-6 fixed top-0 z-50 shadow-sm">
      <div className="flex items-center gap-4 flex-1">
        <Link to="/" className="text-gray-900 hover:text-gray-700 transition-colors">
          <Home className="h-5 w-5" />
        </Link>
        <div className="relative w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search projects..."
            className="pl-9 h-10 rounded-full bg-gray-100 border-0 text-sm focus:ring-2 focus:ring-gray-200 focus-visible:ring-gray-200 focus-visible:ring-offset-0"
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative rounded-full h-9 w-9 bg-gray-100 hover:bg-gray-200 transition-colors">
                    <Bell className="h-4 w-4 text-gray-700" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-medium border border-white animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 rounded-xl overflow-hidden p-2 border border-gray-200 shadow-lg">
                  <div className="flex items-center justify-between px-2 py-1">
                    <DropdownMenuLabel className="text-sm font-medium text-gray-900 p-0">
                      Notifications
                    </DropdownMenuLabel>
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-6 px-2 text-blue-600 hover:text-blue-800"
                        onClick={(e) => {
                          e.preventDefault();
                          handleMarkAllAsRead();
                        }}
                      >
                        Mark all read
                      </Button>
                    )}
                  </div>
                  <DropdownMenuSeparator className="my-1 bg-gray-100" />
                  
                  {isLoadingNotifications ? (
                    <div className="py-4 text-center text-sm text-gray-500">
                      Loading...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="py-6 text-center text-sm text-gray-500">
                      <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p>Belum ada notifikasi</p>
                      <p className="text-xs">Notifikasi akan muncul saat status dokumen berubah</p>
                    </div>
                  ) : (
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.map((notification) => (
                        <DropdownMenuItem 
                          key={notification.id} 
                          className={cn(
                            "rounded-lg text-sm py-2 px-2 focus:bg-gray-100 cursor-pointer",
                            !notification.is_read && "bg-blue-50"
                          )}
                          onClick={() => {
                            if (!notification.is_read) {
                              handleMarkAsRead(notification.id);
                            }
                            // Navigate to document if reference exists
                            if (notification.nomor_aju) {
                              navigate(`/single-core-system?tab=pantauan&search=${notification.nomor_aju}`);
                            }
                          }}
                        >
                          <div className="flex gap-2 items-start w-full">
                            <div className="flex-shrink-0 mt-0.5">
                              {getNotificationIcon(notification.type, notification.new_status || undefined)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "font-medium text-xs truncate",
                                  !notification.is_read ? "text-gray-900" : "text-gray-600"
                                )}>
                                  {notification.title}
                                </span>
                                {!notification.is_read && (
                                  <Badge className="h-4 px-1 text-[10px] bg-red-500">New</Badge>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 truncate mt-0.5">
                                {notification.message}
                              </p>
                              <p className="text-[10px] text-gray-400 mt-1">
                                {new Date(notification.created_at).toLocaleString('id-ID', {
                                  day: '2-digit',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  )}
                  
                  <DropdownMenuSeparator className="my-1 bg-gray-100" />
                  <DropdownMenuItem 
                    className="rounded-lg text-sm py-2 text-center text-blue-600 hover:text-blue-800 justify-center"
                    onClick={() => navigate('/single-core-system?tab=pantauan')}
                  >
                    Lihat Semua Monitoring
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TooltipTrigger>
            <TooltipContent className="rounded-lg bg-gray-900 text-white text-xs px-3 py-1.5">
              <p>Notifications {unreadCount > 0 && `(${unreadCount} unread)`}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="h-8 w-8 hover:cursor-pointer">
              <AvatarImage
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                alt={user.email || ""}
              />
              <AvatarFallback>
                {user.email?.[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl border-none shadow-lg">
            <DropdownMenuLabel className="text-xs text-gray-500">{user.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer" onSelect={() => signOut()}>
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default TopNavigation;
