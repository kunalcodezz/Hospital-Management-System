import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import axios from "axios";
import toast from "react-hot-toast";
import { Users, Search, User, ShieldAlert, Heart, FileText, X } from "lucide-react";

interface Patient {
  _id: string;
  patientId: {
    _id: string;
    name: string;
    email: string;
    profilePhoto?: string;
  };
  details?: {
    allergies: string[];
    height: number;
    weight: number;
    bmi: number;
    bloodGroup: string;
    medicalHistory: string[];
    currentMedications: string[];
    chronicDiseases: string[];
    vaccinationHistory: Array<{ vaccine: string; date: string }>;
  };
}

export default function Patients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPatients = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get("/api/appointments");
      const appointments = res.data.appointments || [];
      
      // Deduplicate appointments by patientId to get list of unique patients
      const patientMap = new Map<string, Patient>();
      for (const app of appointments) {
        if (app.patientId && app.patientId._id) {
          const pId = app.patientId._id;
          if (!patientMap.has(pId)) {
            patientMap.set(pId, {
              _id: app._id,
              patientId: app.patientId,
            });
          }
        }
      }

      const uniquePatients = Array.from(patientMap.values());
      setPatients(uniquePatients);
    } catch (err) {
      toast.error("Failed to load patient records.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleDrillDown = async (patient: Patient) => {
    try {
      // Find patient profile details
      const res = await axios.get(`/api/users/patients`); // Admin gets all patient profiles, or doctor gets relevant profiles
      const profiles = res.data.patients || [];
      const profile = profiles.find((p: any) => p.userId && p.userId._id === patient.patientId._id);
      
      if (profile) {
        setSelectedPatient({
          ...patient,
          details: {
            allergies: profile.allergies || [],
            height: profile.height || 0,
            weight: profile.weight || 0,
            bmi: profile.bmi || 0,
            bloodGroup: profile.bloodGroup || "",
            medicalHistory: profile.medicalHistory || [],
            currentMedications: profile.currentMedications || [],
            chronicDiseases: profile.chronicDiseases || [],
            vaccinationHistory: profile.vaccinationHistory || [],
          }
        });
      } else {
        setSelectedPatient({
          ...patient,
          details: {
            allergies: [],
            height: 0,
            weight: 0,
            bmi: 0,
            bloodGroup: "",
            medicalHistory: [],
            currentMedications: [],
            chronicDiseases: [],
            vaccinationHistory: [],
          }
        });
        toast.warn("Patient health card metrics not configured by patient yet.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Could not fetch patient medical summary details.");
    }
  };

  const filteredPatients = patients.filter(p => 
    p.patientId?.name.toLowerCase().includes(search.toLowerCase()) ||
    p.patientId?.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col gap-1">
        <Badge className="w-fit mb-2">Patient Files</Badge>
        <h1 className="text-3xl font-display text-foreground">Patient Registry</h1>
        <p className="text-muted-foreground mt-1">Review vital parameters, history folders, and allergies profiles</p>
      </div>

      <div className="flex items-center bg-card border border-border px-4 py-2 rounded-xl max-w-md shadow-sm">
        <Search size={18} className="text-muted-foreground shrink-0" />
        <input
          type="text"
          placeholder="Filter patients by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent border-none outline-none text-sm ml-3 w-full text-foreground"
        />
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map(n => (
            <div key={n} className="animate-pulse bg-card border border-border h-20 rounded-2xl w-full" />
          ))}
        </div>
      ) : filteredPatients.length === 0 ? (
        <Card className="text-center py-16 space-y-3">
          <Users className="w-12 h-12 text-muted-foreground mx-auto" />
          <h3 className="text-lg font-bold text-foreground">No Patients Registered</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            No patients match your current filter query.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPatients.map((patient) => (
            <Card key={patient.patientId?._id} className="p-4 flex items-center justify-between hover:border-accent/30 transition-all cursor-pointer" onClick={() => handleDrillDown(patient)}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full border border-border bg-slate-100 flex items-center justify-center shrink-0">
                  {patient.patientId?.profilePhoto ? (
                    <img src={patient.patientId.profilePhoto} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <User className="text-slate-500 w-6 h-6" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">{patient.patientId?.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{patient.patientId?.email}</p>
                </div>
              </div>
              <Badge className="bg-muted text-foreground">View File</Badge>
            </Card>
          ))}
        </div>
      )}

      {/* DETAIL MODAL DRILL DOWN */}
      {selectedPatient && selectedPatient.details && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl border border-border rounded-2xl p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
            <button className="absolute top-4 right-4 text-muted-foreground hover:text-foreground" onClick={() => setSelectedPatient(null)}>
              <X size={20} />
            </button>

            <h3 className="text-xl font-display text-foreground mb-4">Patient Medical History Card</h3>
            <div className="flex items-center gap-3 pb-6 border-b border-border mb-6">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                {selectedPatient.patientId?.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div>
                <h4 className="font-bold text-foreground text-sm">{selectedPatient.patientId?.name}</h4>
                <p className="text-xs text-muted-foreground">{selectedPatient.patientId?.email}</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Health parameters grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-muted/40 border border-border rounded-lg text-center">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground font-mono">Height</span>
                  <p className="text-sm font-bold mt-1 text-foreground">{selectedPatient.details.height} cm</p>
                </div>
                <div className="p-3 bg-muted/40 border border-border rounded-lg text-center">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground font-mono">Weight</span>
                  <p className="text-sm font-bold mt-1 text-foreground">{selectedPatient.details.weight} kg</p>
                </div>
                <div className="p-3 bg-muted/40 border border-border rounded-lg text-center">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground font-mono">Blood Group</span>
                  <p className="text-sm font-bold mt-1 text-foreground">{selectedPatient.details.bloodGroup || "N/A"}</p>
                </div>
                <div className="p-3 bg-muted/40 border border-border rounded-lg text-center">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground font-mono">BMI Score</span>
                  <p className="text-sm font-bold mt-1 text-foreground">{selectedPatient.details.bmi}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h5 className="text-xs font-bold text-muted-foreground uppercase font-mono tracking-wider mb-2">Allergies</h5>
                    {selectedPatient.details.allergies.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No allergies configured.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {selectedPatient.details.allergies.map((a, i) => <Badge key={i} className="bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400">{a}</Badge>)}
                      </div>
                    )}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-muted-foreground uppercase font-mono tracking-wider mb-2">Chronic Conditions</h5>
                    {selectedPatient.details.chronicDiseases.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No chronic conditions configured.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {selectedPatient.details.chronicDiseases.map((c, i) => <Badge key={i} className="bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400">{c}</Badge>)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h5 className="text-xs font-bold text-muted-foreground uppercase font-mono tracking-wider mb-2">Active Medications</h5>
                    {selectedPatient.details.currentMedications.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No medications configured.</p>
                    ) : (
                      <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
                        {selectedPatient.details.currentMedications.map((m, i) => <li key={i}>{m}</li>)}
                      </ul>
                    )}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-muted-foreground uppercase font-mono tracking-wider mb-2">Vaccinations</h5>
                    {selectedPatient.details.vaccinationHistory.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No immunizations recorded.</p>
                    ) : (
                      <div className="space-y-1 text-xs text-muted-foreground">
                        {selectedPatient.details.vaccinationHistory.map((v, i) => (
                          <div key={i} className="flex justify-between">
                            <span>{v.vaccine}</span>
                            <span className="font-semibold">{new Date(v.date).toLocaleDateString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {selectedPatient.details.medicalHistory.length > 0 && (
                <div className="border-t border-border pt-4">
                  <h5 className="text-xs font-bold text-muted-foreground uppercase font-mono tracking-wider mb-2">Other Clinical History</h5>
                  <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
                    {selectedPatient.details.medicalHistory.map((h, i) => <li key={i}>{h}</li>)}
                  </ul>
                </div>
              )}

            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
