import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Calendar, Clock, MapPin, ArrowUpRight, Activity, HeartPulse, FileText, Bell, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";

const heartRateTrend = [
  { name: "Mon", hr: 72 },
  { name: "Tue", hr: 75 },
  { name: "Wed", hr: 71 },
  { name: "Thu", hr: 78 },
  { name: "Fri", hr: 74 },
  { name: "Sat", hr: 70 },
  { name: "Sun", hr: 72 },
];

export default function PatientDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [profileCompletion, setProfileCompletion] = useState(30);
  const [isLoading, setIsLoading] = useState(true);

  const easeOut = [0.16, 1, 0.3, 1] as const;

  const stagger = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easeOut } },
  };

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      // 1. Get Me & Profile
      const meRes = await axios.get("/api/users/me");
      const prof = meRes.data.profile;
      setProfile(prof);

      // Calculate profile completion progress score
      if (prof) {
        let score = 30; // base auth registration
        if (prof.height > 0) score += 15;
        if (prof.weight > 0) score += 15;
        if (prof.bloodGroup) score += 15;
        if (prof.allergies?.length > 0) score += 10;
        if (prof.emergencyContact?.phone) score += 15;
        setProfileCompletion(Math.min(100, score));
      }

      // 2. Fetch appointments
      const appRes = await axios.get("/api/appointments");
      const appList = appRes.data.appointments || [];
      const upcomingFiltered = appList.filter((app: any) => 
        app.status === "confirmed" || app.status === "pending" || app.status === "checked_in"
      );
      setUpcoming(upcomingFiltered);

      // 3. Fetch notifications
      const notifRes = await axios.get("/api/notifications");
      setNotifications(notifRes.data.notifications || []);

    } catch (err) {
      console.error("Dashboard statistics loading failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const nextAppointment = upcoming[0];

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Welcome Section */}
      <motion.div variants={fadeInUp} className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <Badge className="mb-3">Personal Health Portal</Badge>
          <h1 className="text-3xl font-display tracking-tight text-foreground">
            Good morning, <span className="gradient-text">{user?.name}</span>
          </h1>
          <p className="text-muted-foreground mt-1">Review vital parameters, upcoming bookings, and health progress</p>
        </div>
        <Link to="/patient/appointments">
          <Button icon={<Calendar size={18} />}>Book Appointment</Button>
        </Link>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Next Appointment Card */}
        <motion.div variants={fadeInUp} className="md:col-span-2">
          {nextAppointment ? (
            <Card featured>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex gap-4 items-start">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-accent-secondary p-[1px] shrink-0">
                    <div className="w-full h-full bg-card rounded-[15px] flex flex-col items-center justify-center">
                      <span className="text-xs font-bold text-accent uppercase">
                        {new Date(nextAppointment.date).toLocaleString("en-US", { month: "short" })}
                      </span>
                      <span className="text-xl font-display text-foreground">
                        {new Date(nextAppointment.date).getDate()}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      Consultation Session
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-accent/10 text-accent uppercase">
                        {nextAppointment.status}
                      </span>
                    </h3>
                    <p className="text-muted-foreground text-sm mt-1">{nextAppointment.doctorId?.name || "Clinic Doctor"}</p>
                    <div className="flex items-center gap-4 mt-3 text-sm font-medium text-foreground">
                      <span className="flex items-center gap-1.5"><Clock size={16} className="text-muted-foreground" /> {nextAppointment.time}</span>
                      <span className="flex items-center gap-1.5"><MapPin size={16} className="text-muted-foreground" /> Room 102</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link to="/patient/appointments">
                    <Button variant="secondary" size="sm" icon={<ArrowUpRight size={16} />} iconPosition="right">Manage Bookings</Button>
                  </Link>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="h-full flex flex-col justify-center items-center py-8 text-center text-muted-foreground border-dashed border-2">
              <Calendar className="w-10 h-10 mb-2" />
              <p className="text-sm">No upcoming appointments scheduled</p>
              <Link to="/patient/appointments" className="mt-3">
                <Button variant="outline" size="sm">Schedule Now</Button>
              </Link>
            </Card>
          )}
        </motion.div>

        {/* Vital Metrics Chart */}
        <motion.div variants={fadeInUp}>
          <Card className="h-full flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cardiac Rate</p>
                <h3 className="text-3xl font-display mt-1">72 <span className="text-lg text-muted-foreground font-sans">bpm</span></h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center">
                <HeartPulse size={20} />
              </div>
            </div>
            <div className="h-24 -mx-2 -mb-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={heartRateTrend}>
                  <defs>
                    <linearGradient id="colorHr" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="hr" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#colorHr)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Vital Health Summary */}
        <motion.div variants={fadeInUp} className="md:col-span-1">
          <Card className="h-full space-y-4">
            <h3 className="text-base font-semibold text-foreground">Health Parameters</h3>
            {profile ? (
              <div className="space-y-3.5 text-sm">
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">Height:</span>
                  <span className="font-bold text-foreground">{profile.height} cm</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">Weight:</span>
                  <span className="font-bold text-foreground">{profile.weight} kg</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">Blood Type:</span>
                  <span className="font-bold text-foreground">{profile.bloodGroup || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">BMI Score:</span>
                  <span className="font-bold text-accent">{profile.bmi}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Parameters card is blank. Please complete your clinical folders.</p>
            )}
          </Card>
        </motion.div>

        {/* Profile Completion Card */}
        <motion.div variants={fadeInUp} className="md:col-span-1">
          <Card className="h-full flex flex-col justify-between">
            <h3 className="text-base font-semibold text-foreground">Profile Completion Progress</h3>
            <div className="space-y-4 py-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Setup Progress</span>
                <span className="font-bold text-accent">{profileCompletion}%</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-accent transition-all duration-500" style={{ width: `${profileCompletion}%` }} />
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Add emergency contact info and policy details under Settings to hit 100%.
              </p>
            </div>
            <Link to="/settings" className="block pt-2">
              <Button variant="outline" size="sm" className="w-full">Edit Health Card</Button>
            </Link>
          </Card>
        </motion.div>

        {/* Alert Notifications Card */}
        <motion.div variants={fadeInUp} className="md:col-span-1">
          <Card className="h-full flex flex-col justify-between p-0 overflow-hidden">
            <div className="p-5 border-b border-border flex justify-between items-center">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Bell size={16} className="text-accent" /> Updates & Notifications
              </h3>
            </div>
            <div className="p-5 flex-1 overflow-y-auto max-h-[160px] space-y-3">
              {notifications.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No recent updates.</p>
              ) : (
                notifications.slice(0, 3).map((notif, idx) => (
                  <div key={idx} className="flex gap-2 text-xs border-b border-border/50 pb-2">
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-foreground">{notif.title}</p>
                      <p className="text-muted-foreground text-[10px] mt-0.5">{notif.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
