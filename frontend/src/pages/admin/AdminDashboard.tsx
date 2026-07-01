import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TrendingUp, Users, Clock, Activity, FileText, Settings, ShieldAlert, Cpu } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import axios from "axios";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get("/api/stats/admin");
      setStats(res.data.stats || null);
    } catch (err) {
      toast.error("Failed to load hospital network stats.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <Badge className="w-fit mb-2">Hospital Operations Dashboard</Badge>
          <h1 className="text-3xl md:text-5xl font-display tracking-tight text-foreground">
            Welcome back, <span className="gradient-text">MediCare Lead</span>
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Audit system operations, review logs audit feeds, and manage clinical staff parameters.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/doctors">
            <Button size="sm">Register Specialist</Button>
          </Link>
          <Link to="/admin/logs">
            <Button variant="outline" size="sm">Inspect Logs</Button>
          </Link>
        </div>
      </div>

      {isLoading || !stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="animate-pulse bg-card border border-border h-32 rounded-2xl w-full" />
          ))}
        </div>
      ) : (
        <>
          {/* Dashboard Aggregations */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="flex flex-col justify-between h-full hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg text-accent">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <span className="text-emerald-500 text-xs font-bold font-mono">Live Today: ${stats.revenueToday.toFixed(2)}</span>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mt-4 uppercase font-bold font-mono tracking-wider">Accumulated Revenue</p>
                <p className="text-2xl font-bold mt-1 text-foreground">${stats.totalRevenue.toFixed(2)}</p>
              </div>
            </Card>

            <Card className="flex flex-col justify-between h-full hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg text-emerald-500">
                  <Users className="w-6 h-6" />
                </div>
                <span className="text-emerald-500 text-xs font-bold font-mono">Doctors: {stats.doctorsCount}</span>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mt-4 uppercase font-bold font-mono tracking-wider">Total Patients</p>
                <p className="text-2xl font-bold mt-1 text-foreground">{stats.patientsCount}</p>
              </div>
            </Card>

            <Card className="flex flex-col justify-between h-full hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-orange-50 dark:bg-orange-950/20 rounded-lg text-orange-500">
                  <Clock className="w-6 h-6" />
                </div>
                <span className="text-orange-500 text-xs font-bold font-mono">Live Active: {stats.activeAppointmentsCount}</span>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mt-4 uppercase font-bold font-mono tracking-wider">Completed Consultations</p>
                <p className="text-2xl font-bold mt-1 text-foreground">{stats.appointmentsCount}</p>
              </div>
            </Card>

            <Card featured className="bg-gradient-to-br from-white to-blue-50 h-full flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-accent rounded-lg text-white">
                  <Cpu className="w-6 h-6" />
                </div>
                <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 font-bold font-mono uppercase">Online</Badge>
              </div>
              <div>
                <p className="text-accent text-xs mt-4 uppercase font-bold font-mono tracking-wider">Online Users (Last 15m)</p>
                <p className="text-2xl font-bold mt-1 text-foreground">{stats.activeUsersCount}</p>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Chart: Department statistics */}
            <Card className="col-span-1 lg:col-span-2 flex flex-col justify-between">
              <div className="pb-4 border-b border-border">
                <h3 className="font-bold text-foreground text-base">Department Consultation & Revenue Summary</h3>
              </div>
              
              <div className="h-64 mt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.departmentPerformance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: "11px", borderRadius: "12px", border: "1px solid #e2e8f0" }} />
                    <Bar dataKey="appointments" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="revenue" fill="var(--color-accent-secondary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* System Health */}
            <Card className="flex flex-col justify-between">
              <div className="pb-4 border-b border-border">
                <h3 className="font-bold text-foreground text-base">Network Infrastructure Health</h3>
              </div>
              <div className="space-y-4 py-4 text-xs font-semibold text-muted-foreground">
                <div className="flex justify-between border-b border-border pb-2">
                  <span>MongoDB Connection Status</span>
                  <Badge className={stats.systemHealth?.dbStatus === "connected" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}>
                    {stats.systemHealth?.dbStatus}
                  </Badge>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span>Process Uptime</span>
                  <span className="font-mono text-foreground">{Math.floor(stats.systemHealth?.uptime || 0)}s</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span>Environment Mode</span>
                  <span className="font-mono uppercase text-foreground">{stats.systemHealth?.nodeEnv}</span>
                </div>
                <div className="flex justify-between pb-2">
                  <span>Heap Memory Allocated</span>
                  <span className="font-mono text-foreground">{Math.round((stats.systemHealth?.memoryUsage || 0) / (1024 * 1024))} MB</span>
                </div>
              </div>
              <div className="pt-4 border-t border-border flex flex-col gap-2">
                <a href={`${import.meta.env.VITE_API_URL || ""}/api/stats/logs/export`} download="system_activity_logs.csv">
                  <Button variant="outline" className="w-full h-10 text-xs">
                    Download Activity logs CSV
                  </Button>
                </a>
                <a href={`${import.meta.env.VITE_API_URL || ""}/api/stats/payments/export`} download="payments_report.csv">
                  <Button variant="secondary" className="w-full h-10 text-xs">
                    Download Payments report CSV
                  </Button>
                </a>
              </div>
            </Card>
          </div>

          {/* Audit Trail feed on dashboard */}
          <Card className="p-0">
            <div className="p-5 border-b border-border">
              <h3 className="font-bold text-foreground text-base">Recent Portal Audits</h3>
            </div>
            <div className="p-5 divide-y divide-border space-y-4">
              {stats.recentActivities?.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No audit logs available.</p>
              ) : (
                stats.recentActivities.slice(0, 5).map((log: any, idx: number) => (
                  <div key={log._id} className="pt-4 first:pt-0 flex items-center justify-between text-xs gap-4">
                    <div>
                      <p className="font-bold text-foreground">{log.details}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        By {log.userId ? `${log.userId.name} (${log.userId.role})` : "Anonymous guest"} • IP: {log.ipAddress}
                      </p>
                    </div>
                    <span className="font-mono text-muted-foreground text-[10px]">{new Date(log.createdAt).toLocaleTimeString()}</span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
