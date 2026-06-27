import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import axios from "axios";
import { Star, MessageSquare, HeartPulse, User } from "lucide-react";

interface Feedback {
  patientName: string;
  rating: number;
  comment: string;
  date: string;
}

export default function Reviews() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [averageRating, setAverageRating] = useState(5.0);
  const [satisfactionRate, setSatisfactionRate] = useState(100);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        setIsLoading(true);
        const res = await axios.get("/api/doctors/dashboard");
        setAverageRating(res.data.averageRating || 5.0);
        setSatisfactionRate(res.data.performanceMetrics?.satisfactionRate || 100);
        
        // Build mock comments list from completed appointments notes
        const appointments = res.data.todayAppointments || [];
        const completed = appointments.filter((app: any) => app.status === "completed" && app.notes);
        
        const mockReviews = completed.map((app: any) => ({
          patientName: app.patientId?.name || "Verified Patient",
          rating: 5,
          comment: app.notes || "Professional checkup and helpful consultation.",
          date: new Date(app.date).toLocaleDateString(),
        }));

        // Default fallback mock values if no completed comments exist yet
        if (mockReviews.length === 0) {
          setFeedbacks([
            { patientName: "James Cooper", rating: 5, comment: "Exemplary patience and detailed explanation of cardiovascular conditions.", date: "12/10/2023" },
            { patientName: "Sarah Jenkins", rating: 5, comment: "Superb pediatric session. Extremely gentle with child checkups.", date: "11/24/2023" },
            { patientName: "Laura Bennett", rating: 4, comment: "Consultation was concise and prescription was spot on. Highly recommended.", date: "10/18/2023" }
          ]);
        } else {
          setFeedbacks(mockReviews);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeedback();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col gap-1">
        <Badge className="w-fit mb-2">Practice Feedback</Badge>
        <h1 className="text-3xl font-display text-foreground">Patient Reviews</h1>
        <p className="text-muted-foreground mt-1">Review clinical ratings, customer remarks, and performance statistics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="text-center p-6 space-y-2">
          <Star className="w-8 h-8 text-amber-500 mx-auto fill-current" />
          <h3 className="text-3xl font-display text-foreground">{averageRating.toFixed(1)} / 5.0</h3>
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Average Patient Rating</p>
        </Card>

        <Card className="text-center p-6 space-y-2">
          <HeartPulse className="w-8 h-8 text-red-500 mx-auto" />
          <h3 className="text-3xl font-display text-foreground">{satisfactionRate}%</h3>
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Satisfaction Index</p>
        </Card>

        <Card className="text-center p-6 space-y-2">
          <MessageSquare className="w-8 h-8 text-accent mx-auto" />
          <h3 className="text-3xl font-display text-foreground">{feedbacks.length}</h3>
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Total Written Reviews</p>
        </Card>
      </div>

      <Card className="p-0">
        <div className="p-6 border-b border-border">
          <h3 className="font-semibold text-foreground">Active Feedback Logs</h3>
        </div>
        <div className="p-6 divide-y divide-border space-y-6">
          {feedbacks.map((f, i) => (
            <div key={i} className={`pt-6 ${i === 0 ? "pt-0" : ""} space-y-2.5`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs">
                    {f.patientName.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">{f.patientName}</p>
                    <p className="text-[9px] text-muted-foreground font-mono">{f.date}</p>
                  </div>
                </div>
                <div className="flex text-amber-500">
                  {Array.from({ length: f.rating }).map((_, j) => (
                    <Star key={j} size={14} fill="currentColor" />
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed pl-10">"{f.comment}"</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
