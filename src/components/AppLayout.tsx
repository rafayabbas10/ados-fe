"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAccount } from "@/contexts/AccountContext";
import { 
  LayoutDashboard, 
  Play, 
  Settings, 
  LogOut, 
  BarChart3,
  Search,
  Calendar,
  User,
  Sparkles
} from "lucide-react";

const navigationItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Build with AI", url: "/build-ai", icon: Sparkles },
  { title: "Ad Creatives", url: "/creatives", icon: Play },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Settings", url: "/settings", icon: Settings },
];

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { selectedAccountId, setSelectedAccountId, accounts, loading } = useAccount();
  const pathname = usePathname();

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

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Sidebar - Fixed */}
      <div className="w-64 bg-card border-r shadow-card fixed left-0 top-0 h-full z-40 flex flex-col">
        {/* Logo Section */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-foreground">adOS</h1>
              <p className="text-xs text-muted-foreground">Meta Ads Audit</p>
            </div>
          </div>
        </div>

        {/* Account Selector */}
        <div className="p-3 border-b">
          <div className="mb-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Ad Account
            </p>
            <Select value={selectedAccountId} onValueChange={setSelectedAccountId} disabled={loading}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={loading ? "Loading..." : "Select account"} />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    <div className="flex flex-col items-start">
                      <span className="font-medium text-sm">{account.account_name}</span>
                      <span className="text-xs text-muted-foreground">{account.facebook_account_id}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Navigation */}
        <div className="px-3 py-4 flex-1 overflow-y-auto">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Navigation
          </p>
          <div className="space-y-1">
            {navigationItems.map((item) => (
              <button
                key={item.title}
                onClick={() => window.location.href = item.url}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 w-full text-left ${getNavClasses(item.url)}`}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span className="font-medium">{item.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Logout at bottom */}
        <div className="p-3 border-t">
          <button className="w-full text-muted-foreground hover:text-foreground hover:bg-muted flex items-center gap-3 px-3 py-2 rounded-lg">
            <LogOut className="h-5 w-5 flex-shrink-0" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col ml-64">
        {/* Top Navigation Bar - Fixed */}
        <header className="h-16 bg-card border-b flex items-center justify-between px-6 shadow-card fixed top-0 right-0 left-64 z-30">
          <div className="flex items-center gap-4">
            {/* Search Bar */}
            <div className="relative w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search ad accounts, reports..." 
                className="pl-10 bg-muted/50 border-muted focus:bg-card"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Date Range Selector */}
            <Button variant="outline" size="sm" className="gap-2">
              <Calendar className="h-4 w-4" />
              Last 30 days
            </Button>

            {/* User Profile */}
            <Button variant="outline" size="sm" className="gap-2">
              <User className="h-4 w-4" />
              John Doe
            </Button>
          </div>
        </header>

        {/* Main Content - With top margin for fixed header */}
        <main className="flex-1 overflow-y-auto pt-16">
          {children}
        </main>
      </div>
    </div>
  );
}
