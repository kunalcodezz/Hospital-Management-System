import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import axios from "axios";
import toast from "react-hot-toast";
import { Activity, Search, RefreshCw, Download, ArrowLeft, ArrowRight, ShieldCheck, ShieldAlert, Loader2 } from "lucide-react";

interface Log {
  _id: string;
  userId?: {
    name: string;
    email: string;
    role: string;
  };
  ipAddress: string;
  action: string;
  status: "success" | "failed";
  details: string;
  createdAt: string;
}

export default function SystemLogs() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const params: any = {
        page,
        limit: 15,
      };
      if (search) params.search = search;
      if (actionFilter) params.action = actionFilter;
      if (statusFilter) params.status = statusFilter;

      const res = await axios.get("/api/stats/logs", { params });
      setLogs(res.data.logs || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch (err) {
      toast.error("Failed to load activity audit trails.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchLogs();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [search, actionFilter, statusFilter, page]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <Badge className="w-fit mb-2">Audit Logs</Badge>
          <h1 className="text-3xl font-display text-foreground">Activity Logbook</h1>
          <p className="text-muted-foreground mt-1">Monitor administrator actions, failed login lockouts, and security transactions</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <a href={`${import.meta.env.VITE_API_URL || ""}/api/stats/logs/export`} download="system_activity_logs.csv">
            <Button variant="outline" size="sm" icon={<Download size={14} />}>
              Export Logs (CSV)
            </Button>
          </a>
          <a href={`${import.meta.env.VITE_API_URL || ""}/api/stats/payments/export`} download="payments_report.csv">
            <Button variant="secondary" size="sm" icon={<Download size={14} />}>
              Export Financials (CSV)
            </Button>
          </a>
        </div>
      </div>

      {/* Filters Board */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-card p-4 border border-border rounded-2xl shadow-sm">
        <div className="flex items-center bg-muted/50 border border-border px-4 py-2 rounded-xl md:col-span-2">
          <Search size={18} className="text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Search by details or user..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="bg-transparent border-none outline-none text-sm ml-3 w-full text-foreground"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          className="h-12 px-4 rounded-xl border border-border bg-transparent text-sm text-foreground cursor-pointer focus:outline-none"
        >
          <option value="">All Actions</option>
          {[
            "login", "logout", "password_change", "profile_update", 
            "appointment_update", "prescription_create", "report_upload", 
            "admin_action", "payment_change", "export_action", "failed_login_attempt"
          ].map(act => (
            <option key={act} value={act}>{act.replace(/_/g, " ")}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="h-12 px-4 rounded-xl border border-border bg-transparent text-sm text-foreground cursor-pointer focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Logs Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/40 border-b border-border text-xs uppercase font-mono tracking-wider text-muted-foreground">
                <th className="p-4">User</th>
                <th className="p-4">Action</th>
                <th className="p-4">IP Address</th>
                <th className="p-4">Details</th>
                <th className="p-4">Status</th>
                <th className="p-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    <Loader2 className="animate-spin w-6 h-6 mx-auto text-accent mb-2" />
                    Fetching log folders...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No activity logs recorded.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-muted/10 transition-colors">
                    <td className="p-4">
                      {log.userId ? (
                        <div>
                          <p className="font-bold text-foreground">{log.userId.name}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">{log.userId.role}</p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic">Guest</span>
                      )}
                    </td>
                    <td className="p-4 font-mono font-semibold uppercase text-[10px]">
                      {log.action.replace(/_/g, " ")}
                    </td>
                    <td className="p-4 font-mono">{log.ipAddress}</td>
                    <td className="p-4 max-w-xs truncate text-muted-foreground" title={log.details}>
                      {log.details}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        log.status === "success" 
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400" 
                          : "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400"
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground font-mono">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-border flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5"
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                <ArrowLeft size={14} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5"
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                <ArrowRight size={14} />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
