import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import axios from "axios";
import toast from "react-hot-toast";
import { Search, User, Star, Award, GraduationCap, DollarSign, Calendar } from "lucide-react";
import { Link } from "react-router-dom";

interface Doctor {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    profilePhoto?: string;
  };
  qualification: string;
  experience: number;
  medicalRegistrationNumber: string;
  department: string;
  languagesSpoken: string[];
  consultationFee: number;
  vacationMode: boolean;
  averageRating: number;
}

export default function FindDoctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchDoctors = async () => {
    try {
      setIsLoading(true);
      const params: any = {};
      if (department) params.department = department;
      if (search) params.search = search;

      const res = await axios.get("/api/doctors", { params });
      setDoctors(res.data.doctors || []);
    } catch (err) {
      toast.error("Failed to load doctor database.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search query
    const delayDebounceFn = setTimeout(() => {
      fetchDoctors();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search, department]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col gap-1">
        <Badge className="w-fit mb-2">Physician Search</Badge>
        <h1 className="text-3xl font-display text-foreground">Find Medical Specialists</h1>
        <p className="text-muted-foreground mt-1">Browse qualified healthcare professionals by department or clinic location</p>
      </div>

      {/* Filter Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-card p-4 border border-border rounded-2xl shadow-sm">
        <div className="flex items-center bg-muted/50 border border-border px-4 py-2 rounded-xl">
          <Search size={18} className="text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Search by doctor's name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-sm ml-3 w-full text-foreground"
          />
        </div>

        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="h-12 px-4 rounded-xl border border-border bg-transparent text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent cursor-pointer"
        >
          <option value="">All Departments</option>
          {["Cardiology", "Neurology", "Pediatrics", "General Physician", "Dermatology", "Orthopedics", "Oncology", "Psychiatry"].map((dept) => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>
      </div>

      {/* Doctor Listings Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="animate-pulse bg-card border border-border rounded-2xl h-64 p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-muted rounded-full" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-muted rounded w-2/3" />
                  <div className="h-3 bg-muted rounded w-1/3" />
                </div>
              </div>
              <div className="h-3 bg-muted rounded w-full" />
              <div className="h-3 bg-muted rounded w-5/6" />
              <div className="h-10 bg-muted rounded-xl w-full mt-4" />
            </div>
          ))}
        </div>
      ) : doctors.length === 0 ? (
        <Card className="text-center py-16 space-y-3">
          <User className="w-12 h-12 text-muted-foreground mx-auto" />
          <h3 className="text-lg font-bold text-foreground">No Physicians Found</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Try adjusting your search filters or checking for name spelling errors.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {doctors.map((doc) => (
            <Card key={doc._id} className="flex flex-col justify-between group hover:shadow-md transition-shadow">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-full border border-border bg-muted overflow-hidden shrink-0">
                    {doc.userId?.profilePhoto ? (
                      <img src={doc.userId.profilePhoto} alt="Doctor" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-muted-foreground bg-slate-100">
                        Dr
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-foreground text-base truncate group-hover:text-accent transition-colors">
                      {doc.userId?.name}
                    </h3>
                    <p className="text-xs text-accent font-semibold uppercase tracking-wider mt-0.5">{doc.department}</p>
                    <div className="flex items-center gap-1 text-amber-500 text-xs font-bold mt-1.5">
                      <Star size={14} fill="currentColor" />
                      <span>{doc.averageRating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border pt-4 space-y-2 text-xs text-muted-foreground font-medium">
                  <div className="flex items-center gap-2">
                    <GraduationCap size={14} />
                    <span className="truncate">{doc.qualification}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award size={14} />
                    <span>{doc.experience} Years of Practice</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground font-bold">
                    <DollarSign size={14} />
                    <span>Consultation fee: ${doc.consultationFee}</span>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                {doc.vacationMode ? (
                  <Badge variant="outline" className="w-full justify-center text-red-500 border-red-200 py-2.5">
                    Unavailable (Vacation Mode)
                  </Badge>
                ) : (
                  <Link to="/patient/appointments" state={{ doctorId: doc.userId?._id, fee: doc.consultationFee }}>
                    <Button variant="outline" size="sm" className="w-full" icon={<Calendar size={14} />}>
                      Book Appointment
                    </Button>
                  </Link>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
