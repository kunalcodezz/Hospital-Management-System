import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "motion/react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import axios from "axios";
import toast from "react-hot-toast";
import { Calendar, Clock, User, ChevronRight, CheckCircle, RefreshCw, X, Receipt, Activity, AlertCircle } from "lucide-react";
import { ClockTimePicker } from "@/components/ui/ClockTimePicker";

interface Appointment {
  _id: string;
  doctorId: {
    _id: string;
    name: string;
    email: string;
  };
  date: string;
  time: string;
  status: "pending" | "confirmed" | "checked_in" | "in_progress" | "completed" | "cancelled" | "rejected" | "no_show";
  notes?: string;
  diagnosis?: string;
  prescription?: string;
  paymentId?: {
    _id: string;
    invoiceNumber: string;
    amount: number;
    paymentStatus: "pending" | "paid" | "failed" | "refunded";
  };
  history: Array<{
    status: string;
    note: string;
    timestamp: string;
  }>;
  createdAt: string;
}

interface Doctor {
  _id: string;
  userId: {
    _id: string;
    name: string;
  };
  department: string;
  consultationFee: number;
  availabilityCalendar: Array<{
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  }>;
}

export default function Appointments() {
  const location = useLocation();
  const stateDoctorId = location.state?.doctorId || "";

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState(stateDoctorId);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [notes, setNotes] = useState("");
  
  // Modals / Details view
  const [activeAppointment, setActiveAppointment] = useState<Appointment | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAppointments = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get("/api/appointments");
      setAppointments(res.data.appointments || []);
    } catch (err) {
      toast.error("Failed to load appointment bookings.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await axios.get("/api/doctors");
      setDoctors(res.data.doctors || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchDoctors();
  }, []);

  // Pre-fill doctor selected from Find Doctors listing
  useEffect(() => {
    if (stateDoctorId) {
      setSelectedDoctorId(stateDoctorId);
      setIsBookingOpen(true);
    }
  }, [stateDoctorId]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorId || !selectedDate || !selectedTime) {
      toast.error("Please fill in all booking fields.");
      return;
    }

    try {
      setIsSubmitting(true);
      await axios.post("/api/appointments", {
        doctorId: selectedDoctorId,
        date: selectedDate,
        time: selectedTime,
        notes,
      });

      toast.success("Appointment request submitted successfully!");
      setIsBookingOpen(false);
      // Reset form
      setSelectedDate("");
      setSelectedTime("");
      setNotes("");
      fetchAppointments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Booking failed. Make sure slots are open.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;

    try {
      await axios.put(`/api/appointments/${id}/status`, {
        status: "cancelled",
        note: "Cancelled by patient via dashboard panel",
      });

      toast.success("Appointment cancelled.");
      fetchAppointments();
      if (activeAppointment?._id === id) {
        setActiveAppointment(null);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Could not cancel booking.");
    }
  };

  const handlePayment = async (paymentId: string) => {
    try {
      await axios.post(`/api/payments/${paymentId}/pay`);
      toast.success("Payment cleared! Appointment confirmed.");
      fetchAppointments();
      if (activeAppointment) {
        // Refresh details modal
        const refreshed = await axios.get(`/api/appointments/${activeAppointment._id}`);
        setActiveAppointment(refreshed.data.appointment);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Payment checkout failed.");
    }
  };

  const selectedDoctor = doctors.find(doc => doc.userId?._id === selectedDoctorId);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400";
      case "completed": return "bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400";
      case "checked_in": return "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-400";
      case "in_progress": return "bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400";
      case "cancelled":
      case "rejected": return "bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400";
      default: return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400";
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12 relative">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <Badge className="w-fit mb-2">Bookings Manager</Badge>
          <h1 className="text-3xl font-display text-foreground">Appointments Portal</h1>
          <p className="text-muted-foreground mt-1">Book new consult schedules and manage medical timelines</p>
        </div>
        <Button onClick={() => setIsBookingOpen(true)} icon={<Calendar size={18} />}>
          Schedule Specialist
        </Button>
      </div>

      {/* Main Grid: Appointment Cards */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map(n => (
            <div key={n} className="animate-pulse bg-card border border-border h-24 rounded-2xl w-full" />
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <Card className="text-center py-16 space-y-3 border-dashed border-2">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto" />
          <h3 className="text-lg font-bold text-foreground">No Bookings Registered</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            You don't have any appointments booked. Start scheduling consultations with clinic doctors.
          </p>
          <Button variant="outline" size="sm" onClick={() => setIsBookingOpen(true)}>
            Schedule Now
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {appointments.map((app) => (
            <Card key={app._id} className="p-5 hover:border-accent/30 transition-all">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-xl bg-accent/5 text-accent flex items-center justify-center shrink-0">
                    <Calendar size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-base">
                      {app.doctorId?.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Clinic Consultation Slot</p>
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground font-semibold">
                      <span className="flex items-center gap-1.5"><Calendar size={14} /> {new Date(app.date).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1.5"><Clock size={14} /> {app.time}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase ${getStatusColor(app.status)}`}>
                    {app.status.replace("_", " ")}
                  </span>
                  
                  <div className="flex gap-1.5">
                    <Button variant="secondary" size="sm" onClick={() => setActiveAppointment(app)}>
                      Timeline / Details
                    </Button>
                    {(app.status === "pending" || app.status === "confirmed") && (
                      <Button variant="outline" size="sm" className="text-red-500 hover:bg-red-50 border-red-200" onClick={() => handleCancel(app._id)}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* MODAL 1: BOOKING SCHEDULER FORM */}
      {isBookingOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card w-full max-w-lg border border-border rounded-2xl p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
            <button className="absolute top-4 right-4 text-muted-foreground hover:text-foreground" onClick={() => setIsBookingOpen(false)}>
              <X size={20} />
            </button>

            <h3 className="text-xl font-display text-foreground mb-6">Schedule Consultation</h3>

            <form onSubmit={handleBooking} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Select Clinic Specialist</label>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-border bg-transparent text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent cursor-pointer"
                >
                  <option value="">Choose Doctor</option>
                  {doctors.map(doc => (
                    <option key={doc._id} value={doc.userId?._id}>{doc.userId?.name} ({doc.department})</option>
                  ))}
                </select>
              </div>

              {selectedDoctor && (
                <div className="p-3.5 bg-muted/40 border border-border rounded-xl space-y-2 text-xs">
                  <p className="font-bold text-foreground">Doctor Availability settings:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    {selectedDoctor.availabilityCalendar.map((slot, i) => (
                      <li key={i}>{slot.dayOfWeek}: {slot.startTime} - {slot.endTime}</li>
                    ))}
                  </ul>
                  <p className="font-bold text-accent pt-1">Fee per consultation: ${selectedDoctor.consultationFee}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Preferred Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-border bg-transparent text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Preferred Time</label>
                  <ClockTimePicker
                    value={selectedTime}
                    onChange={(time) => setSelectedTime(time)}
                    placeholder="Pick a time"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Symptoms / Notes (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Describe your medical condition..."
                  className="w-full min-h-24 p-4 rounded-xl border border-border bg-transparent text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                />
              </div>

              {selectedDoctor && (
                <div className="border-t border-border pt-4 text-xs font-semibold space-y-1 text-muted-foreground">
                  <div className="flex justify-between"><span>Subtotal:</span><span>${selectedDoctor.consultationFee.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>VAT/Service Tax (10%):</span><span>${(selectedDoctor.consultationFee * 0.1).toFixed(2)}</span></div>
                  <div className="flex justify-between border-t border-border pt-2 text-foreground font-bold">
                    <span>Est. Invoice total:</span>
                    <span>${(selectedDoctor.consultationFee * 1.1).toFixed(2)}</span>
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full pt-1" isLoading={isSubmitting}>
                Book and Issue Invoice
              </Button>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL 2: APPOINTMENT TIMELINE & DETAILED INVOICE */}
      {activeAppointment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card w-full max-w-2xl border border-border rounded-2xl p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
            <button className="absolute top-4 right-4 text-muted-foreground hover:text-foreground" onClick={() => setActiveAppointment(null)}>
              <X size={20} />
            </button>

            <h3 className="text-xl font-display text-foreground mb-6">Appointment File Reference</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Details & Payments */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase font-mono tracking-wider">Assigned Provider</h4>
                  <p className="font-bold text-foreground text-sm mt-0.5">{activeAppointment.doctorId?.name}</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase font-mono tracking-wider">Scheduled Slots</h4>
                  <p className="text-sm font-semibold mt-0.5">{new Date(activeAppointment.date).toLocaleDateString()} at {activeAppointment.time}</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase font-mono tracking-wider">Symptoms / Patient Notes</h4>
                  <p className="text-xs text-muted-foreground bg-muted/40 border border-border p-2.5 rounded-lg mt-1 whitespace-pre-wrap">
                    {activeAppointment.notes || "No symptoms listed."}
                  </p>
                </div>

                {/* Consultation prescription outputs */}
                {activeAppointment.status === "completed" && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-xl space-y-2">
                    <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5"><Activity size={14} /> Clinical prescription</h4>
                    <p className="text-xs text-foreground font-semibold">Diagnosis: {activeAppointment.diagnosis}</p>
                    <p className="text-xs text-muted-foreground">Rx: {activeAppointment.prescription}</p>
                    <div className="pt-1.5 flex gap-2">
                      <a href={`/api/appointments/${activeAppointment._id}/prescription`} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="h-8 px-3 text-[10px]">
                          Download Rx PDF
                        </Button>
                      </a>
                      <a href={`/api/appointments/${activeAppointment._id}/slip`} target="_blank" rel="noopener noreferrer">
                        <Button variant="secondary" size="sm" className="h-8 px-3 text-[10px]">
                          Download Entry Slip
                        </Button>
                      </a>
                    </div>
                  </div>
                )}

                {/* Invoice clearance section */}
                {activeAppointment.paymentId && (
                  <div className="p-3 border border-border rounded-xl space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold flex items-center gap-1"><Receipt size={14} /> Invoice #{activeAppointment.paymentId.invoiceNumber}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        activeAppointment.paymentId.paymentStatus === "paid" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                      }`}>{activeAppointment.paymentId.paymentStatus}</span>
                    </div>
                    <p className="text-sm font-bold">Total amount: ${activeAppointment.paymentId.amount.toFixed(2)}</p>
                    
                    <div className="flex gap-2">
                      {activeAppointment.paymentId.paymentStatus === "pending" && (
                        <Button size="sm" className="h-9 px-4 text-xs" onClick={() => handlePayment(activeAppointment.paymentId!._id)}>
                          Pay Invoice Now
                        </Button>
                      )}
                      <a href={`/api/appointments/${activeAppointment._id}/invoice`} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="h-9 px-4 text-xs">
                          Download PDF
                        </Button>
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Workflow Timeline History */}
              <div>
                <h4 className="text-xs font-bold text-muted-foreground uppercase font-mono tracking-wider mb-4">Workflow Progress Timeline</h4>
                <div className="relative border-l border-border pl-4 space-y-5 py-1">
                  {activeAppointment.history.map((log, i) => (
                    <div key={i} className="relative">
                      {/* Timeline dot */}
                      <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-accent border-2 border-card" />
                      <p className="text-xs font-bold text-foreground capitalize">{log.status.replace("_", " ")}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{log.note}</p>
                      <p className="text-[9px] text-muted-foreground font-mono mt-1">{new Date(log.timestamp).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
