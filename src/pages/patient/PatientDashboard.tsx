import React from "react";
import { motion } from "motion/react";
import { Calendar, Clock, MapPin, ArrowUpRight, Activity, HeartPulse, FileText } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const healthData = [
  { name: "Mon", hr: 72 },
  { name: "Tue", hr: 75 },
  { name: "Wed", hr: 71 },
  { name: "Thu", hr: 78 },
  { name: "Fri", hr: 74 },
  { name: "Sat", hr: 70 },
  { name: "Sun", hr: 72 },
];

export default function PatientDashboard() {
  const easeOut = [0.16, 1, 0.3, 1] as const;

  const stagger = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easeOut } },
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="max-w-6xl mx-auto space-y-8">
      {/* Welcome Section */}
      <motion.div variants={fadeInUp} className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <Badge className="mb-3">Overview</Badge>
          <h1 className="text-3xl font-display tracking-tight text-foreground">
            Good morning, <span className="gradient-text">Alex</span>
          </h1>
          <p className="text-muted-foreground mt-1">Here is what's happening with your health today.</p>
        </div>
        <Button icon={<Calendar size={18} />}>Book Appointment</Button>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Next Appointment Card - Featured */}
        <motion.div variants={fadeInUp} className="md:col-span-2">
          <Card featured>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex gap-4 items-start">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-accent-secondary p-[1px] shrink-0">
                  <div className="w-full h-full bg-card rounded-[15px] flex flex-col items-center justify-center">
                    <span className="text-xs font-bold text-accent uppercase">Oct</span>
                    <span className="text-xl font-display text-foreground">24</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    Cardiology Checkup
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-accent/10 text-accent uppercase">Confirmed</span>
                  </h3>
                  <p className="text-muted-foreground text-sm mt-1">Dr. Sarah Jenkins • Heart Center</p>
                  <div className="flex items-center gap-4 mt-3 text-sm font-medium text-foreground">
                    <span className="flex items-center gap-1.5"><Clock size={16} className="text-muted-foreground" /> 10:30 AM</span>
                    <span className="flex items-center gap-1.5"><MapPin size={16} className="text-muted-foreground" /> Room 402</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">Reschedule</Button>
                <Button variant="secondary" size="sm" icon={<ArrowUpRight size={16} />} iconPosition="right">Details</Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Quick Vitals */}
        <motion.div variants={fadeInUp}>
          <Card className="h-full flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Heart Rate</p>
                <h3 className="text-3xl font-display mt-1">72 <span className="text-lg text-muted-foreground font-sans">bpm</span></h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center">
                <HeartPulse size={20} />
              </div>
            </div>
            <div className="h-24 -mx-2 -mb-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={healthData}>
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

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Records */}
        <motion.div variants={fadeInUp}>
          <Card>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Recent Records</h3>
              <Button variant="ghost" size="sm">View All</Button>
            </div>
            <div className="space-y-4">
              {[
                { name: "Blood Test Results", date: "Oct 12, 2023", type: "Lab" },
                { name: "General Checkup Notes", date: "Sep 28, 2023", type: "Clinical" },
                { name: "Chest X-Ray", date: "Aug 15, 2023", type: "Imaging" },
              ].map((record, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors group cursor-pointer border border-transparent hover:border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent/5 text-accent flex items-center justify-center">
                      <FileText size={18} />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{record.name}</p>
                      <p className="text-xs text-muted-foreground">{record.date}</p>
                    </div>
                  </div>
                  <Badge>{record.type}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Health Activity */}
        <motion.div variants={fadeInUp}>
          <Card className="bg-foreground text-background dot-pattern">
            <h3 className="text-lg font-semibold text-white mb-6">Activity Snapshot</h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2 text-white/80">
                  <span>Steps (Today)</span>
                  <span className="font-mono">8,240 / 10,000</span>
                </div>
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full" style={{ width: "82%" }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2 text-white/80">
                  <span>Sleep</span>
                  <span className="font-mono">6h 45m / 8h</span>
                </div>
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full" style={{ width: "75%" }} />
                </div>
              </div>
              <div className="mt-6 p-4 rounded-xl border border-white/10 bg-white/5 flex items-start gap-3">
                <Activity className="text-accent shrink-0 mt-0.5" size={20} />
                <p className="text-sm text-white/70 leading-relaxed">
                  Your average sleep duration has improved by <span className="text-white font-medium">12%</span> this week. Keep up the good work for better cardiovascular health.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
