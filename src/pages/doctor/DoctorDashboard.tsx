import React from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Clock, Users, Calendar, Activity } from "lucide-react";

export default function DoctorDashboard() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col gap-1">
        <Badge className="w-fit mb-2">Doctor Portal</Badge>
        <h1 className="text-3xl md:text-5xl font-display tracking-tight">
          Welcome back, <span className="gradient-text">Dr. Carter</span>
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          You have 8 appointments scheduled for today. Your first patient is arriving in 15 minutes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="flex flex-col justify-between h-full">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Users className="w-6 h-6 text-accent" />
            </div>
          </div>
          <div>
            <p className="text-muted-foreground text-xs mt-4 uppercase font-bold font-mono tracking-wider">Patients Today</p>
            <p className="text-2xl font-bold mt-1">8</p>
          </div>
        </Card>
        
        <Card featured className="bg-gradient-to-br from-white to-blue-50 h-full">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-accent rounded-lg text-white">
              <Clock className="w-6 h-6" />
            </div>
            <span className="text-blue-600 text-xs font-bold">Next Appt</span>
          </div>
          <div>
            <p className="text-accent text-xs mt-4 uppercase font-bold font-mono tracking-wider">10:30 AM</p>
            <p className="text-2xl font-bold mt-1">S. Jenkins</p>
          </div>
        </Card>
        
        {/* Fill with empty state placeholders for demo */}
        <Card className="col-span-1 md:col-span-2 flex items-center justify-center p-8 bg-muted/50 border-dashed border-2">
          <p className="text-muted-foreground">More stats loading...</p>
        </Card>
      </div>
      
    </div>
  );
}
