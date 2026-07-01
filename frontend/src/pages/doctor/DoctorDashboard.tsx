import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Clock, Users, Calendar, Activity, TrendingUp, Star, Award, ShieldAlert } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";

interface Appointment {
  _id: string;
  patientId: {
    name: string;
  };
  time: string;
}

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [appointmentsCount, setAppointmentsCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [queueCount, setQueueCount] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [nextAppointment, setNextAppointment] = useState<Appointment | null>(null);
  const [satisfaction, setSatisfaction] = useState(100);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setIsLoading(true);
        const res = await axios.get("/api/doctors/dashboard");
        
        setAppointmentsCount(res.data.todayAppointments?.length || 0);
        setQueueCount(res.data.patientQueue?.length || 0);
        setRevenue(res.data.revenue || 0);
        setCompletedCount(res.data.completedCount || 0);
        setSatisfaction(res.data.performanceMetrics?.satisfactionRate || 100);

        const activeAppts = res.data.todayAppointments || [];
        const next = activeAppts.find((app: any) => 
          app.status === "confirmed" || app.status === "checked_in"
        );
        setNextAppointment(next || null);

      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col gap-1">
        <Badge className="w-fit mb-2">Doctor Workspace</Badge>
        <h1 className="text-3xl md:text-5xl font-display tracking-tight text-foreground">
          Welcome back, <span className="gradient-text">{user?.name}</span>
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Here is your clinic schedule summary. You have {appointmentsCount} patient slots registered for today.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="animate-pulse bg-card border border-border h-32 rounded-2xl w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="flex flex-col justify-between h-full hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div className="p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg text-accent">
                <Users className="w-6 h-6" />
              </div>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mt-4 uppercase font-bold font-mono tracking-wider">Patients Scheduled Today</p>
              <p className="text-2xl font-bold mt-1 text-foreground">{appointmentsCount}</p>
            </div>
          </Card>

          <Card featured className="h-full flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="p-2 bg-accent text-white rounded-lg">
                <Clock className="w-6 h-6" />
              </div>
              <span className="text-accent text-xs font-bold uppercase font-mono">Next Slot</span>
            </div>
            <div>
              {nextAppointment ? (
                <>
                  <p className="text-accent text-xs mt-4 uppercase font-bold font-mono tracking-wider">{nextAppointment.time}</p>
                  <p className="text-xl font-bold mt-1 text-foreground truncate">{nextAppointment.patientId?.name}</p>
                </>
              ) : (
                <>
                  <p className="text-accent text-xs mt-4 uppercase font-bold font-mono tracking-wider">No Active Sessions</p>
                  <p className="text-lg font-bold mt-1 text-foreground">Rest of day free</p>
                </>
              )}
            </div>
          </Card>

          <Card className="flex flex-col justify-between h-full hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg text-emerald-500">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mt-4 uppercase font-bold font-mono tracking-wider">Consultation Revenue</p>
              <p className="text-2xl font-bold mt-1 text-foreground">${revenue.toFixed(2)}</p>
            </div>
          </Card>

          <Card className="flex flex-col justify-between h-full hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div className="p-2 bg-amber-50 dark:bg-amber-950/20 rounded-lg text-amber-500">
                <Star className="w-6 h-6" />
              </div>
              <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400 font-bold">{satisfaction}% Rating</Badge>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mt-4 uppercase font-bold font-mono tracking-wider">Completed consults</p>
              <p className="text-2xl font-bold mt-1 text-foreground">{completedCount}</p>
            </div>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="p-6 space-y-4">
          <h3 className="font-bold text-foreground">Clinic Quick Tasks</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Ensure you review patient check-ins and complete diagnostic charts to clear payments records instantly.
          </p>
          <div className="pt-2 flex flex-wrap gap-2">
            <Link to="/doctor/schedule">
              <Button size="sm" className="h-10 text-xs">Open Clinic Queue ({queueCount} checked-in)</Button>
            </Link>
            <Link to="/doctor/patients">
              <Button variant="outline" size="sm" className="h-10 text-xs">Review Patient Records</Button>
            </Link>
          </div>
        </Card>

        <Card className="bg-foreground text-white relative overflow-hidden border-none p-8 flex flex-col justify-between">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-accent to-accent-secondary rounded-full opacity-20 blur-3xl" />
          <div>
            <h3 className="text-xl font-bold font-display tracking-tight text-white mb-2">Practice Uptime</h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
              Make sure you set vacation toggles inside your Availability configuration calendar to lock schedules if you are away.
            </p>
          </div>
          <Link to="/doctor/schedule" className="block pt-6">
            <Button variant="secondary" className="w-full bg-white text-foreground hover:bg-slate-100 text-xs">
              Configure Availability Hours
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
