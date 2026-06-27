import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { motion } from "motion/react";
import { Clock, Calendar, CheckSquare, Smile, ShieldAlert, Award, User, RefreshCw, FileText } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { toast } from "react-hot-toast";

const easeOut = [0.16, 1, 0.3, 1] as const;
const fadeInUp = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: easeOut } },
};

// 1. Doctor Schedule Queue & Visit Consultation
export function DoctorSchedule() {
  const queryClient = useQueryClient();
  const [activeVisit, setActiveVisit] = useState<any>(null);
  const [diagnosis, setDiagnosis] = useState("");
  const [prescription, setPrescription] = useState("");

  const { data: appointments, isLoading } = useQuery({
    queryKey: ["doctor-appointments"],
    queryFn: async () => {
      const res = await axios.get("/api/appointments");
      return res.data.appointments;
    }
  });

  const checkinMutation = useMutation({
    mutationFn: async (apptId: string) => {
      return axios.patch(`/api/appointments/${apptId}/status`, { status: "checked_in", note: "Patient checked in at counter" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor-appointments"] });
      toast.success("Patient checked in!");
    }
  });

  const completeMutation = useMutation({
    mutationFn: async ({ apptId, diag, presc }: any) => {
      return axios.patch(`/api/appointments/${apptId}/diagnosis`, { diagnosis: diag, prescription: presc });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor-appointments"] });
      toast.success("Consultation completed!");
      setActiveVisit(null);
      setDiagnosis("");
      setPrescription("");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to complete visit");
    }
  });

  const handleStartConsultation = (appt: any) => {
    setActiveVisit(appt);
    setDiagnosis(appt.diagnosis || "");
    setPrescription(appt.prescription || "");
  };

  return (
    <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
      <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="lg:col-span-2 space-y-6">
        <h2 className="text-2xl font-bold font-display">Patient Queue</h2>
        {isLoading ? (
          <div className="space-y-4">
            <div className="h-20 bg-card rounded-2xl animate-pulse" />
          </div>
        ) : !appointments || appointments.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground border-dashed border-2">
            No appointments scheduled for today.
          </Card>
        ) : (
          appointments.map((appt: any) => (
            <Card key={appt._id} className="relative hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Badge variant={appt.status === "completed" ? "secondary" : "primary"}>
                      {appt.status.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{appt.time} • Room 102</span>
                  </div>
                  <h3 className="font-semibold text-lg">{appt.patientId?.name || "Patient"}</h3>
                  <p className="text-xs text-muted-foreground">Notes: {appt.notes || "None"}</p>
                </div>

                <div className="flex gap-2">
                  {appt.status === "pending" && (
                    <Button size="sm" onClick={() => checkinMutation.mutate(appt._id)}>Check In</Button>
                  )}
                  {appt.status === "checked_in" && (
                    <Button size="sm" onClick={() => handleStartConsultation(appt)}>Consult</Button>
                  )}
                  {appt.status === "completed" && (
                    <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1">
                      <CheckSquare size={14} /> Completed
                    </span>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </motion.div>

      {/* Consultation Diagnosis Entry Panel */}
      <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="space-y-6">
        <h2 className="text-2xl font-bold font-display">Active Session</h2>
        {activeVisit ? (
          <Card className="p-6 space-y-4 border-accent/20 border-2">
            <div className="border-b pb-3">
              <h3 className="font-bold text-foreground">{activeVisit.patientId?.name}</h3>
              <p className="text-xs text-muted-foreground">Active Diagnosis Log</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Diagnosis</label>
              <textarea
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="Log patient symptoms and diagnostic findings..."
                className="w-full p-3 rounded-lg border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-accent h-24 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Prescription Details</label>
              <textarea
                value={prescription}
                onChange={(e) => setPrescription(e.target.value)}
                placeholder="Medication name, dosage, schedule..."
                className="w-full p-3 rounded-lg border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-accent h-24 text-sm"
              />
            </div>
            <Button
              className="w-full"
              onClick={() => completeMutation.mutate({ apptId: activeVisit._id, diag: diagnosis, presc: prescription })}
              isLoading={completeMutation.isPending}
            >
              Sign & Complete Visit
            </Button>
          </Card>
        ) : (
          <Card className="p-6 text-center text-muted-foreground border-dashed border-2">
            Select a checked-in patient from the queue to start consulting.
          </Card>
        )}
      </motion.div>
    </div>
  );
}

// 2. Doctor Patients View (Record Lookup)
export function DoctorPatients() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: appointments } = useQuery({
    queryKey: ["doctor-appointments"],
    queryFn: async () => {
      const res = await axios.get("/api/appointments");
      return res.data.appointments;
    }
  });

  // Extract unique patient records
  const uniquePatients = appointments
    ? Array.from(new Map(appointments.map((a: any) => [a.patientId?._id, a.patientId])).values()).filter(Boolean)
    : [];

  const filteredPatients = uniquePatients.filter((p: any) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold font-display tracking-tight">Patient Directory</h2>
          <p className="text-muted-foreground mt-1">Search medical profiles of registered patients in your registry.</p>
        </div>
        <div className="flex items-center gap-2 bg-muted p-2 rounded-xl border border-border max-w-sm w-full">
          <User size={16} className="text-muted-foreground ml-2" />
          <input
            type="text"
            placeholder="Search by name, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none text-sm w-full"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {filteredPatients.map((p: any) => (
          <Card key={p._id} className="p-6 space-y-4 hover:shadow-md transition-all">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-accent/5 flex items-center justify-center font-bold text-accent shrink-0">
                {p.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="font-semibold text-lg">{p.name}</h3>
                <p className="text-sm text-muted-foreground">{p.email}</p>
              </div>
            </div>
            <div className="border-t pt-4 flex gap-2">
              <a href={`/api/reports/medical-report/${p._id}/pdf`}>
                <Button size="sm" variant="outline" icon={<FileText size={14} />}>Clinical Summary PDF</Button>
              </a>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// 3. Doctor Reviews & Metrics
export function DoctorReviews() {
  const { data: statsData } = useQuery({
    queryKey: ["doctor-stats"],
    queryFn: async () => {
      const res = await axios.get("/api/doctors/profile/stats");
      return res.data.stats;
    }
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold font-display tracking-tight">Clinical Performance Metrics</h2>
        <p className="text-muted-foreground mt-1">Review satisfaction ratings and completed visits.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="text-center p-6 space-y-2">
          <Smile size={32} className="text-accent mx-auto" />
          <p className="text-muted-foreground text-xs uppercase font-bold tracking-wider">Satisfaction Rate</p>
          <h3 className="text-3xl font-bold">{statsData?.satisfactionRate || 100}%</h3>
        </Card>
        <Card className="text-center p-6 space-y-2">
          <Award size={32} className="text-amber-500 mx-auto" />
          <p className="text-muted-foreground text-xs uppercase font-bold tracking-wider">Average Rating</p>
          <h3 className="text-3xl font-bold">{statsData?.averageRating || 5.0} / 5.0</h3>
        </Card>
        <Card className="text-center p-6 space-y-2">
          <CheckSquare size={32} className="text-emerald-500 mx-auto" />
          <p className="text-muted-foreground text-xs uppercase font-bold tracking-wider">Consultations Completed</p>
          <h3 className="text-3xl font-bold">{statsData?.completedAppointments || 0}</h3>
        </Card>
      </div>
    </div>
  );
}

// 4. Doctor Profile Edit (availability slots & vacation Mode)
export function DoctorProfileEdit() {
  const queryClient = useQueryClient();
  const [fee, setFee] = useState(0);
  const [qual, setQual] = useState("");
  const [vacationMode, setVacationMode] = useState(false);

  const { data: profileData } = useQuery({
    queryKey: ["doctor-profile"],
    queryFn: async () => {
      const res = await axios.get("/api/users/me");
      const prof = res.data.profile || {};
      setFee(prof.consultationFee || 50);
      setQual(prof.qualification || "");
      setVacationMode(!!prof.vacationMode);
      return res.data;
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (updated: any) => {
      return axios.put("/api/doctors/profile/me", updated);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor-profile"] });
      toast.success("Profile saved successfully");
    },
    onError: () => {
      toast.error("Failed to update profile");
    }
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({
      consultationFee: Number(fee),
      qualification: qual,
      vacationMode,
    });
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold font-display tracking-tight">Practitioner Portal Settings</h2>
        <p className="text-muted-foreground mt-1">Configure consultation fees and schedule parameters.</p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase">Medical Qualifications</label>
            <input
              type="text"
              value={qual}
              onChange={(e) => setQual(e.target.value)}
              placeholder="e.g. M.B.B.S, M.D. Cardiology"
              className="w-full h-11 px-3 rounded-lg border border-border bg-transparent focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase">Consultation Fee ($)</label>
            <input
              type="number"
              value={fee}
              onChange={(e) => setFee(Number(e.target.value))}
              className="w-full h-11 px-3 rounded-lg border border-border bg-transparent focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted rounded-xl border mt-4">
            <div>
              <p className="font-semibold text-sm text-foreground">Vacation Mode</p>
              <p className="text-xs text-muted-foreground">Instantly block booking requests on calendar slots.</p>
            </div>
            <input
              type="checkbox"
              checked={vacationMode}
              onChange={(e) => setVacationMode(e.target.checked)}
              className="w-5 h-5 accent-accent"
            />
          </div>

          <Button type="submit" className="w-full mt-4" isLoading={saveMutation.isPending}>
            Save Configuration
          </Button>
        </form>
      </Card>
    </div>
  );
}
