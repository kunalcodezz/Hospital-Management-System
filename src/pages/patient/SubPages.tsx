import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { motion } from "motion/react";
import { Calendar, Clock, MapPin, CheckCircle, Search, User, Filter, CreditCard, Download, Upload, Trash2, ShieldAlert, Award } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { toast } from "react-hot-toast";

const easeOut = [0.16, 1, 0.3, 1] as const;
const fadeInUp = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: easeOut } },
};

// 1. Patient Appointments List & Booking View
export function PatientAppointments() {
  const queryClient = useQueryClient();
  const [selectedDoc, setSelectedDoc] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");

  const { data: doctorsData } = useQuery({
    queryKey: ["doctors"],
    queryFn: async () => {
      const res = await axios.get("/api/doctors");
      return res.data.doctors;
    }
  });

  const { data: appointments, isLoading } = useQuery({
    queryKey: ["appointments"],
    queryFn: async () => {
      const res = await axios.get("/api/appointments");
      return res.data.appointments;
    }
  });

  const bookMutation = useMutation({
    mutationFn: async (newAppt: any) => {
      return axios.post("/api/appointments", newAppt);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Appointment booked successfully!");
      setDate("");
      setTime("");
      setNotes("");
      setSelectedDoc("");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Booking failed");
    }
  });

  const cancelMutation = useMutation({
    mutationFn: async (apptId: string) => {
      return axios.patch(`/api/appointments/${apptId}/status`, { status: "cancelled", note: "Cancelled by patient" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Appointment cancelled");
    }
  });

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoc || !date || !time) {
      toast.error("Please fill in all details");
      return;
    }
    bookMutation.mutate({ doctorId: selectedDoc, date, time, notes });
  };

  return (
    <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
      <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="lg:col-span-2 space-y-6">
        <h2 className="text-2xl font-bold font-display">Your Appointments</h2>
        {isLoading ? (
          <div className="space-y-4">
            <div className="h-24 bg-card rounded-2xl animate-pulse" />
            <div className="h-24 bg-card rounded-2xl animate-pulse" />
          </div>
        ) : !appointments || appointments.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground border-dashed border-2">
            No appointments booked yet. Use the scheduler form to book an appointment.
          </Card>
        ) : (
          appointments.map((appt: any) => (
            <Card key={appt._id} className="relative overflow-hidden hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={appt.status === "confirmed" ? "primary" : appt.status === "completed" ? "secondary" : "ghost"}>
                      {appt.status.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{new Date(appt.date).toDateString()} at {appt.time}</span>
                  </div>
                  <h3 className="font-semibold text-lg">Dr. {appt.doctorId?.name || "Practitioner"}</h3>
                  <p className="text-sm text-muted-foreground">{appt.notes || "No notes provided"}</p>
                  
                  {appt.diagnosis && (
                    <div className="mt-3 p-3 bg-muted rounded-xl text-xs space-y-1 border border-border">
                      <p><strong>Diagnosis:</strong> {appt.diagnosis}</p>
                      <p><strong>Prescription:</strong> {appt.prescription}</p>
                      <a href={`/api/reports/prescription/${appt._id}/pdf`} className="inline-flex items-center gap-1 text-accent font-semibold hover:underline mt-1">
                        <Download size={12} /> Download Prescription PDF
                      </a>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 shrink-0">
                  {appt.status === "pending" && (
                    <Button variant="outline" size="sm" onClick={() => cancelMutation.mutate(appt._id)}>
                      Cancel
                    </Button>
                  )}
                  {appt.status === "completed" && appt.paymentId && (
                    <a href={`/api/reports/invoice/${appt.paymentId}/pdf`}>
                      <Button variant="secondary" size="sm" icon={<Download size={14} />}>
                        Receipt PDF
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="space-y-6">
        <h2 className="text-2xl font-bold font-display">Book Appointment</h2>
        <Card className="p-6">
          <form onSubmit={handleBook} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Select Specialist</label>
              <select 
                value={selectedDoc}
                onChange={(e) => setSelectedDoc(e.target.value)}
                className="w-full h-11 px-3 rounded-lg border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">Choose a doctor...</option>
                {doctorsData?.map((doc: any) => (
                  <option key={doc.userId._id} value={doc.userId._id}>
                    Dr. {doc.userId.name} ({doc.department}) - ${doc.consultationFee}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Preferred Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-11 px-3 rounded-lg border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Preferred Time Slot</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full h-11 px-3 rounded-lg border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Appointment Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Reason for visit, symptoms..."
                className="w-full p-3 rounded-lg border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-accent h-24 text-sm"
              />
            </div>
            <Button type="submit" className="w-full" isLoading={bookMutation.isPending}>
              Schedule Appointment
            </Button>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}

// 2. Patient Medical Records (Allergies, Medications, and PDF uploads)
export function PatientRecords() {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);

  const { data: meData, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await axios.get("/api/users/me");
      return res.data;
    }
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return axios.post("/api/users/photo", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      toast.success("File uploaded successfully");
      setFile(null);
    },
    onError: () => {
      toast.error("Failed to upload file");
    }
  });

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    const fd = new FormData();
    fd.append("photo", file);
    uploadMutation.mutate(fd);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold font-display tracking-tight">Clinical Medical Records</h2>
          <p className="text-muted-foreground mt-1">Review allergies, active medication, and reports.</p>
        </div>
        <a href={`/api/reports/medical-report/${meData?.user?._id}/pdf`}>
          <Button variant="outline" icon={<Download size={16} />}>Download PDF Summary</Button>
        </a>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="space-y-6">
          <h3 className="text-lg font-bold flex items-center gap-2 border-b pb-4"><ShieldAlert size={18} className="text-accent" /> Clinical Flags</h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase">Known Allergies</p>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {meData?.profile?.allergies?.length > 0 ? (
                  meData.profile.allergies.map((a: string, i: number) => <Badge key={i}>{a}</Badge>)
                ) : (
                  <span className="text-sm text-muted-foreground">None Logged</span>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase">Chronic Diseases</p>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {meData?.profile?.chronicDiseases?.length > 0 ? (
                  meData.profile.chronicDiseases.map((c: string, i: number) => <Badge key={i}>{c}</Badge>)
                ) : (
                  <span className="text-sm text-muted-foreground">None Logged</span>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase">Current Medications</p>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {meData?.profile?.currentMedications?.length > 0 ? (
                  meData.profile.currentMedications.map((m: string, i: number) => <Badge key={i}>{m}</Badge>)
                ) : (
                  <span className="text-sm text-muted-foreground">None Logged</span>
                )}
              </div>
            </div>
          </div>
        </Card>

        <Card className="space-y-6">
          <h3 className="text-lg font-bold flex items-center gap-2 border-b pb-4"><Upload size={18} className="text-accent" /> Upload Clinical Document</h3>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="p-8 border-dashed border-2 border-border rounded-xl text-center flex flex-col items-center">
              <Upload size={36} className="text-muted-foreground mb-3" />
              <p className="text-sm font-semibold">Select PDF, PNG, JPG files</p>
              <p className="text-xs text-muted-foreground mt-1">Max file size 5MB</p>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                className="mt-4 text-xs font-mono"
              />
            </div>
            <Button type="submit" className="w-full" disabled={!file} isLoading={uploadMutation.isPending}>
              Upload Document
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

// 3. Find Doctors View
export function PatientDoctors() {
  const [deptFilter, setDeptFilter] = useState("");

  const { data: doctors, isLoading } = useQuery({
    queryKey: ["doctors", deptFilter],
    queryFn: async () => {
      const res = await axios.get(`/api/doctors${deptFilter ? `?department=${deptFilter}` : ""}`);
      return res.data.doctors;
    }
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold font-display tracking-tight">Our Specialists</h2>
          <p className="text-muted-foreground mt-1">Book consultations with our expert medical team.</p>
        </div>
        <div className="flex items-center gap-2 bg-muted p-2 rounded-xl border border-border">
          <Filter size={16} className="text-muted-foreground ml-2" />
          <select 
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="bg-transparent border-none outline-none text-sm font-semibold pr-4"
          >
            <option value="">All Departments</option>
            <option value="Cardiology">Cardiology</option>
            <option value="Neurology">Neurology</option>
            <option value="Pediatrics">Pediatrics</option>
            <option value="General Physician">General Physician</option>
            <option value="Dermatology">Dermatology</option>
            <option value="Orthopedics">Orthopedics</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-3 gap-6">
          <div className="h-48 bg-card rounded-2xl animate-pulse" />
          <div className="h-48 bg-card rounded-2xl animate-pulse" />
          <div className="h-48 bg-card rounded-2xl animate-pulse" />
        </div>
      ) : !doctors || doctors.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          No doctors found matching filters.
        </Card>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {doctors.map((doc: any) => (
            <Card key={doc._id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center font-bold text-accent">
                  {doc.userId?.name.slice(0,2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Dr. {doc.userId?.name}</h3>
                  <Badge variant="primary" className="mt-1">{doc.department}</Badge>
                  <p className="text-xs text-muted-foreground mt-2">Registration: {doc.medicalRegistrationNumber}</p>
                </div>
              </div>
              <div className="pt-6 border-t mt-6 flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">${doc.consultationFee} <span className="text-xs text-muted-foreground font-sans">/ visit</span></span>
                <Badge>{doc.experience} Years Exp</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// 4. Patient Billing & Payments
export function PatientBilling() {
  const queryClient = useQueryClient();
  const { data: payments, isLoading } = useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      const res = await axios.get("/api/payments");
      return res.data.payments;
    }
  });

  const payMutation = useMutation({
    mutationFn: async (payId: string) => {
      return axios.patch(`/api/payments/${payId}/pay`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      toast.success("Payment simulated successfully!");
    }
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold font-display tracking-tight">Billing & Invoices</h2>
        <p className="text-muted-foreground mt-1">Review receipts, tax breakouts, and make payments.</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="h-16 bg-card rounded-2xl animate-pulse" />
          <div className="h-16 bg-card rounded-2xl animate-pulse" />
        </div>
      ) : !payments || payments.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          No billing details found.
        </Card>
      ) : (
        <div className="bg-card border rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted border-b text-xs font-bold text-muted-foreground uppercase">
                <th className="p-4">Invoice #</th>
                <th className="p-4">Date</th>
                <th className="p-4">Method</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((pay: any) => (
                <tr key={pay._id} className="border-b hover:bg-muted/40 transition-colors text-sm">
                  <td className="p-4 font-mono font-medium">{pay.invoiceNumber}</td>
                  <td className="p-4">{new Date(pay.createdAt).toDateString()}</td>
                  <td className="p-4 font-semibold uppercase">{pay.paymentMethod}</td>
                  <td className="p-4 font-bold text-foreground">${pay.amount}</td>
                  <td className="p-4">
                    <Badge variant={pay.paymentStatus === "paid" ? "primary" : pay.paymentStatus === "refunded" ? "secondary" : "ghost"}>
                      {pay.paymentStatus.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    {pay.paymentStatus === "pending" && (
                      <Button size="sm" onClick={() => payMutation.mutate(pay._id)} isLoading={payMutation.isPending}>
                        Pay Now
                      </Button>
                    )}
                    {pay.paymentStatus === "paid" && (
                      <a href={`/api/reports/invoice/${pay._id}/pdf`}>
                        <Button size="sm" variant="outline" icon={<Download size={14} />}>
                          PDF Receipt
                        </Button>
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// 5. Patient Profile Edit Wizard (clinical metrics)
export function PatientProfileEdit() {
  const queryClient = useQueryClient();
  const [allergiesInput, setAllergiesInput] = useState("");
  const [height, setHeight] = useState(0);
  const [weight, setWeight] = useState(0);
  const [bloodGroup, setBloodGroup] = useState("");
  const [provider, setProvider] = useState("");
  const [policyNum, setPolicyNum] = useState("");

  const { data: meData } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await axios.get("/api/users/me");
      const p = res.data.profile || {};
      setHeight(p.height || 0);
      setWeight(p.weight || 0);
      setBloodGroup(p.bloodGroup || "");
      setAllergiesInput(p.allergies?.join(", ") || "");
      setProvider(p.insuranceDetails?.provider || "");
      setPolicyNum(p.insuranceDetails?.policyNumber || "");
      return res.data;
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (updated: any) => {
      return axios.put("/api/users/profile/patient", updated);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      toast.success("Medical details updated successfully!");
    },
    onError: () => {
      toast.error("Failed to update profile");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const allergies = allergiesInput.split(",").map(s => s.trim()).filter(Boolean);
    updateMutation.mutate({
      allergies,
      height: Number(height),
      weight: Number(weight),
      bloodGroup,
      insuranceDetails: {
        provider,
        policyNumber: policyNum,
        policyHolder: meData?.user?.name || "",
      }
    });
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold font-display tracking-tight">Clinical Vitals & Details</h2>
        <p className="text-muted-foreground mt-1">Configure your metrics to calculate health summaries (BMI).</p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Height (cm)</label>
              <input
                type="number"
                value={height || ""}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full h-11 px-3 rounded-lg border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Weight (kg)</label>
              <input
                type="number"
                value={weight || ""}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full h-11 px-3 rounded-lg border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase">Blood Group</label>
            <select
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value)}
              className="w-full h-11 px-3 rounded-lg border border-border bg-transparent focus:outline-none"
            >
              <option value="">Select blood type...</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase">Allergies (comma-separated)</label>
            <input
              type="text"
              value={allergiesInput}
              onChange={(e) => setAllergiesInput(e.target.value)}
              placeholder="e.g. Penicillin, Peanuts"
              className="w-full h-11 px-3 rounded-lg border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="border-t pt-4 space-y-4">
            <h3 className="font-semibold text-foreground text-sm">Insurance Details</h3>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Provider</label>
              <input
                type="text"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full h-11 px-3 rounded-lg border border-border bg-transparent focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Policy Number</label>
              <input
                type="text"
                value={policyNum}
                onChange={(e) => setPolicyNum(e.target.value)}
                className="w-full h-11 px-3 rounded-lg border border-border bg-transparent focus:outline-none"
              />
            </div>
          </div>

          <Button type="submit" className="w-full mt-4" isLoading={updateMutation.isPending}>
            Save Changes
          </Button>
        </form>
      </Card>
    </div>
  );
}
