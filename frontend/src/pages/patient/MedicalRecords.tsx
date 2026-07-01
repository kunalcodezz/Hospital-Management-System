import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import axios from "axios";
import toast from "react-hot-toast";
import { Activity, ShieldAlert, FileText, Heart, Eye, Upload, Download, Loader2 } from "lucide-react";

interface Vaccination {
  vaccine: string;
  date: string;
}

interface PatientProfile {
  allergies: string[];
  height: number;
  weight: number;
  bmi: number;
  bloodGroup: string;
  medicalHistory: string[];
  vaccinationHistory: Vaccination[];
  currentMedications: string[];
  chronicDiseases: string[];
}

interface Appointment {
  _id: string;
  doctorId: {
    name: string;
  };
  date: string;
  status: string;
  diagnosis?: string;
  prescription?: string;
}

export default function MedicalRecords() {
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [completedAppointments, setCompletedAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedReports, setUploadedReports] = useState<Array<{ name: string; url: string; date: string }>>([]);

  const fetchMedicalData = async () => {
    try {
      setIsLoading(true);
      // Fetch user profile
      const userRes = await axios.get("/api/users/me");
      setProfile(userRes.data.profile);

      // Fetch appointments
      const appRes = await axios.get("/api/appointments");
      const completed = (appRes.data.appointments || []).filter(
        (app: Appointment) => app.status === "completed" && app.prescription
      );
      setCompletedAppointments(completed);
    } catch (err) {
      toast.error("Could not retrieve medical folders.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicalData();
  }, []);

  const handleReportUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File is too large. Max 5MB allowed.");
      return;
    }

    const formData = new FormData();
    formData.append("photo", file); // Uses photo upload parser

    try {
      setIsUploading(true);
      const res = await axios.post("/api/users/profile/photo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = res.data.profilePhoto;
      
      setUploadedReports((prev) => [
        ...prev,
        {
          name: file.name,
          url,
          date: new Date().toLocaleDateString(),
        },
      ]);
      toast.success("Medical report uploaded securely via Cloudinary backup!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "File upload failed. Allowed formats: PDF, PNG, JPG.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col gap-1">
        <Badge className="w-fit mb-2">Electronic Health Record</Badge>
        <h1 className="text-3xl font-display text-foreground">Medical Folders</h1>
        <p className="text-muted-foreground mt-1">Access allergies profiles, immunization cards, and download clinical PDFs</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="animate-pulse bg-card border border-border h-48 rounded-2xl w-full" />
          <div className="animate-pulse bg-card border border-border h-48 rounded-2xl w-full" />
        </div>
      ) : !profile ? (
        <Card className="text-center py-16 space-y-3">
          <ShieldAlert className="w-12 h-12 text-muted-foreground mx-auto" />
          <h3 className="text-lg font-bold text-foreground">No Medical Profile Found</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Please navigate to Settings to save your metrics (height, weight, blood type) to generate your electronic health card.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Health Metrics Card */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="space-y-6">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                <Heart size={20} className="text-red-500" /> Patient Vitals Summary
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-muted/40 border border-border rounded-xl text-center">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground font-mono">Height</span>
                  <p className="text-xl font-bold mt-1 text-foreground">{profile.height} cm</p>
                </div>
                <div className="p-4 bg-muted/40 border border-border rounded-xl text-center">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground font-mono">Weight</span>
                  <p className="text-xl font-bold mt-1 text-foreground">{profile.weight} kg</p>
                </div>
                <div className="p-4 bg-muted/40 border border-border rounded-xl text-center">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground font-mono">Blood Group</span>
                  <p className="text-xl font-bold mt-1 text-foreground">{profile.bloodGroup || "N/A"}</p>
                </div>
                <div className="p-4 bg-muted/40 border border-border rounded-xl text-center">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground font-mono">Calculated BMI</span>
                  <p className="text-xl font-bold mt-1 text-foreground">{profile.bmi}</p>
                </div>
              </div>

              <div className="border-t border-border pt-4 grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase font-mono tracking-wider mb-2">Allergies</h4>
                  {profile.allergies.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No allergies listed.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {profile.allergies.map((a, i) => <Badge key={i} className="bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400">{a}</Badge>)}
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase font-mono tracking-wider mb-2">Chronic Diseases</h4>
                  {profile.chronicDiseases.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No chronic conditions listed.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {profile.chronicDiseases.map((d, i) => <Badge key={i} className="bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400">{d}</Badge>)}
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-border pt-4 grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase font-mono tracking-wider mb-2">Current Medications</h4>
                  {profile.currentMedications.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No active medications.</p>
                  ) : (
                    <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
                      {profile.currentMedications.map((m, i) => <li key={i}>{m}</li>)}
                    </ul>
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase font-mono tracking-wider mb-2">Immunization Checklist</h4>
                  {profile.vaccinationHistory.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No vaccines logged.</p>
                  ) : (
                    <div className="space-y-1 text-xs text-muted-foreground">
                      {profile.vaccinationHistory.map((v, i) => (
                        <div key={i} className="flex justify-between">
                          <span>{v.vaccine}</span>
                          <span className="font-semibold">{new Date(v.date).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Prescriptions and Reports List */}
            <Card className="p-0">
              <div className="p-6 border-b border-border">
                <h3 className="text-lg font-semibold text-foreground">Clinic Prescriptions & Documents</h3>
              </div>
              <div className="p-6 space-y-4">
                {completedAppointments.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">No prescription records available.</p>
                ) : (
                  completedAppointments.map((app) => (
                    <div key={app._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-border rounded-xl gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-accent/5 text-accent rounded-lg shrink-0">
                          <FileText size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">Diagnosis: {app.diagnosis}</p>
                          <p className="text-xs text-muted-foreground">Issued by {app.doctorId.name} • {new Date(app.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <a href={`/api/appointments/${app._id}/prescription`} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm" className="h-9 text-xs" icon={<Download size={14} />}>
                            Rx PDF
                          </Button>
                        </a>
                        <a href={`/api/appointments/${app._id}/invoice`} target="_blank" rel="noopener noreferrer">
                          <Button variant="secondary" size="sm" className="h-9 text-xs" icon={<Download size={14} />}>
                            Invoice PDF
                          </Button>
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Right Column: Upload Backup & Cloudinary reports */}
          <div className="space-y-6">
            <Card className="text-center p-6 space-y-4">
              <h3 className="font-semibold text-sm text-foreground">Upload Personal Health Files</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Add PDF files, medical laboratory results, or scan reports. Backed up securely using Cloudinary.
              </p>

              <label className="border-dashed border-2 border-border hover:border-accent/40 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors relative">
                {isUploading ? (
                  <Loader2 className="animate-spin text-accent w-8 h-8" />
                ) : (
                  <Upload className="text-muted-foreground w-8 h-8" />
                )}
                <span className="text-xs font-semibold text-foreground mt-3">Select PDF or Image</span>
                <span className="text-[10px] text-muted-foreground mt-1">Maximum file size: 5MB</span>
                <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg" onChange={handleReportUpload} disabled={isUploading} />
              </label>
            </Card>

            {uploadedReports.length > 0 && (
              <Card className="p-0">
                <div className="p-4 border-b border-border">
                  <h4 className="text-xs font-bold text-foreground">My Backup Logs</h4>
                </div>
                <div className="p-4 space-y-3">
                  {uploadedReports.map((report, i) => (
                    <div key={i} className="flex items-center justify-between text-xs p-2.5 bg-muted/40 border border-border rounded-lg">
                      <div className="min-w-0 flex-1 mr-2">
                        <p className="font-bold text-foreground truncate">{report.name}</p>
                        <p className="text-[10px] text-muted-foreground">{report.date}</p>
                      </div>
                      <a href={report.url} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 flex items-center justify-center">
                          <Eye size={12} />
                        </Button>
                      </a>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
