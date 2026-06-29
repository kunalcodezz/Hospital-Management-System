import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import axios from "axios";
import toast from "react-hot-toast";
import { Calendar, Clock, User, X, Check, Clipboard, Play, UserX, UserCheck, AlertCircle } from "lucide-react";
import { ClockTimePicker } from "@/components/ui/ClockTimePicker";

interface Appointment {
  _id: string;
  patientId: {
    _id: string;
    name: string;
    email: string;
  };
  date: string;
  time: string;
  status: "pending" | "confirmed" | "checked_in" | "in_progress" | "completed" | "cancelled" | "rejected" | "no_show";
  notes?: string;
}

interface Slot {
  dayOfWeek: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
  startTime: string;
  endTime: string;
}

export default function Schedule() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patientQueue, setPatientQueue] = useState<Appointment[]>([]);
  const [vacationMode, setVacationMode] = useState(false);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Consultation modal states
  const [activeConsultation, setActiveConsultation] = useState<Appointment | null>(null);
  const [diagnosis, setDiagnosis] = useState("");
  const [prescription, setPrescription] = useState("");
  const [isSubmittingConsult, setIsSubmittingConsult] = useState(false);

  // New slot states
  const [newDay, setNewDay] = useState<Slot["dayOfWeek"]>("Monday");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get("/api/doctors/dashboard");
      setAppointments(res.data.todayAppointments || []);
      setPatientQueue(res.data.patientQueue || []);
      setVacationMode(res.data.vacationMode || false);
      setSlots(res.data.availabilityCalendar || []);
    } catch (err) {
      toast.error("Failed to load doctor dashboard datasets.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStatusChange = async (id: string, newStatus: string, note?: string) => {
    try {
      await axios.put(`/api/appointments/${id}/status`, {
        status: newStatus,
        note: note || `Status updated by doctor`,
      });
      toast.success(`Appointment status updated to ${newStatus}`);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Could not change status.");
    }
  };

  const handleStartConsultation = (app: Appointment) => {
    setActiveConsultation(app);
    setDiagnosis("");
    setPrescription("");
  };

  const handleConsultSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConsultation) return;

    if (!diagnosis || !prescription) {
      toast.error("Please fill in diagnosis and prescription details.");
      return;
    }

    try {
      setIsSubmittingConsult(true);
      await axios.put(`/api/appointments/${activeConsultation._id}/diagnosis`, {
        diagnosis,
        prescription,
      });

      toast.success("Consultation notes and prescription generated successfully!");
      setActiveConsultation(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to record consultation notes.");
    } finally {
      setIsSubmittingConsult(false);
    }
  };

  // Availability calendar management
  const handleVacationToggle = async () => {
    try {
      const nextMode = !vacationMode;
      await axios.put("/api/doctors/profile/me", { vacationMode: nextMode });
      setVacationMode(nextMode);
      toast.success(`Vacation mode ${nextMode ? "activated" : "disabled"}`);
    } catch (err) {
      toast.error("Failed to toggle vacation status.");
    }
  };

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStart || !newEnd) {
      toast.error("Please specify slot hours.");
      return;
    }

    const updatedSlots = [...slots, { dayOfWeek: newDay, startTime: newStart, endTime: newEnd }];

    try {
      await axios.put("/api/doctors/profile/me", { availabilityCalendar: updatedSlots });
      setSlots(updatedSlots);
      setNewStart("");
      setNewEnd("");
      toast.success("Availability slot added!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save slot.");
    }
  };

  const handleDeleteSlot = async (idx: number) => {
    const updatedSlots = slots.filter((_, i) => i !== idx);
    try {
      await axios.put("/api/doctors/profile/me", { availabilityCalendar: updatedSlots });
      setSlots(updatedSlots);
      toast.success("Slot deleted.");
    } catch (err) {
      toast.error("Failed to delete slot.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <Badge className="w-fit mb-2">Clinical Console</Badge>
          <h1 className="text-3xl font-display text-foreground">Schedules & Practice settings</h1>
          <p className="text-muted-foreground mt-1">Configure consultation slots and write prescriptions in real time</p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="vacationCheck"
            checked={vacationMode}
            onChange={handleVacationToggle}
            className="w-4 h-4 rounded text-accent focus:ring-accent border-border cursor-pointer"
          />
          <label htmlFor="vacationCheck" className="text-sm font-semibold text-foreground cursor-pointer select-none">
            Vacation Mode (block calendar)
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns: Today's Schedule & Patient Queue */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active Consultation Queue */}
          <Card className="p-0 border-accent/20">
            <div className="p-5 border-b border-border bg-muted/20 flex justify-between items-center">
              <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-accent animate-ping" />
                Live Patient Check-in Queue
              </h3>
              <Badge className="bg-accent/10 text-accent">{patientQueue.length} Active</Badge>
            </div>
            <div className="p-5 space-y-4">
              {patientQueue.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">No patient checked in currently.</p>
              ) : (
                patientQueue.map((app) => (
                  <div key={app._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-border rounded-xl gap-4 hover:bg-muted/10 transition-colors">
                    <div>
                      <p className="font-bold text-sm text-foreground">{app.patientId?.name}</p>
                      <p className="text-xs text-muted-foreground">Appt: {app.time} • Status: <span className="font-semibold text-accent">{app.status.replace("_", " ")}</span></p>
                    </div>
                    <div>
                      {app.status === "checked_in" ? (
                        <Button size="sm" className="h-9 text-xs" icon={<Play size={14} />} onClick={() => handleStatusChange(app._id, "in_progress", "Consultation started by doctor")}>
                          Start Consultation
                        </Button>
                      ) : (
                        <Button size="sm" className="h-9 text-xs bg-emerald-600 hover:bg-emerald-700" icon={<Clipboard size={14} />} onClick={() => handleStartConsultation(app)}>
                          Record Rx / Complete
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Today's appointments list */}
          <Card className="p-0">
            <div className="p-5 border-b border-border">
              <h3 className="font-bold text-foreground text-sm">Today's Schedule</h3>
            </div>
            <div className="p-5 space-y-4">
              {appointments.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">No appointments scheduled for today.</p>
              ) : (
                appointments.map((app) => (
                  <div key={app._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-border rounded-xl gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-bold shrink-0">
                        {(app.patientId?.name || "").split(" ").map(n => n[0]).join("")}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-foreground">{app.patientId?.name}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 font-semibold">
                          <span className="flex items-center gap-1"><Clock size={12} /> {app.time}</span>
                          <span className="capitalize">{app.status.replace("_", " ")}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-1.5">
                      {app.status === "pending" && (
                        <>
                          <Button variant="outline" size="sm" className="h-8 text-[11px] text-emerald-600 border-emerald-200" icon={<Check size={12} />} onClick={() => handleStatusChange(app._id, "confirmed", "Confirmed by doctor")}>
                            Accept
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 text-[11px] text-red-500" icon={<X size={12} />} onClick={() => handleStatusChange(app._id, "rejected", "Rejected by doctor")}>
                            Reject
                          </Button>
                        </>
                      )}
                      {app.status === "confirmed" && (
                        <Button variant="secondary" size="sm" className="h-8 text-[11px]" icon={<UserCheck size={12} />} onClick={() => handleStatusChange(app._id, "checked_in", "Patient checked in at hospital desk")}>
                          Check In
                        </Button>
                      )}
                      {(app.status === "pending" || app.status === "confirmed" || app.status === "checked_in") && (
                        <Button variant="ghost" size="sm" className="h-8 text-[11px] text-red-500" icon={<UserX size={12} />} onClick={() => handleStatusChange(app._id, "no_show", "Patient did not attend schedule")}>
                          No Show
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

        </div>

        {/* Right Column: Availability Calendar slot builder */}
        <div className="space-y-6">
          <Card>
            <h3 className="font-bold text-sm text-foreground mb-4">Availability Slots</h3>
            
            <form onSubmit={handleAddSlot} className="space-y-3 pb-4 border-b border-border">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Day of Week</label>
                <select
                  value={newDay}
                  onChange={(e) => setNewDay(e.target.value as Slot["dayOfWeek"])}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-transparent text-xs text-foreground cursor-pointer"
                >
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Start Time</label>
                  <ClockTimePicker
                    value={newStart}
                    onChange={(time) => setNewStart(time)}
                    placeholder="Start"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">End Time</label>
                  <ClockTimePicker
                    value={newEnd}
                    onChange={(time) => setNewEnd(time)}
                    placeholder="End"
                  />
                </div>
              </div>

              <Button type="submit" size="sm" className="w-full h-10 text-xs">
                Add Availability Hour
              </Button>
            </form>

            <div className="pt-4 space-y-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">My Active Hours</p>
              {slots.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No hours defined. Patient bookings locked.</p>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {slots.map((slot, i) => (
                    <div key={i} className="flex justify-between items-center text-xs p-2 bg-muted/40 border border-border rounded-lg">
                      <div>
                        <span className="font-bold text-foreground">{slot.dayOfWeek}:</span>{" "}
                        <span className="text-muted-foreground font-mono">{slot.startTime} - {slot.endTime}</span>
                      </div>
                      <button className="text-red-500 hover:text-red-600 p-1" onClick={() => handleDeleteSlot(i)}>
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

      </div>

      {/* CONSULTATION RX DIALOG */}
      {activeConsultation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card w-full max-w-lg border border-border rounded-2xl p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
            <button className="absolute top-4 right-4 text-muted-foreground hover:text-foreground" onClick={() => setActiveConsultation(null)}>
              <X size={20} />
            </button>

            <h3 className="text-xl font-display text-foreground mb-4">Record Consultation details</h3>
            <p className="text-xs text-muted-foreground mb-6">Patient: <span className="font-semibold text-foreground">{activeConsultation.patientId?.name}</span></p>

            <form onSubmit={handleConsultSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Clinical Diagnosis</label>
                <input
                  type="text"
                  placeholder="e.g. Hypertension stage 1, acute bronchitis"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-border bg-transparent text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Rx - Prescribed Medications & Dosage</label>
                <textarea
                  placeholder="e.g. Lisinopril 10mg - once daily after breakfast (30 days)"
                  value={prescription}
                  onChange={(e) => setPrescription(e.target.value)}
                  className="w-full min-h-36 p-4 rounded-xl border border-border bg-transparent text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="w-1/3" onClick={() => setActiveConsultation(null)}>
                  Cancel
                </Button>
                <Button type="submit" className="w-2/3" isLoading={isSubmittingConsult}>
                  Generate Prescription PDF
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
