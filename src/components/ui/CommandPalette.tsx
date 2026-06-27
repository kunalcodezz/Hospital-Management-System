import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "motion/react";
import { Search, Compass, Shield, Settings, LogOut, HeartPulse } from "lucide-react";

export default function CommandPalette() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const getCommands = () => {
    const common = [
      { name: "Account settings", description: "Manage passwords and picture profile uploads", href: "/settings", icon: Settings },
      { name: "Logout", description: "Disconnect session and exit dashboard", action: logout, icon: LogOut },
    ];

    if (!user) return [];

    switch (user.role) {
      case "patient":
        return [
          { name: "Patient Dashboard", description: "Review vitals and heart rates", href: "/patient", icon: HeartPulse },
          { name: "Schedule consultation", description: "Book new appointments and download invoices", href: "/patient/appointments", icon: Compass },
          { name: "Find doctors", description: "Search physician clinics and specialties", href: "/patient/doctors", icon: Search },
          { name: "Medical Records", description: "Check prescriptions and upload reports", href: "/patient/records", icon: HeartPulse },
          ...common
        ];
      case "doctor":
        return [
          { name: "Doctor Dashboard", description: "Overview schedules and clinic earnings", href: "/doctor", icon: HeartPulse },
          { name: "Clinical Schedules Queue", description: "Check-in appointments and write prescriptions", href: "/doctor/schedule", icon: Compass },
          { name: "My Patients list", description: "Review patient profiles and diagnostics", href: "/doctor/patients", icon: Search },
          { name: "Patient Reviews", description: "Aggregate ratings and comments", href: "/doctor/reviews", icon: Compass },
          ...common
        ];
      case "admin":
      case "superadmin":
        return [
          { name: "Operations Overview", description: "Monitor hospital network analytics", href: "/admin", icon: Shield },
          { name: "Register Specialist account", description: "Add new doctor credentials", href: "/admin/doctors", icon: Compass },
          { name: "Patients Database", description: "Manage active hospital users", href: "/admin/patients", icon: Search },
          { name: "Audit Trail logs", description: "Filter system logs and export spreadsheets", href: "/admin/logs", icon: Shield },
          ...common
        ];
      default:
        return common;
    }
  };

  const commands = getCommands();
  const filtered = commands.filter((cmd) =>
    cmd.name.toLowerCase().includes(search.toLowerCase()) ||
    cmd.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleTrigger = (cmd: any) => {
    setIsOpen(false);
    setSearch("");
    if (cmd.href) {
      navigate(cmd.href);
    } else if (cmd.action) {
      cmd.action();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99] flex items-start justify-center pt-[15vh] p-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-card w-full max-w-xl border border-border rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center px-4 py-3 border-b border-border">
              <Search className="text-muted-foreground shrink-0 w-5 h-5" />
              <input
                type="text"
                placeholder="Type a command to search or navigate (Ctrl + K to toggle)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent border-none outline-none text-sm ml-3 w-full text-foreground h-9"
                autoFocus
              />
            </div>

            <div className="p-2 max-h-[320px] overflow-y-auto divide-y divide-border/20">
              {filtered.length === 0 ? (
                <p className="text-xs text-muted-foreground py-6 text-center">No commands matching search criteria.</p>
              ) : (
                filtered.map((cmd, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleTrigger(cmd)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted text-left transition-colors group"
                  >
                    <div className="p-2 rounded-lg bg-accent/5 text-accent group-hover:bg-accent group-hover:text-white transition-colors shrink-0">
                      <cmd.icon size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">{cmd.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{cmd.description}</p>
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="bg-muted/40 px-4 py-2 text-[10px] text-muted-foreground font-semibold flex justify-between border-t border-border">
              <span>Press enter to select</span>
              <span>ESC to close</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
