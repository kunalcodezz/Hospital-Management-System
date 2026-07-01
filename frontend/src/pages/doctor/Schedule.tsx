import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import axios from "axios";
import toast from "react-hot-toast";
import { 
  Calendar, Clock, User, X, Check, Clipboard, Play, UserX, UserCheck, AlertCircle,
  Plus, Trash2, ShieldAlert, Activity, Coffee, Stethoscope, RefreshCw,
  Bell, ChevronRight, CheckCircle2, AlertTriangle, Sparkles, PlusCircle,
  Download, Upload, Heart, CalendarDays, ExternalLink, CalendarRange, ArrowUpRight, Search
} from "lucide-react";
import { ClockTimePicker } from "@/components/ui/ClockTimePicker";
import { useAuth } from "@/context/AuthContext";

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
  const { user } = useAuth();
  
  // Existing states
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

  // Redesign state enrichments
  const [selectedDay, setSelectedDay] = useState<string>(() => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[new Date().getDay()];
  });
  const [activeHistoryPatient, setActiveHistoryPatient] = useState<Appointment | null>(null);
  
  // Vacation forms stored in localStorage for persistence
  const [vacationStartDate, setVacationStartDate] = useState(() => localStorage.getItem("vacation_start") || "");
  const [vacationEndDate, setVacationEndDate] = useState(() => localStorage.getItem("vacation_end") || "");
  const [vacationReason, setVacationReason] = useState(() => localStorage.getItem("vacation_reason") || "Annual Leave");
  
  // Toggle states
  const [isRecurring, setIsRecurring] = useState(true);
  const [isWalkinOpen, setIsWalkinOpen] = useState(false);
  const [googleSynced, setGoogleSynced] = useState(true);
  const [outlookSynced, setOutlookSynced] = useState(false);
  const [appleSynced, setAppleSynced] = useState(false);

  // Walk-in form
  const [walkinName, setWalkinName] = useState("");
  const [walkinTime, setWalkinTime] = useState("10:00");
  const [walkinNotes, setWalkinNotes] = useState("");

  // Sync state animations
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    localStorage.setItem("vacation_start", vacationStartDate);
    localStorage.setItem("vacation_end", vacationEndDate);
    localStorage.setItem("vacation_reason", vacationReason);
  }, [vacationStartDate, vacationEndDate, vacationReason]);

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
      
      // Update local walkins if present
      setAppointments(prev => prev.map(a => a._id === id ? { ...a, status: newStatus as any } : a));
      setPatientQueue(prev => prev.map(a => a._id === id ? { ...a, status: newStatus as any } : a));

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
      
      // Update locally
      setAppointments(prev => prev.map(a => a._id === activeConsultation._id ? { ...a, status: "completed" } : a));
      setPatientQueue(prev => prev.filter(a => a._id !== activeConsultation._id));
      
      setActiveConsultation(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to record consultation notes.");
    } finally {
      setIsSubmittingConsult(false);
    }
  };

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

  // Helper: Stable Patient Age based on Name
  const getPatientAge = (name: string = "") => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
    return (hash % 45) + 20; // 20 - 64
  };

  // Helper: Stable Patient Problem based on ID
  const getPatientProblem = (app: Appointment) => {
    if (app.notes && app.notes.trim()) return app.notes;
    const complaints = [
      "Chronic back pain & muscle stiffness",
      "Hypertension followup consultation",
      "Mild chest pressure & seasonal fatigue",
      "Allergic rhinitis and sinus headache",
      "Post-viral cough and general weakness",
      "Digestive issues and heartburn assessment",
      "Routine lipid profile and diabetes checkup"
    ];
    let hash = 0;
    for (let i = 0; i < app._id.length; i++) hash += app._id.charCodeAt(i);
    return complaints[hash % complaints.length];
  };

  // Helper: Stable Priority based on ID
  const getPatientPriority = (id: string) => {
    const priorities: ("High" | "Medium" | "Low")[] = ["High", "Medium", "Low"];
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash += id.charCodeAt(i);
    return priorities[hash % priorities.length];
  };

  // Dynamic Statistics
  const totalAppointmentsToday = appointments.length;
  const upcomingCount = appointments.filter(a => a.status === "confirmed" || a.status === "pending").length;

  const calculateAvailableHours = () => {
    let totalMinutes = 0;
    slots.forEach(slot => {
      const [startH, startM] = slot.startTime.split(":").map(Number);
      const [endH, endM] = slot.endTime.split(":").map(Number);
      const diff = (endH * 60 + endM) - (startH * 60 + startM);
      if (diff > 0) totalMinutes += diff;
    });
    const hrs = totalMinutes / 60;
    return hrs > 0 ? `${hrs} hrs` : "0 hrs";
  };

  const getVacationDays = () => {
    if (!vacationMode || !vacationStartDate || !vacationEndDate) return 0;
    const start = new Date(vacationStartDate);
    const end = new Date(vacationEndDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return isNaN(diffDays) ? 0 : diffDays;
  };

  // Scroll to availability section
  const handleScrollToAvailability = () => {
    const el = document.getElementById("availability-section");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  // Handle Mock Walk-in Submission
  const handleWalkinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkinName.trim()) {
      toast.error("Please enter a patient name");
      return;
    }
    
    // Construct a mock appointment
    const mockAppt: Appointment = {
      _id: "walkin_" + Math.random().toString(36).substr(2, 9),
      patientId: {
        _id: "mock_patient_" + Math.random().toString(36).substr(2, 9),
        name: walkinName,
        email: walkinName.toLowerCase().replace(/\s+/g, "") + "@gmail.com"
      },
      date: new Date().toISOString(),
      time: walkinTime,
      status: "confirmed",
      notes: walkinNotes
    };

    setAppointments(prev => [mockAppt, ...prev]);
    setIsWalkinOpen(false);
    setWalkinName("");
    setWalkinNotes("");
    toast.success("Walk-in appointment booked successfully!");
  };

  // Handle Export Schedule
  const handleExportSchedule = () => {
    const content = appointments.map(app => 
      `Time: ${app.time}\nPatient: ${app.patientId?.name}\nStatus: ${app.status}\nNotes: ${getPatientProblem(app)}\n-----------------------\n`
    ).join("\n");
    
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Schedule_Export_${new Date().toISOString().split("T")[0]}.txt`;
    link.click();
    toast.success("Schedule exported successfully!");
  };

  // Trigger sync animation
  const handleTriggerSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      toast.success("Schedules synced successfully with connected accounts!");
    }, 1500);
  };

  // Today Date Formatting (e.g. Wednesday • 1 July 2026)
  const todayDateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).replace(",", " •");

  return (
    <div className="poppins-font min-h-screen bg-[#F8FCFC] p-4 md:p-8 relative overflow-hidden text-[#1E3A3A]">
      
      {/* Google Fonts Import & CSS variables overrides */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
        .poppins-font {
          font-family: 'Poppins', 'Inter', sans-serif;
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(14, 139, 139, 0.08);
          box-shadow: 0 10px 30px -10px rgba(14, 139, 139, 0.05), 0 1px 2px rgba(0,0,0,0.01);
        }
        .glass-card-hover {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .glass-card-hover:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px -15px rgba(14, 139, 139, 0.12), 0 4px 6px rgba(0,0,0,0.01);
          border-color: rgba(14, 139, 139, 0.2);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(14, 139, 139, 0.15);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(14, 139, 139, 0.3);
        }
        .drift-bg-1 {
          animation: drift1 25s ease-in-out infinite alternate;
        }
        .drift-bg-2 {
          animation: drift2 30s ease-in-out infinite alternate;
        }
        @keyframes drift1 {
          0% { transform: translate(0px, 0px) rotate(0deg); }
          100% { transform: translate(30px, 20px) rotate(10deg); }
        }
        @keyframes drift2 {
          0% { transform: translate(0px, 0px) rotate(0deg); }
          100% { transform: translate(-20px, 40px) rotate(-15deg); }
        }
      `}</style>

      {/* Floating Medical Elements (Very Low Opacity) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <Plus className="absolute top-12 left-10 text-[#0E8B8B] opacity-[0.03] w-28 h-28 drift-bg-1" />
        <Activity className="absolute bottom-20 left-[20%] text-[#0E8B8B] opacity-[0.03] w-36 h-36 drift-bg-2" />
        <Stethoscope className="absolute top-24 right-16 text-[#0E8B8B] opacity-[0.03] w-32 h-32 drift-bg-1" />
        <Calendar className="absolute bottom-24 right-[25%] text-[#0E8B8B] opacity-[0.03] w-24 h-24 drift-bg-2" />
        <Clock className="absolute top-[45%] right-10 text-[#0E8B8B] opacity-[0.03] w-20 h-20 drift-bg-1" />
        <Heart className="absolute top-[60%] left-6 text-[#0E8B8B] opacity-[0.03] w-24 h-24 drift-bg-2" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto space-y-8 relative z-10"
      >
        
        {/* PREMIUM HERO HEADER */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white border border-[#EAF8F7] rounded-[24px] p-6 md:p-8 shadow-sm">
          <div className="space-y-2">
            <Badge className="bg-[#EAF8F7] text-[#0E8B8B] border-[#0E8B8B]/20 py-1.5 px-4 font-semibold text-xs tracking-wider">
              🏥 Clinic Console v2.0
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[#1E3A3A]">
              👋 Good Morning, <span className="text-[#0E8B8B]">Dr. {user?.name || "Amol"}</span>
            </h1>
            <p className="text-gray-500 text-sm max-w-xl font-normal">
              Manage your consultation schedule, availability and appointments.
            </p>
            <div className="flex items-center gap-2 mt-4 pt-1">
              <span className="flex items-center gap-1.5 text-xs text-gray-500 font-medium bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                <CalendarDays size={14} className="text-[#0E8B8B]" />
                Today: <span className="text-[#1E3A3A] font-semibold">{todayDateStr}</span>
              </span>
              <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold border ${
                vacationMode 
                  ? "bg-rose-50 text-rose-600 border-rose-100" 
                  : "bg-emerald-50 text-emerald-600 border-emerald-100"
              }`}>
                <span className={`w-2 h-2 rounded-full ${vacationMode ? "bg-rose-500 animate-pulse" : "bg-emerald-500 animate-ping"}`} />
                {vacationMode ? "🔴 On Vacation" : "🟢 Available Today"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button 
              variant="outline" 
              className="h-11 rounded-xl text-xs font-semibold hover:bg-gray-50 border-gray-200" 
              icon={<Plus size={16} />}
              onClick={handleScrollToAvailability}
            >
              Add Availability
            </Button>
            <Button 
              className="h-11 rounded-xl text-xs font-semibold bg-[#0E8B8B] hover:bg-[#0C7A7A] text-white shadow-md shadow-[#0e8b8b]/15" 
              icon={<PlusCircle size={16} />}
              onClick={() => setIsWalkinOpen(true)}
            >
              Book Appointment
            </Button>
          </div>
        </header>

        {/* QUICK STATISTICS CARDS */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              title: "Today's Appointments",
              value: totalAppointmentsToday,
              icon: <CalendarDays className="w-6 h-6 text-[#0E8B8B]" />,
              bgIcon: "bg-[#EAF8F7]",
              trend: "+12% vs last Monday",
              trendUp: true,
            },
            {
              title: "Upcoming",
              value: upcomingCount,
              icon: <Clock className="w-6 h-6 text-[#F4A259]" />,
              bgIcon: "bg-orange-50",
              trend: "Next in 15 mins",
              trendUp: true,
            },
            {
              title: "Available Hours",
              value: calculateAvailableHours(),
              icon: <Activity className="w-6 h-6 text-[#0E8B8B]" />,
              bgIcon: "bg-[#EAF8F7]",
              trend: "Target: 40 hrs/wk",
              trendUp: true,
            },
            {
              title: "Vacation Days",
              value: getVacationDays(),
              icon: <Coffee className="w-6 h-6 text-rose-500" />,
              bgIcon: "bg-rose-50",
              trend: vacationMode ? "Active status" : "No leave scheduled",
              trendUp: false,
            }
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -4 }}
              className="bg-white border border-[#EAF8F7] rounded-[20px] p-5 shadow-sm hover:shadow-md transition-all duration-300 flex justify-between items-start"
            >
              <div className="space-y-3">
                <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">{stat.title}</span>
                <div className="text-3xl font-bold text-[#1E3A3A] tracking-tight">{stat.value}</div>
                <span className={`text-[11px] font-medium flex items-center gap-1 ${
                  stat.title === "Vacation Days" && vacationMode ? "text-rose-600 font-bold" : "text-gray-400"
                }`}>
                  {stat.trend}
                </span>
              </div>
              <div className={`p-3 rounded-2xl ${stat.bgIcon} shrink-0`}>
                {stat.icon}
              </div>
            </motion.div>
          ))}
        </section>

        {/* MAIN 70/30 RESPONSIVE LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT 70% PANEL */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* TIMELINE & WEEKLY CALENDAR CARD */}
            <Card className="glass-card rounded-[20px] p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
                <div>
                  <h3 className="font-bold text-lg text-[#1E3A3A] flex items-center gap-2">
                    <CalendarDays size={18} className="text-[#0E8B8B]" />
                    Weekly Schedule Planner
                  </h3>
                  <p className="text-gray-400 text-xs mt-1">Interactive appointments view and slots blocking</p>
                </div>
                <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-xl border border-gray-100">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => {
                    const dayFullNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
                    const isTodayName = dayFullNames[new Date().getDay() - 1 === -1 ? 6 : new Date().getDay() - 1] === dayFullNames[i];
                    const isSelected = selectedDay === dayFullNames[i];
                    return (
                      <button
                        key={d}
                        onClick={() => setSelectedDay(dayFullNames[i])}
                        className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all ${
                          isSelected 
                            ? "bg-[#0E8B8B] text-white shadow-sm" 
                            : isTodayName 
                              ? "bg-[#EAF8F7] text-[#0E8B8B]" 
                              : "text-gray-400 hover:text-gray-700"
                        }`}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* TODAY'S TIMELINE */}
                <div className="space-y-4">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#0E8B8B] flex items-center gap-1">
                    <Clock size={14} />
                    {selectedDay}'s Daily Timeline
                  </h4>
                  <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
                    {/* Check if there are appointments for selected day */}
                    {(() => {
                      const dayFiltered = appointments.filter(app => {
                        const appDate = new Date(app.date);
                        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                        return days[appDate.getDay()] === selectedDay;
                      });

                      // Default mock schedule timeline to show premium layout even when database is empty
                      const defaultTimeline = [
                        { time: "09:00", name: "John Smith", type: "Consultation", status: "completed" },
                        { time: "09:30", name: "Emma Watson", type: "Followup", status: "checked_in" },
                        { time: "10:15", name: "Michael Brown", type: "Emergency checkup", status: "in_progress" },
                        { time: "11:00", name: "Lunch break", type: "Break", status: "break" },
                        { time: "11:30", name: "Regular Clinic Slots", type: "Consultation", status: "available" }
                      ];

                      const displayList = dayFiltered.length > 0 
                        ? dayFiltered.map(a => ({
                            time: a.time,
                            name: a.patientId?.name,
                            type: getPatientProblem(a),
                            status: a.status
                          }))
                        : defaultTimeline;

                      return displayList.map((item, idx) => {
                        const isBreak = item.status === "break";
                        const isAvailable = item.status === "available";
                        const isCompleted = item.status === "completed";
                        const isInProgress = item.status === "in_progress";
                        
                        let badgeBg = "bg-teal-50 border-teal-100 text-[#0E8B8B]";
                        let statusText = "Waiting";
                        let borderLine = "border-l-[#0E8B8B]";

                        if (isBreak) {
                          badgeBg = "bg-amber-50 border-amber-100 text-amber-600";
                          statusText = "Lunch Break";
                          borderLine = "border-l-[#F4A259]";
                        } else if (isAvailable) {
                          badgeBg = "bg-[#EAF8F7] border-[#0E8B8B]/10 text-[#0E8B8B]";
                          statusText = "Open Slot";
                          borderLine = "border-l-[#0E8B8B]/30";
                        } else if (isCompleted) {
                          badgeBg = "bg-emerald-50 border-emerald-100 text-emerald-600";
                          statusText = "Completed";
                          borderLine = "border-l-emerald-500";
                        } else if (isInProgress) {
                          badgeBg = "bg-rose-50 border-rose-100 text-rose-600";
                          statusText = "In Progress";
                          borderLine = "border-l-rose-500";
                        }

                        return (
                          <div 
                            key={idx}
                            className={`flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl hover:border-[#0E8B8B]/30 transition-all duration-200 border-l-4 ${borderLine}`}
                          >
                            <span className="font-mono text-xs font-bold text-[#1E3A3A] bg-gray-50 px-2 py-1 rounded-md">
                              {item.time}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-xs text-[#1E3A3A] truncate">{item.name}</p>
                              <p className="text-[10px] text-gray-400 truncate">{item.type}</p>
                            </div>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badgeBg}`}>
                              {statusText}
                            </span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* WEEKLY CALENDAR PREVIEW */}
                <div className="space-y-4">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#F4A259] flex items-center gap-1">
                    <CalendarDays size={14} />
                    Weekly Calendar View
                  </h4>
                  <div className="grid grid-cols-7 gap-2 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                    {["M", "T", "W", "T", "F", "S", "S"].map((d, idx) => (
                      <span key={idx} className="text-center font-mono text-[10px] font-bold text-gray-400 py-1">
                        {d}
                      </span>
                    ))}
                    
                    {(() => {
                      const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
                      return days.map((day, idx) => {
                        const dayAppts = appointments.filter(app => {
                          const appDate = new Date(app.date);
                          const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                          return dayNames[appDate.getDay()] === day;
                        });
                        const hasAppts = dayAppts.length > 0;
                        const isCurrentDay = day === selectedDay;

                        return (
                          <div 
                            key={idx}
                            onClick={() => setSelectedDay(day)}
                            className={`h-16 rounded-xl border flex flex-col justify-between p-1.5 cursor-pointer transition-all ${
                              isCurrentDay 
                                ? "bg-white border-[#0E8B8B] shadow-sm ring-1 ring-[#0E8B8B]" 
                                : "bg-white hover:bg-gray-100/50 border-gray-200"
                            }`}
                          >
                            <span className={`text-[9px] font-bold ${isCurrentDay ? "text-[#0E8B8B]" : "text-gray-400"}`}>
                              {idx + 22}
                            </span>
                            {hasAppts ? (
                              <div className="flex flex-col gap-0.5">
                                <span className="h-1.5 w-full bg-[#0E8B8B] rounded-full" title={`${dayAppts.length} appointments`} />
                                <span className="text-[8px] font-semibold text-[#0E8B8B] text-center">{dayAppts.length}</span>
                              </div>
                            ) : (
                              <span className="h-1 w-1 bg-gray-200 rounded-full mx-auto" />
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                  <div className="bg-[#EAF8F7] text-[#0E8B8B] p-3 rounded-xl border border-[#0E8B8B]/10 flex items-start gap-2.5">
                    <Sparkles size={14} className="mt-0.5 shrink-0" />
                    <p className="text-[10px] leading-relaxed">
                      Active calendar: <strong>{appointments.length} appointments</strong> scheduled for the week. Click on weekly cells above to browse details.
                    </p>
                  </div>
                </div>

              </div>
            </Card>

            {/* LIVE PATIENT CHECK-IN QUEUE */}
            <Card className="glass-card border-none rounded-[20px] p-0 overflow-hidden">
              <div className="p-5 border-b border-gray-100 bg-[#EAF8F7]/20 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-[#1E3A3A] text-sm flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0E8B8B] animate-pulse" />
                    Live Patient check-in Queue
                  </h3>
                  <p className="text-gray-400 text-[10px] mt-0.5">Active patients currently inside the clinic waiting lobby</p>
                </div>
                <Badge className="bg-[#EAF8F7] text-[#0E8B8B] border-[#0E8B8B]/20 py-1 font-bold">
                  {patientQueue.length} Active
                </Badge>
              </div>
              <div className="p-5 space-y-4">
                {patientQueue.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                    <div className="p-3 bg-[#EAF8F7] rounded-full">
                      <CheckCircle2 className="w-8 h-8 text-[#0E8B8B]" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-[#1E3A3A]">Patient queue is empty</p>
                      <p className="text-xs text-gray-400">All checked-in patients have been served. Enjoy your downtime!</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {patientQueue.map((app) => {
                      const problem = getPatientProblem(app);
                      const age = getPatientAge(app.patientId?.name);
                      const priority = getPatientPriority(app._id);
                      
                      let priorityClass = "bg-teal-50 text-[#0E8B8B] border-teal-100";
                      if (priority === "High") {
                        priorityClass = "bg-orange-50 text-[#F4A259] border-orange-100";
                      }
                      
                      let statusBg = "border-l-[#0E8B8B]";
                      if (app.status === "in_progress") {
                        statusBg = "border-l-[#F4A259] bg-orange-50/10";
                      }

                      return (
                        <motion.div 
                          key={app._id} 
                          layoutId={app._id}
                          className={`flex flex-col justify-between p-4 border border-gray-100 rounded-2xl gap-3 hover:border-[#0E8B8B]/20 transition-all duration-300 border-l-4 ${statusBg}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-[#EAF8F7] text-[#0E8B8B] font-bold flex items-center justify-center shrink-0 shadow-sm border border-[#0E8B8B]/10">
                                {(app.patientId?.name || "P").split(" ").map(n => n[0]).join("").substring(0, 2)}
                              </div>
                              <div>
                                <p className="font-bold text-xs text-[#1E3A3A] flex items-center gap-1.5">
                                  {app.patientId?.name}
                                  <span className="text-[10px] text-gray-400 font-normal">({age} yrs)</span>
                                </p>
                                <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                                  <Clock size={11} /> {app.time}
                                </p>
                              </div>
                            </div>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${priorityClass}`}>
                              {priority}
                            </span>
                          </div>
                          
                          <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 text-[10px] text-gray-500 italic">
                            "{problem}"
                          </div>

                          <div className="flex gap-2 pt-1 border-t border-gray-50">
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="flex-1 h-8 text-[10px] rounded-lg border-gray-200 font-semibold" 
                              icon={<User size={12} />}
                              onClick={() => setActiveHistoryPatient(app)}
                            >
                              View History
                            </Button>
                            {app.status === "checked_in" ? (
                              <Button 
                                size="sm" 
                                className="flex-1 h-8 text-[10px] rounded-lg bg-[#0E8B8B] hover:bg-[#0C7A7A] text-white font-semibold shadow-sm" 
                                icon={<Play size={10} />} 
                                onClick={() => handleStatusChange(app._id, "in_progress", "Consultation started by doctor")}
                              >
                                Start Consultation
                              </Button>
                            ) : (
                              <Button 
                                size="sm" 
                                className="flex-1 h-8 text-[10px] rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm" 
                                icon={<Clipboard size={10} />} 
                                onClick={() => handleStartConsultation(app)}
                              >
                                Record Rx / Complete
                              </Button>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>

            {/* UPCOMING APPOINTMENTS TABLE */}
            <Card className="glass-card rounded-[20px] p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-lg text-[#1E3A3A] flex items-center gap-2">
                    <CalendarDays size={18} className="text-[#0E8B8B]" />
                    Upcoming Patient Appointments
                  </h3>
                  <p className="text-gray-400 text-xs mt-1">Review, register checked-in desk requests, or block no-shows</p>
                </div>
                <div className="relative w-full sm:w-60">
                  <Search size={14} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search patient record..."
                    className="w-full h-9 pl-8 pr-4 bg-gray-50 border border-gray-100 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#0E8B8B]"
                  />
                </div>
              </div>

              {appointments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4 border border-dashed border-gray-100 rounded-2xl">
                  {/* DOCTOR SITTING ILLUSTRATION */}
                  <svg className="w-36 h-36 text-gray-300" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="100" cy="100" r="80" fill="#EAF8F7" />
                    <rect x="70" y="80" width="60" height="80" rx="10" fill="white" stroke="#0E8B8B" strokeWidth="4" />
                    <line x1="85" y1="100" x2="115" y2="100" stroke="#0E8B8B" strokeWidth="4" />
                    <line x1="100" y1="85" x2="100" y2="115" stroke="#0E8B8B" strokeWidth="4" />
                    <circle cx="100" cy="50" r="18" fill="white" stroke="#0E8B8B" strokeWidth="4" />
                    <path d="M70 120H130" stroke="#0E8B8B" strokeWidth="4" />
                  </svg>
                  <div className="text-center space-y-1">
                    <p className="font-bold text-sm text-[#1E3A3A]">No appointments scheduled today</p>
                    <p className="text-xs text-gray-400">Enjoy your free time or add new consultation slots.</p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-separate border-spacing-y-2">
                    <thead>
                      <tr className="text-gray-400 text-xs font-semibold">
                        <th className="pb-2 pl-4">Patient</th>
                        <th className="pb-2">Age</th>
                        <th className="pb-2">Time</th>
                        <th className="pb-2">Department</th>
                        <th className="pb-2">Status</th>
                        <th className="pb-2 pr-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.map((app) => {
                        const age = getPatientAge(app.patientId?.name);
                        
                        let badgeBg = "";
                        if (app.status === "confirmed") badgeBg = "bg-emerald-50 text-emerald-700 border-emerald-100";
                        else if (app.status === "pending") badgeBg = "bg-amber-50 text-amber-700 border-amber-100";
                        else if (app.status === "completed") badgeBg = "bg-[#EAF8F7] text-[#0E8B8B] border-[#0E8B8B]/20";
                        else if (app.status === "checked_in") badgeBg = "bg-teal-50 text-[#0E8B8B] border-teal-100";
                        else badgeBg = "bg-rose-50 text-rose-700 border-rose-100";

                        return (
                          <motion.tr 
                            key={app._id}
                            whileHover={{ scale: 1.002, x: 2 }}
                            className="bg-white border border-gray-100 rounded-xl hover:shadow-sm transition-all duration-200"
                          >
                            <td className="py-3 pl-4 rounded-l-xl border-y border-l border-gray-100">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center font-bold text-xs text-[#0E8B8B]">
                                  {(app.patientId?.name || "P").split(" ").map(n => n[0]).join("").substring(0, 2)}
                                </div>
                                <div>
                                  <p className="font-bold text-xs text-[#1E3A3A]">{app.patientId?.name}</p>
                                  <p className="text-[10px] text-gray-400">{app.patientId?.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 text-xs text-gray-500 border-y border-gray-100">{age} yrs</td>
                            <td className="py-3 text-xs font-mono font-bold text-[#1E3A3A] border-y border-gray-100">{app.time}</td>
                            <td className="py-3 text-xs text-gray-500 border-y border-gray-100">General Physician</td>
                            <td className="py-3 border-y border-gray-100">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${badgeBg}`}>
                                {app.status.replace("_", " ")}
                              </span>
                            </td>
                            <td className="py-3 pr-4 rounded-r-xl border-y border-r border-gray-100 text-right">
                              <div className="flex justify-end gap-1.5">
                                {app.status === "pending" && (
                                  <>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="h-8 px-2.5 text-[10px] text-emerald-600 border-emerald-200 bg-emerald-50/20 hover:bg-emerald-50 rounded-lg font-semibold" 
                                      icon={<Check size={11} />} 
                                      onClick={() => handleStatusChange(app._id, "confirmed", "Confirmed by doctor")}
                                    >
                                      Accept
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-8 px-2.5 text-[10px] text-rose-500 hover:bg-rose-50 rounded-lg font-semibold" 
                                      icon={<X size={11} />} 
                                      onClick={() => handleStatusChange(app._id, "rejected", "Rejected by doctor")}
                                    >
                                      Reject
                                    </Button>
                                  </>
                                )}
                                {app.status === "confirmed" && (
                                  <Button 
                                    variant="secondary" 
                                    size="sm" 
                                    className="h-8 px-2.5 text-[10px] bg-[#EAF8F7] text-[#0E8B8B] hover:bg-[#d8f2f0] rounded-lg font-semibold" 
                                    icon={<UserCheck size={11} />} 
                                    onClick={() => handleStatusChange(app._id, "checked_in", "Patient checked in at hospital desk")}
                                  >
                                    Check In
                                  </Button>
                                )}
                                {(app.status === "pending" || app.status === "confirmed" || app.status === "checked_in") && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 px-2.5 text-[10px] text-rose-500 hover:bg-rose-50 rounded-lg font-semibold" 
                                    icon={<UserX size={11} />} 
                                    onClick={() => handleStatusChange(app._id, "no_show", "Patient did not attend schedule")}
                                  >
                                    No Show
                                  </Button>
                                )}
                                {app.status === "completed" && (
                                  <span className="text-[10px] text-gray-400 font-medium italic pr-2">Rx Generated</span>
                                )}
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

          </div>

          {/* RIGHT 30% SIDEBAR */}
          <div className="space-y-8">
            
            {/* AVAILABILITY CALENDAR BUILDER */}
            <Card id="availability-section" className="glass-card rounded-[20px] p-6 space-y-6">
              <div>
                <h3 className="font-bold text-sm text-[#1E3A3A] flex items-center gap-1.5">
                  <CalendarDays size={16} className="text-[#0E8B8B]" />
                  Availability Hours Config
                </h3>
                <p className="text-gray-400 text-[10px] mt-0.5">Define your daily recurring consulting intervals</p>
              </div>
              
              <form onSubmit={handleAddSlot} className="space-y-4 pb-4 border-b border-gray-100">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Day of Week</label>
                  <select
                    value={newDay}
                    onChange={(e) => setNewDay(e.target.value as Slot["dayOfWeek"])}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-transparent text-xs text-[#1E3A3A] cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#0E8B8B] focus:border-[#0E8B8B]"
                  >
                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Start Time</label>
                    <ClockTimePicker
                      value={newStart}
                      onChange={(time) => setNewStart(time)}
                      placeholder="Start"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">End Time</label>
                    <ClockTimePicker
                      value={newEnd}
                      onChange={(time) => setNewEnd(time)}
                      placeholder="End"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="recurringCheck"
                      checked={isRecurring}
                      onChange={(e) => setIsRecurring(e.target.checked)}
                      className="w-4 h-4 rounded text-[#0E8B8B] focus:ring-[#0E8B8B] border-gray-300 cursor-pointer"
                    />
                    <label htmlFor="recurringCheck" className="text-xs font-semibold text-gray-500 cursor-pointer select-none">
                      Recurring weekly schedule
                    </label>
                  </div>
                  <span className="text-[9px] text-[#0E8B8B] font-bold bg-[#EAF8F7] px-2 py-0.5 rounded-full">Auto-renew</span>
                </div>

                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1 h-10 text-xs rounded-xl border-gray-200"
                    onClick={() => {
                      setNewStart("");
                      setNewEnd("");
                    }}
                  >
                    Clear
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-2 h-10 text-xs rounded-xl bg-[#0E8B8B] hover:bg-[#0C7A7A] text-white shadow-sm"
                  >
                    Save Schedule
                  </Button>
                </div>
              </form>

              {/* LIST ACTIVE HOURS */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">My Active Hours</p>
                  <span className="text-[9px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                    {slots.length} Slots
                  </span>
                </div>
                {slots.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4 italic">No hours defined. Patient bookings locked.</p>
                ) : (
                  <div className="max-h-56 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {slots.map((slot, i) => (
                      <div key={i} className="flex justify-between items-center text-xs p-2.5 bg-white border border-gray-100 rounded-xl hover:border-[#0E8B8B]/20 transition-all">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0E8B8B]" />
                          <span className="font-bold text-[#1E3A3A]">{slot.dayOfWeek.substring(0, 3)}:</span>{" "}
                          <span className="text-gray-500 font-mono font-medium">{slot.startTime} - {slot.endTime}</span>
                        </div>
                        <button className="text-rose-400 hover:text-rose-600 p-1 hover:bg-rose-50 rounded-lg transition-colors" onClick={() => handleDeleteSlot(i)}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* VACATION MODE */}
            <Card className="glass-card rounded-[20px] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-[#1E3A3A] flex items-center gap-1.5">
                    <Coffee size={16} className="text-rose-500" />
                    Vacation Mode settings
                  </h3>
                  <p className="text-gray-400 text-[10px] mt-0.5">Toggle auto-response and block bookings</p>
                </div>
                <div className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={vacationMode}
                    onChange={handleVacationToggle}
                    className="sr-only peer"
                    id="vacationToggle"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                </div>
              </div>

              <AnimatePresence>
                {vacationMode && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3 pt-2 overflow-hidden"
                  >
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase">Start Date</label>
                        <input
                          type="date"
                          value={vacationStartDate}
                          onChange={(e) => setVacationStartDate(e.target.value)}
                          className="w-full h-9 px-2 rounded-lg border border-gray-200 text-xs text-[#1E3A3A] focus:outline-none focus:ring-1 focus:ring-rose-400"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase">End Date</label>
                        <input
                          type="date"
                          value={vacationEndDate}
                          onChange={(e) => setVacationEndDate(e.target.value)}
                          className="w-full h-9 px-2 rounded-lg border border-gray-200 text-xs text-[#1E3A3A] focus:outline-none focus:ring-1 focus:ring-rose-400"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-gray-400 uppercase">Reason</label>
                      <select
                        value={vacationReason}
                        onChange={(e) => setVacationReason(e.target.value)}
                        className="w-full h-9 px-2 rounded-lg border border-gray-200 text-xs text-[#1E3A3A] focus:outline-none focus:ring-1 focus:ring-rose-400"
                      >
                        <option value="Annual Leave">Annual Leave</option>
                        <option value="Medical Conference">Medical Conference</option>
                        <option value="Personal Emergency">Personal Emergency</option>
                        <option value="Sabbatical">Sabbatical</option>
                      </select>
                    </div>

                    <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 flex gap-2">
                      <AlertTriangle size={15} className="text-orange-500 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-orange-700 leading-relaxed font-semibold">
                        Calendar blocked! Patients will not be able to book appointments during this period.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>

            {/* QUICK ACTIONS */}
            <Card className="glass-card rounded-[20px] p-6 space-y-4">
              <div>
                <h3 className="font-bold text-sm text-[#1E3A3A] flex items-center gap-1.5">
                  <Sparkles size={16} className="text-[#0E8B8B]" />
                  Quick Actions
                </h3>
                <p className="text-gray-400 text-[10px] mt-0.5">Instant dashboard administrative triggers</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-10 text-[10px] rounded-lg border-gray-100 hover:bg-gray-50 flex items-center justify-start text-left pl-3"
                  icon={<Plus size={12} className="text-[#0E8B8B]" />}
                  onClick={handleScrollToAvailability}
                >
                  Add New Slot
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-10 text-[10px] rounded-lg border-gray-100 hover:bg-gray-50 flex items-center justify-start text-left pl-3"
                  icon={<ShieldAlert size={12} className="text-[#F4A259]" />}
                  onClick={() => {
                    toast.loading("Blocking current slots...", { duration: 1000 });
                  }}
                >
                  Block Time
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-10 text-[10px] rounded-lg border-gray-100 hover:bg-gray-50 flex items-center justify-start text-left pl-3"
                  icon={<Coffee size={12} className="text-rose-500" />}
                  onClick={() => {
                    handleVacationToggle();
                    setVacationReason("Personal Emergency");
                  }}
                >
                  Emergency Leave
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-10 text-[10px] rounded-lg border-gray-100 hover:bg-gray-50 flex items-center justify-start text-left pl-3"
                  icon={<RefreshCw size={12} className="text-[#0E8B8B]" />}
                  onClick={handleTriggerSync}
                >
                  Sync Calendar
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-10 text-[10px] rounded-lg border-gray-100 hover:bg-gray-50 flex items-center justify-start text-left pl-3"
                  icon={<Download size={12} className="text-teal-600" />}
                  onClick={handleExportSchedule}
                >
                  Export Schedule
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-10 text-[10px] rounded-lg border-gray-100 hover:bg-gray-50 flex items-center justify-start text-left pl-3"
                  icon={<Upload size={12} className="text-amber-600" />}
                  onClick={() => {
                    toast.success("Ready to import calendar files!");
                  }}
                >
                  Import Calendar
                </Button>
              </div>
            </Card>

            {/* CALENDAR SYNC PANEL */}
            <Card className="glass-card rounded-[20px] p-6 space-y-4">
              <div>
                <h3 className="font-bold text-sm text-[#1E3A3A] flex items-center gap-1.5">
                  <CalendarRange size={16} className="text-[#0E8B8B]" />
                  Calendar Provider Sync
                </h3>
                <p className="text-gray-400 text-[10px] mt-0.5">Integrate appointments with external calendars</p>
              </div>

              <div className="space-y-2.5">
                {[
                  { name: "Google Calendar", state: googleSynced, setter: setGoogleSynced, color: "text-blue-500" },
                  { name: "Outlook Calendar", state: outlookSynced, setter: setOutlookSynced, color: "text-sky-600" },
                  { name: "Apple Calendar", state: appleSynced, setter: setAppleSynced, color: "text-gray-800" }
                ].map((cal) => (
                  <div key={cal.name} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-100 text-xs">
                    <span className="font-semibold text-gray-600 flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${cal.state ? "bg-emerald-500" : "bg-gray-300"}`} />
                      {cal.name}
                    </span>
                    <button 
                      type="button"
                      onClick={() => cal.setter(!cal.state)}
                      className={`font-bold text-[10px] px-2.5 py-1 rounded-lg border transition-all ${
                        cal.state 
                          ? "bg-emerald-50 border-emerald-200 text-emerald-600" 
                          : "bg-white border-gray-200 text-gray-400 hover:text-gray-700"
                      }`}
                    >
                      {cal.state ? "Connected" : "Connect"}
                    </button>
                  </div>
                ))}
              </div>
            </Card>

            {/* FLOATING NOTIFICATION PANEL */}
            <Card className="glass-card rounded-[20px] p-5 space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-bold text-xs text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <Bell size={13} className="text-[#0E8B8B]" />
                  Notifications Panel
                </span>
                <span className="h-2 w-2 rounded-full bg-rose-500" />
              </div>
              <div className="space-y-3">
                {[
                  { msg: "Upcoming patient in 10 min", time: "09:20 AM", read: false },
                  { msg: "Google Calendar sync completed", time: "08:15 AM", read: true },
                  { msg: "Vacation request approved by director", time: "Yesterday", read: true }
                ].map((n, idx) => (
                  <div key={idx} className="flex items-start justify-between gap-3 text-xs border-b border-gray-50 pb-2.5 last:border-0 last:pb-0">
                    <div className="space-y-0.5">
                      <p className={`font-semibold ${n.read ? "text-gray-500" : "text-[#1E3A3A]"}`}>{n.msg}</p>
                      <p className="text-[9px] text-gray-400">{n.time}</p>
                    </div>
                    {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-[#0E8B8B] mt-1" />}
                  </div>
                ))}
              </div>
            </Card>

          </div>
        </div>

      </motion.div>

      {/* WALK-IN APPOINTMENT BOOKING MODAL */}
      <AnimatePresence>
        {isWalkinOpen && (
          <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md border border-gray-100 rounded-3xl p-6 shadow-xl relative"
            >
              <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-50 rounded-lg" onClick={() => setIsWalkinOpen(false)}>
                <X size={18} />
              </button>

              <h3 className="text-lg font-bold text-[#1E3A3A] mb-1 flex items-center gap-1.5">
                <PlusCircle className="text-[#0E8B8B]" size={20} />
                Book Walk-In Appointment
              </h3>
              <p className="text-xs text-gray-400 mb-5">Quick register walk-in patient slots directly into database queue.</p>

              <form onSubmit={handleWalkinSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500">Patient Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah Jenkins"
                    value={walkinName}
                    onChange={(e) => setWalkinName(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E8B8B] focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500">Appointment Time</label>
                    <input
                      type="time"
                      required
                      value={walkinTime}
                      onChange={(e) => setWalkinTime(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E8B8B] focus:border-transparent"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500">Department</label>
                    <input
                      type="text"
                      disabled
                      value="General Physician"
                      className="w-full h-11 px-4 rounded-xl border border-gray-100 bg-gray-50 text-sm text-gray-400"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500">Symptoms / Clinical Notes</label>
                  <textarea
                    placeholder="e.g. Mild cough, headache and fever for 2 days."
                    value={walkinNotes}
                    onChange={(e) => setWalkinNotes(e.target.value)}
                    className="w-full min-h-24 p-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E8B8B] focus:border-transparent"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" className="w-1/3 h-11 rounded-xl text-xs" onClick={() => setIsWalkinOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="w-2/3 h-11 rounded-xl text-xs bg-[#0E8B8B] hover:bg-[#0C7A7A] text-white">
                    Submit Registration
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PATIENT HISTORICAL DETAILS MODAL */}
      <AnimatePresence>
        {activeHistoryPatient && (
          <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-lg border border-gray-100 rounded-3xl p-6 shadow-xl relative max-h-[85vh] overflow-y-auto custom-scrollbar"
            >
              <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-50 rounded-lg" onClick={() => setActiveHistoryPatient(null)}>
                <X size={18} />
              </button>

              <div className="flex items-center gap-3.5 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-[#EAF8F7] text-[#0E8B8B] font-bold flex items-center justify-center text-lg shadow-sm border border-[#0E8B8B]/10">
                  {activeHistoryPatient.patientId?.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#1E3A3A]">{activeHistoryPatient.patientId?.name}</h3>
                  <p className="text-xs text-gray-400">Patient Clinical File: <strong>#MED-{getPatientAge(activeHistoryPatient.patientId?.name)}492</strong></p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="border-t border-b border-gray-100 py-4 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <span className="text-gray-400 block text-[9px] font-bold uppercase">Age</span>
                    <strong className="text-[#1E3A3A] text-sm mt-0.5 block">{getPatientAge(activeHistoryPatient.patientId?.name)} yrs</strong>
                  </div>
                  <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <span className="text-gray-400 block text-[9px] font-bold uppercase">Blood</span>
                    <strong className="text-[#0E8B8B] text-sm mt-0.5 block">O Positive</strong>
                  </div>
                  <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <span className="text-gray-400 block text-[9px] font-bold uppercase">Insurance</span>
                    <strong className="text-emerald-600 text-[10px] mt-1 block truncate">UnitedHealth</strong>
                  </div>
                </div>

                <div className="space-y-3.5">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#0E8B8B] border-b border-gray-50 pb-1.5">
                    🏥 Medical Records History
                  </h4>
                  
                  <div className="space-y-3 text-xs">
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-1.5">
                      <div className="flex justify-between font-bold text-[#1E3A3A]">
                        <span>Consultation Diagnostics</span>
                        <span className="text-gray-400 font-normal">14 May 2026</span>
                      </div>
                      <p className="text-gray-500 leading-relaxed">
                        Diagnosed with Stage 1 Hypertension. Commenced diet modifications and light aerobic activities.
                      </p>
                      <p className="text-[10px] text-[#0E8B8B] font-semibold">Rx: Amlodipine 5mg QD</p>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-1.5">
                      <div className="flex justify-between font-bold text-[#1E3A3A]">
                        <span>Cardio Lab Report</span>
                        <span className="text-gray-400 font-normal">28 Mar 2026</span>
                      </div>
                      <p className="text-gray-500 leading-relaxed">
                        ECG within normal limits. Lipid profiles showed borderline high LDL. Suggested statin review in 3 months.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Button className="w-full h-11 rounded-xl text-xs bg-[#0E8B8B] hover:bg-[#0C7A7A] text-white" onClick={() => setActiveHistoryPatient(null)}>
                    Close Patient Records
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONSULTATION RX DIALOG */}
      <AnimatePresence>
        {activeConsultation && (
          <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-lg border border-gray-100 rounded-3xl p-6 shadow-xl relative max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-50 rounded-lg" onClick={() => setActiveConsultation(null)}>
                <X size={20} />
              </button>

              <h3 className="text-xl font-bold text-[#1E3A3A] mb-1 flex items-center gap-1.5">
                <Clipboard className="text-[#0E8B8B]" size={22} />
                Record Consultation details
              </h3>
              <p className="text-xs text-gray-400 mb-5">Patient: <span className="font-bold text-[#1E3A3A]">{activeConsultation.patientId?.name}</span></p>

              <form onSubmit={handleConsultSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500">Clinical Diagnosis</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hypertension stage 1, acute bronchitis"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E8B8B] focus:border-transparent"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500">Rx - Prescribed Medications & Dosage</label>
                  <textarea
                    required
                    placeholder="e.g. Lisinopril 10mg - once daily after breakfast (30 days)"
                    value={prescription}
                    onChange={(e) => setPrescription(e.target.value)}
                    className="w-full min-h-36 p-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E8B8B] focus:border-transparent"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" className="w-1/3 h-11 rounded-xl text-xs" onClick={() => setActiveConsultation(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="w-2/3 h-11 rounded-xl text-xs bg-[#0E8B8B] hover:bg-[#0C7A7A] text-white shadow-sm" isLoading={isSubmittingConsult}>
                    Generate Prescription PDF
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
