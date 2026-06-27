import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import axios from "axios";
import toast from "react-hot-toast";
import { Users, Trash2, Search, X, Activity, ShieldAlert, Heart } from "lucide-react";

interface Patient {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  allergies: string[];
  height: number;
  weight: number;
  bmi: number;
  bloodGroup: string;
  insuranceDetails?: {
    provider: string;
    policyNumber: string;
    policyHolder: string;
  };
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  currentMedications: string[];
  chronicDiseases: string[];
}

export default function ManagePatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPatients = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get("/api/users/patients");
      setPatients(res.data.patients || []);
    } catch (err) {
      toast.error("Failed to load patient registries.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleDeletePatient = async (id: string, userId: string) => {
    if (!window.confirm("Are you sure you want to delete this patient profile? This action is irreversible.")) return;

    try {
      await axios.delete(`/api/users/${userId}`);
      toast.success("Patient profile and account deleted.");
      if (selectedPatient?._id === id) {
        setSelectedPatient(null);
      }
      fetchPatients();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Deletion failed.");
    }
  };

  const filteredPatients = patients.filter(p => 
    p.userId?.name.toLowerCase().includes(search.toLowerCase()) ||
    p.userId?.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col gap-1">
        <Badge className="w-fit mb-2">Hospital Registry</Badge>
        <h1 className="text-3xl font-display text-foreground">Manage Patients</h1>
        <p className="text-muted-foreground mt-1">Review active patient accounts, emergency profiles, and insurance details</p>
      </div>

      {/* Search Filter */}
      <div className="flex items-center bg-card border border-border px-4 py-2 rounded-xl max-w-md shadow-sm">
        <Search size={18} className="text-muted-foreground shrink-0" />
        <input
          type="text"
          placeholder="Search by patient name or email..."
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
            Try adjusting search terms.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredPatients.map((patient) => (
            <Card key={patient._id} className="p-4 flex items-center justify-between hover:border-accent/30 transition-all cursor-pointer" onClick={() => setSelectedPatient(patient)}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs">
                  {patient.userId?.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">{patient.userId?.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{patient.userId?.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge className="bg-muted text-foreground">Details</Badge>
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-red-500 hover:bg-red-50" onClick={(e) => {
                  e.stopPropagation();
                  handleDeletePatient(patient._id, patient.userId?._id);
                }}>
                  <Trash2 size={16} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* PATIENT DETAIL OVERLAY */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl border border-border rounded-2xl p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
            <button className="absolute top-4 right-4 text-muted-foreground hover:text-foreground" onClick={() => setSelectedPatient(null)}>
              <X size={20} />
            </button>

            <h3 className="text-xl font-display text-foreground mb-4">Patient File Summary</h3>
            <div className="flex items-center gap-3 pb-6 border-b border-border mb-6">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                {selectedPatient.userId?.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div>
                <h4 className="font-bold text-foreground text-sm">{selectedPatient.userId?.name}</h4>
                <p className="text-xs text-muted-foreground">{selectedPatient.userId?.email}</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Metric parameters */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-muted/40 border border-border rounded-lg text-center">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground font-mono">Height</span>
                  <p className="text-sm font-bold mt-1 text-foreground">{selectedPatient.height} cm</p>
                </div>
                <div className="p-3 bg-muted/40 border border-border rounded-lg text-center">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground font-mono">Weight</span>
                  <p className="text-sm font-bold mt-1 text-foreground">{selectedPatient.weight} kg</p>
                </div>
                <div className="p-3 bg-muted/40 border border-border rounded-lg text-center">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground font-mono">Blood Group</span>
                  <p className="text-sm font-bold mt-1 text-foreground">{selectedPatient.bloodGroup || "N/A"}</p>
                </div>
                <div className="p-3 bg-muted/40 border border-border rounded-lg text-center">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground font-mono">BMI</span>
                  <p className="text-sm font-bold mt-1 text-foreground">{selectedPatient.bmi}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h5 className="text-xs font-bold text-muted-foreground uppercase font-mono tracking-wider mb-2">Insurance Policies</h5>
                  <div className="text-xs space-y-1 text-muted-foreground">
                    <p><span className="font-bold text-foreground">Provider:</span> {selectedPatient.insuranceDetails?.provider || "None"}</p>
                    <p><span className="font-bold text-foreground">Policy No:</span> {selectedPatient.insuranceDetails?.policyNumber || "None"}</p>
                  </div>
                </div>
                <div>
                  <h5 className="text-xs font-bold text-muted-foreground uppercase font-mono tracking-wider mb-2">Emergency Contacts</h5>
                  <div className="text-xs space-y-1 text-muted-foreground">
                    <p><span className="font-bold text-foreground">Name:</span> {selectedPatient.emergencyContact?.name || "None"}</p>
                    <p><span className="font-bold text-foreground">Phone:</span> {selectedPatient.emergencyContact?.phone || "None"}</p>
                    <p><span className="font-bold text-foreground">Relation:</span> {selectedPatient.emergencyContact?.relationship || "None"}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-4 grid md:grid-cols-2 gap-6">
                <div>
                  <h5 className="text-xs font-bold text-muted-foreground uppercase font-mono tracking-wider mb-2">Allergies</h5>
                  {selectedPatient.allergies.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No allergies listed.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {selectedPatient.allergies.map((a, i) => <Badge key={i} className="bg-red-50 text-red-700">{a}</Badge>)}
                    </div>
                  )}
                </div>
                <div>
                  <h5 className="text-xs font-bold text-muted-foreground uppercase font-mono tracking-wider mb-2">Chronic Conditions</h5>
                  {selectedPatient.chronicDiseases.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No conditions listed.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {selectedPatient.chronicDiseases.map((c, i) => <Badge key={i} className="bg-purple-50 text-purple-700">{c}</Badge>)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
