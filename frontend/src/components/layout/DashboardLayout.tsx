import React from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Calendar, FileText, User, Settings, LogOut, Activity, Users, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import logo from "@/assets/logo.png";

interface DashboardLayoutProps {
  role: "patient" | "doctor" | "admin";
}

export default function DashboardLayout({ role }: DashboardLayoutProps) {
  const location = useLocation();
  const { user, logout } = useAuth();

  const getLinks = () => {
    switch (role) {
      case "patient":
        return [
          { name: "Dashboard", href: "/patient", icon: LayoutDashboard },
          { name: "Appointments", href: "/patient/appointments", icon: Calendar },
          { name: "Medical Records", href: "/patient/records", icon: FileText },
          { name: "Find Doctors", href: "/patient/doctors", icon: User },
        ];
      case "doctor":
        return [
          { name: "Dashboard", href: "/doctor", icon: LayoutDashboard },
          { name: "Schedule", href: "/doctor/schedule", icon: Calendar },
          { name: "Patients", href: "/doctor/patients", icon: Users },
          { name: "Reviews", href: "/doctor/reviews", icon: Star },
        ];
      case "admin":
        return [
          { name: "Overview", href: "/admin", icon: LayoutDashboard },
          { name: "Manage Doctors", href: "/admin/doctors", icon: User },
          { name: "Manage Patients", href: "/admin/patients", icon: Users },
          { name: "System Logs", href: "/admin/logs", icon: Activity },
        ];
    }
  };

  const links = getLinks();

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card hidden md:flex flex-col p-6">
        <div className="flex items-center mb-10">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="MediCare+" className="h-10 w-auto object-contain" />
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto space-y-1">
          <div className="mb-6 px-2">
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">{role} portal</p>
          </div>
          
          {links.map((link) => {
            const isActive = location.pathname === link.href;
            return (
              <Link
                key={link.name}
                to={link.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors",
                  isActive 
                    ? "bg-muted text-accent font-semibold" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <link.icon size={18} />
                {link.name}
              </Link>
            );
          })}
        </nav>

        <div className="pt-6 border-t border-border mt-auto">
          <Link
            to="/settings"
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Settings size={18} />
            Settings
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 transition-colors mt-1 cursor-pointer text-left"
          >
            <LogOut size={18} />
            Logout
          </button>
          
          <div className="mt-6 flex items-center gap-3 bg-foreground p-3 rounded-2xl text-white">
            <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden shrink-0 border border-slate-600">
              {user?.profilePhoto ? (
                <img src={user.profilePhoto} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || role}`} alt="Avatar" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate text-white">{user?.name || `Demo ${role}`}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email || `${role}@medicare.com`}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background dot-pattern">
        {/* Header */}
        <header className="h-16 border-b border-border bg-card/80 backdrop-blur-md flex items-center justify-between px-8 z-10 shrink-0">
          <div className="md:hidden flex items-center gap-2">
            <img src={logo} alt="MediCare+" className="h-8 w-auto object-contain" />
          </div>
          <div className="flex-1 max-w-md hidden md:flex items-center bg-muted px-4 py-2 rounded-full cursor-pointer select-none">
            <Activity className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground ml-3">Press Ctrl + K to toggle command console...</span>
          </div>
          <div className="flex-1 md:hidden" />
          <div className="flex items-center gap-4">
             <Link to="/settings" className="relative p-2 border border-border rounded-xl text-muted-foreground hover:text-foreground cursor-pointer transition-colors hidden sm:block">
               <Activity size={20} />
             </Link>
             <Link to="/patient/appointments" className="hidden sm:block">
               <button className="bg-gradient-to-br from-accent to-accent-secondary text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-accent hover:brightness-110 transition-all whitespace-nowrap cursor-pointer">
                 + Book Appt
               </button>
             </Link>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
