import React from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { TrendingUp, Users, Clock, Activity } from "lucide-react";

export default function AdminDashboard() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col gap-1">
        <Badge className="w-fit mb-2">Operations Dashboard</Badge>
        <h1 className="text-3xl md:text-5xl font-display tracking-tight">
          Welcome back, <span className="gradient-text">MediCare Lead</span>
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Your hospital network is performing at 98% efficiency today. There are 12 urgent cases requiring supervisor review.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="flex flex-col justify-between h-full">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-blue-50 rounded-lg">
              <TrendingUp className="w-6 h-6 text-accent" />
            </div>
            <span className="text-emerald-500 text-xs font-bold">+12.5%</span>
          </div>
          <div>
            <p className="text-muted-foreground text-xs mt-4 uppercase font-bold font-mono tracking-wider">Revenue Today</p>
            <p className="text-2xl font-bold mt-1">$12,480.00</p>
          </div>
        </Card>

        <Card className="flex flex-col justify-between h-full">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <Users className="w-6 h-6 text-emerald-500" />
            </div>
            <span className="text-emerald-500 text-xs font-bold">+4 new</span>
          </div>
          <div>
            <p className="text-muted-foreground text-xs mt-4 uppercase font-bold font-mono tracking-wider">New Patients</p>
            <p className="text-2xl font-bold mt-1">1,420</p>
          </div>
        </Card>

        <Card className="flex flex-col justify-between h-full">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-orange-50 rounded-lg">
              <Clock className="w-6 h-6 text-orange-500" />
            </div>
            <span className="text-orange-500 text-xs font-bold">Critical</span>
          </div>
          <div>
            <p className="text-muted-foreground text-xs mt-4 uppercase font-bold font-mono tracking-wider">Wait Time</p>
            <p className="text-2xl font-bold mt-1">14 min</p>
          </div>
        </Card>

        <Card featured className="bg-gradient-to-br from-white to-blue-50 h-full">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-accent rounded-lg text-white">
              <Activity className="w-6 h-6" />
            </div>
            <span className="text-blue-600 text-xs font-bold">Live</span>
          </div>
          <div>
            <p className="text-accent text-xs mt-4 uppercase font-bold font-mono tracking-wider">Active Appts</p>
            <p className="text-2xl font-bold mt-1">42</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="col-span-1 lg:col-span-2 p-0 flex flex-col">
          <div className="p-6 border-b border-border flex justify-between items-center bg-card">
            <h3 className="font-bold text-lg">Recent Patient Activities</h3>
            <button className="text-accent text-sm font-semibold">View All</button>
          </div>
          <div className="flex-1 p-6 space-y-4">
            {[
              { name: "James Wilson", dept: "Cardiology", dr: "Dr. Sarah Chen", time: "10:45 AM", status: "Confirmed", sc: "bg-emerald-100 text-emerald-700" },
              { name: "Maria Anderson", dept: "Neurology", dr: "Dr. Robert Fox", time: "11:15 AM", status: "In Progress", sc: "bg-blue-100 text-blue-700" },
              { name: "Thomas Knight", dept: "Pediatrics", dr: "Dr. Emily Blunt", time: "01:00 PM", status: "Scheduled", sc: "bg-amber-100 text-amber-700" }
            ].map((activity, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-border rounded-2xl hover:bg-muted transition-colors cursor-pointer gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 shrink-0">
                    {activity.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{activity.name}</p>
                    <p className="text-xs text-muted-foreground">{activity.dept} • {activity.dr}</p>
                  </div>
                </div>
                <div className="text-left sm:text-right flex sm:block items-center justify-between">
                  <p className="text-xs font-bold sm:mb-1">{activity.time}</p>
                  <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${activity.sc}`}>{activity.status}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="bg-foreground text-white relative overflow-hidden border-none p-8">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-accent to-accent-secondary rounded-full opacity-20 blur-3xl"></div>
          
          <h3 className="text-xl font-bold mb-6 font-display tracking-tight relative z-10">Department Efficiency</h3>
          
          <div className="space-y-6 relative z-10">
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span>Cardiology</span>
                <span>89%</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full">
                <div className="bg-accent h-full rounded-full" style={{ width: "89%" }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span>Neurology</span>
                <span>74%</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full">
                <div className="bg-accent-secondary h-full rounded-full" style={{ width: "74%" }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span>General Physician</span>
                <span>96%</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: "96%" }}></div>
              </div>
            </div>
            
            <div className="mt-8 pt-8 border-t border-slate-800 text-center">
              <p className="text-slate-400 text-xs mb-4">Weekly targets met for 8/10 departments.</p>
              <button className="w-full bg-white text-foreground py-3 rounded-xl font-bold hover:bg-slate-100 transition-all text-sm">
                Download Report
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
