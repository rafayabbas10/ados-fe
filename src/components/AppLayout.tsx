"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAccount } from "@/contexts/AccountContext";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { 
  LayoutDashboard, 
  Play, 
  Settings, 
  LogOut, 
  User,
  Sparkles,
  Kanban,
  Microscope,
  Shield,
  Building2,
  ChevronDown,
  Menu,
  ChevronLeft,
  FileText
} from "lucide-react";

const navigationItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Research", url: "/research", icon: Microscope },
  { title: "Brief Builder", url: "/build-ai", icon: Sparkles },
  { title: "All Briefs", url: "/briefs", icon: FileText },
  { title: "Workflow", url: "/workflow", icon: Kanban },
  { title: "Settings", url: "/settings", icon: Settings },
];

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { selectedAccountId, setSelectedAccountId, accounts, loading } = useAccount();
  const { user, logout, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load collapse state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('sidebar-collapsed');
    if (savedState) {
      setIsCollapsed(savedState === 'true');
    }
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', String(newState));
  };

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(path);
  };

  const getNavClasses = (path: string) => {
    const active = isActive(path);
    return active 
      ? "bg-primary text-primary-foreground font-medium hover:bg-primary/90" 
      : "text-muted-foreground hover:text-foreground hover:bg-muted";
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'bg-purple-500 hover:bg-purple-600';
      case 'Strategist':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'Client':
        return 'bg-green-500 hover:bg-green-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  // Don't render if not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Sidebar - Fixed and Collapsible */}
      <div 
        className={`bg-card border-r shadow-card fixed left-0 top-0 h-full z-40 flex flex-col transition-all duration-300 ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Logo Section */}
        <div className="p-4 border-b flex items-center justify-between relative">
          {isCollapsed ? (
            <div className="flex items-center justify-center w-full">
              <div className="h-10 w-10 relative flex-shrink-0">
                <Image 
                  src="/logo.png" 
                  alt="adOS Logo" 
                  width={40}
                  height={40}
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 overflow-hidden transition-opacity duration-300">
              <div className="h-10 w-10 relative flex-shrink-0">
                <Image 
                  src="/logo.png" 
                  alt="adOS Logo" 
                  width={40}
                  height={40}
                  className="object-contain"
                  priority
                />
              </div>
              <div>
                <h1 className="font-bold text-lg text-foreground">adOS</h1>
                <p className="text-xs text-muted-foreground">Meta Ads Audit</p>
              </div>
            </div>
          )}
          
          {/* Toggle Button - Only show in expanded state */}
          {!isCollapsed && (
            <button
              onClick={toggleSidebar}
              className="absolute -right-4 top-1/2 -translate-y-1/2 z-50 h-8 w-8 rounded-lg bg-card hover:bg-muted border border-border shadow-md flex items-center justify-center transition-all duration-200 hover:shadow-lg"
              title="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4 text-foreground" />
            </button>
          )}
        </div>

        {/* Toggle Button in Collapsed State - At the top */}
        {isCollapsed && (
          <div className="px-3 py-3 border-b">
            <button
              onClick={toggleSidebar}
              className="w-full h-10 rounded-lg bg-muted/50 hover:bg-muted border border-border shadow-sm flex items-center justify-center transition-all duration-200 hover:shadow-md"
              title="Expand sidebar"
            >
              <Menu className="h-5 w-5 text-foreground" />
            </button>
          </div>
        )}

        {/* Account Selector */}
        {!isCollapsed && (
          <div className="p-4 border-b bg-muted/20">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Ad Account
                </p>
              </div>
              <Select value={selectedAccountId} onValueChange={setSelectedAccountId} disabled={loading}>
                <SelectTrigger className="w-full h-auto py-2.5 px-3 bg-card hover:bg-card/80 border-border hover:border-primary/50 transition-colors">
                  <div className="flex items-center gap-2 w-full">
                    <div className="flex-1 text-left">
                      <SelectValue placeholder={loading ? "Loading..." : "Select account"} />
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground opacity-50" />
                  </div>
                </SelectTrigger>
                <SelectContent className="w-[--radix-select-trigger-width]">
                  {accounts.map((account) => (
                    <SelectItem 
                      key={account.id} 
                      value={account.id}
                      className="py-3 px-3 cursor-pointer hover:bg-primary/10 focus:bg-primary/10 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Building2 className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex flex-col items-start min-w-0 flex-1">
                          <span className="font-medium text-sm text-foreground truncate w-full">
                            {account.account_name}
                          </span>
                          <span className="text-xs text-muted-foreground font-mono">
                            {account.facebook_account_id}
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="px-3 py-4 flex-1 overflow-y-auto">
          {!isCollapsed && (
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Navigation
            </p>
          )}
          <div className="space-y-1">
            {navigationItems.map((item) => (
              <button
                key={item.title}
                onClick={() => window.location.href = item.url}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 w-full text-left ${getNavClasses(item.url)} ${
                  isCollapsed ? 'justify-center' : ''
                }`}
                title={isCollapsed ? item.title : undefined}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && <span className="font-medium">{item.title}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* User info, Theme Toggle, and Logout at bottom */}
        <div className="p-3 border-t space-y-3">
          {/* Theme Toggle */}
          <div className={`flex ${isCollapsed ? 'justify-center' : 'px-3'}`}>
            <ThemeToggle isCollapsed={isCollapsed} />
          </div>

          {/* User Info */}
          {!isCollapsed ? (
            <div className="px-3 py-2 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                  {user.role === 'Admin' ? (
                    <Shield className="h-4 w-4 text-primary" />
                  ) : (
                    <User className="h-4 w-4 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
              <Badge className={`text-xs ${getRoleBadgeColor(user.role)}`}>
                {user.role}
              </Badge>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center" title={user.name}>
                {user.role === 'Admin' ? (
                  <Shield className="h-4 w-4 text-primary" />
                ) : (
                  <User className="h-4 w-4 text-primary" />
                )}
              </div>
            </div>
          )}
          
          {/* Logout Button */}
          <button 
            onClick={handleLogout}
            className={`w-full text-muted-foreground hover:text-foreground hover:bg-muted flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              isCollapsed ? 'justify-center' : ''
            }`}
            title={isCollapsed ? 'Logout' : undefined}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div 
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isCollapsed ? 'ml-16' : 'ml-64'
        }`}
      >
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
