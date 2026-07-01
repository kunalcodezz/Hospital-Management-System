import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { motion } from "motion/react";
import { UserPlus, Trash2, Calendar, FileText, BarChart2, DollarSign, Search, ShieldAlert, List, ArrowDownToLine } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { toast } from "react-hot-toast";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const easeOut = [0.16, 1, 0.3, 1] as const;
const fadeInUp = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: easeOut } },
};

// 1. Admin Doctors Management (List & Create staff)
export function AdminDoctors() {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState("General Physician");
  const [fee, setFee] = useState(50);
  const [regNum, setRegNum] = useState("");

  const { data: doctors, isLoading } = useQuery({
    queryKey: ["admin-doctors"],
    queryFn: async () => {
      const res = await axios.get("/api/doctors");
      return res.data.doctors;
    }
  });

  const addDoctorMutation = useMutation({
    mutationFn: async (newDoc: any) => {
      // Step 1: Register doctor user
      const registerRes = await axios.post("/api/auth/register", {
        name: newDoc.name,
        email: newDoc.email,
        password: newDoc.password,
        role: "doctor"
      });
      
      const docUserId = registerRes.data.user.id;
      
      // Step 2: Set credentials/profile details
      return axios.put(`/api/doctors/profile/me`, {
        qualification: "M.D.",
        experience: 5,
        medicalRegistrationNumber: newDoc.regNum,
        department: newDoc.department,
        consultationFee: newDoc.fee,
        vacationMode: false
      }, {
        headers: {
          Authorization: `Bearer ${registerRes.data.accessToken}`
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-doctors"] });
      toast.success("Doctor practitioner created successfully!");
      setShowAddForm(false);
      setName("");
      setEmail("");
      setPassword("");
      setRegNum("");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to add doctor");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !regNum) {
      toast.error("Please fill in all required fields");
      return;
    }
    addDoctorMutation.mutate({ name, email, password, department, fee: Number(fee), regNum });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold font-display tracking-tight">Manage Doctors</h2>
          <p className="text-muted-foreground mt-1">Review registrations, consultation rates, and onboard clinicians.</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)} icon={<UserPlus size={16} />}>
          {showAddForm ? "View Directory" : "Onboard Doctor"}
        </Button>
      </div>

      {showAddForm ? (
        <Card className="max-w-xl p-6">
          <h3 className="text-lg font-bold border-b pb-3 mb-4">Onboard Clinician</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dr. Samantha Smith"
                className="w-full h-11 px-3 rounded-lg border border-border bg-transparent focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="samantha@medicare.com"
                className="w-full h-11 px-3 rounded-lg border border-border bg-transparent focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Password (Security Policy)</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 chars, 1 uppercase, 1 special"
                className="w-full h-11 px-3 rounded-lg border border-border bg-transparent focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Department</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg border border-border bg-transparent"
                >
                  <option value="Cardiology">Cardiology</option>
                  <option value="Neurology">Neurology</option>
                  <option value="Pediatrics">Pediatrics</option>
                  <option value="General Physician">General Physician</option>
                  <option value="Dermatology">Dermatology</option>
                  <option value="Orthopedics">Orthopedics</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Fee ($)</label>
                <input
                  type="number"
                  value={fee}
                  onChange={(e) => setFee(Number(e.target.value))}
                  className="w-full h-11 px-3 rounded-lg border border-border bg-transparent"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Medical Reg #</label>
              <input
                type="text"
                value={regNum}
                onChange={(e) => setRegNum(e.target.value)}
                placeholder="REG-291039"
                className="w-full h-11 px-3 rounded-lg border border-border bg-transparent"
              />
            </div>
            <Button type="submit" className="w-full" isLoading={addDoctorMutation.isPending}>
              Create Account & Profile
            </Button>
          </form>
        </Card>
      ) : isLoading ? (
        <div className="grid md:grid-cols-2 gap-6 animate-pulse">
          <div className="h-28 bg-card rounded-2xl" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {doctors?.map((doc: any) => (
            <Card key={doc._id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-lg">Dr. {doc.userId?.name}</h3>
                  <Badge>{doc.department}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Email: {doc.userId?.email}</p>
                <p className="text-xs text-muted-foreground">Registration Number: {doc.medicalRegistrationNumber}</p>
              </div>
              <div className="border-t pt-4 mt-6 flex justify-between text-sm font-semibold">
                <span>Fee: ${doc.consultationFee}</span>
                <span className="text-amber-500">Rating: {doc.averageRating} ★</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// 2. Admin Patients Management (Directory & Deletions)
export function AdminPatients() {
  const queryClient = useQueryClient();
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: async () => (await axios.get("/api/users/me")).data });
  const isSuperAdmin = me?.user?.role === "superadmin";

  const { data: patients, isLoading } = useQuery({
    queryKey: ["admin-patients"],
    queryFn: async () => {
      const res = await axios.get("/api/users/patients");
      return res.data.patients;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      return axios.delete(`/api/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-patients"] });
      toast.success("User account deleted");
    },
    onError: () => {
      toast.error("Deletion failed (Super Admin role required)");
    }
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold font-display tracking-tight">Registered Patients</h2>
        <p className="text-muted-foreground mt-1">Review database profile metrics and manage credentials.</p>
      </div>

      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-16 bg-card rounded-2xl" />
        </div>
      ) : (
        <div className="bg-card border rounded-2xl overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-muted border-b text-xs font-bold text-muted-foreground uppercase">
                <th className="p-4">Name</th>
                <th className="p-4">Blood Group</th>
                <th className="p-4">BMI</th>
                <th className="p-4">Allergies</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients?.map((pat: any) => (
                <tr key={pat._id} className="border-b text-sm">
                  <td className="p-4">
                    <p className="font-semibold">{pat.userId?.name || "Patient"}</p>
                    <p className="text-xs text-muted-foreground">{pat.userId?.email || "N/A"}</p>
                  </td>
                  <td className="p-4 font-semibold">{pat.bloodGroup || "Not Set"}</td>
                  <td className="p-4">{pat.bmi || "N/A"}</td>
                  <td className="p-4 text-xs max-w-xs truncate">{pat.allergies?.join(", ") || "None"}</td>
                  <td className="p-4 text-right">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => {
                        if (window.confirm("Are you sure you want to delete this user?")) {
                          deleteMutation.mutate(pat.userId?._id);
                        }
                      }}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      disabled={!isSuperAdmin}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// 3. Admin System Audit Logs Viewer
export function AdminLogs() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: logsData, isLoading } = useQuery({
    queryKey: ["activity-logs"],
    queryFn: async () => {
      const res = await axios.get("/api/users/logs");
      return res.data.logs;
    }
  });

  const filteredLogs = logsData?.filter((l: any) =>
    (l.action || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.details || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.userId?.email || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold font-display tracking-tight">Security Audit Logs</h2>
          <p className="text-muted-foreground mt-1">OWASP-compliance Activity Trail for all user operations.</p>
        </div>
        <div className="flex items-center gap-2 bg-muted p-2 rounded-xl border border-border max-w-sm w-full">
          <Search size={16} className="text-muted-foreground ml-2" />
          <input
            type="text"
            placeholder="Search by action, details, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none text-sm w-full"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-12 bg-card rounded-xl" />
        </div>
      ) : (
        <div className="bg-card border rounded-2xl overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-muted border-b text-xs font-bold text-muted-foreground uppercase">
                <th className="p-4">Timestamp</th>
                <th className="p-4">User</th>
                <th className="p-4">Action</th>
                <th className="p-4">Status</th>
                <th className="p-4">IP Address</th>
                <th className="p-4">Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs?.map((log: any) => (
                <tr key={log._id} className="border-b text-xs hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-mono">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="p-4">
                    <p className="font-semibold">{log.userId?.name || "Guest"}</p>
                    <p className="text-slate-400 font-mono text-[10px]">{log.userId?.email || "Guest IP"}</p>
                  </td>
                  <td className="p-4"><Badge>{log.action.toUpperCase()}</Badge></td>
                  <td className="p-4">
                    <span className={`font-semibold ${log.status === "success" ? "text-emerald-500" : "text-red-500"}`}>
                      {log.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4 font-mono">{log.ipAddress}</td>
                  <td className="p-4 text-muted-foreground truncate max-w-xs">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// 4. Admin Analytics Dashboard
export function AdminAnalytics() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: async () => {
      const res = await axios.get("/api/stats");
      return res.data.stats;
    }
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold font-display tracking-tight">Business Intelligence</h2>
          <p className="text-muted-foreground mt-1">Review revenue curves and department operational metrics.</p>
        </div>
        <a href={`${import.meta.env.VITE_API_URL || ""}/api/reports/payments/csv`}>
          <Button variant="outline" icon={<ArrowDownToLine size={16} />}>Export Payments CSV</Button>
        </a>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-4 gap-6 animate-pulse">
          <div className="h-28 bg-card rounded-2xl" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="space-y-1">
              <DollarSign className="w-8 h-8 text-accent mb-2" />
              <p className="text-muted-foreground text-xs uppercase font-bold tracking-wider">Total Revenue</p>
              <h3 className="text-2xl font-bold">${analytics?.totalRevenue?.toFixed(2) || "0.00"}</h3>
            </Card>
            <Card className="space-y-1">
              <BarChart2 className="w-8 h-8 text-emerald-500 mb-2" />
              <p className="text-muted-foreground text-xs uppercase font-bold tracking-wider">Weekly Revenue</p>
              <h3 className="text-2xl font-bold">${analytics?.weeklyRevenue?.toFixed(2) || "0.00"}</h3>
            </Card>
            <Card className="space-y-1">
              <Calendar className="w-8 h-8 text-amber-500 mb-2" />
              <p className="text-muted-foreground text-xs uppercase font-bold tracking-wider">Active Visits</p>
              <h3 className="text-2xl font-bold">{analytics?.activeApptsCount || 0}</h3>
            </Card>
            <Card className="space-y-1">
              <ShieldAlert className="w-8 h-8 text-red-500 mb-2" />
              <p className="text-muted-foreground text-xs uppercase font-bold tracking-wider">DB Load Status</p>
              <h3 className="text-2xl font-bold">{analytics?.liveStatistics?.systemLoad || "Normal"}</h3>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <Card className="p-6">
              <h3 className="font-bold text-lg mb-6">Revenue Growth ($)</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics?.trends}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0052FF" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#0052FF" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="revenue" stroke="#0052FF" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-bold text-lg mb-6">Department Efficiencies (%)</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics?.departmentPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="department" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="efficiency" fill="#4D7CFF" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
