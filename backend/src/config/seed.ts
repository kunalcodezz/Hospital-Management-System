import { mongoose, connectDB } from "./db";
import bcrypt from "bcryptjs";
import { User } from "../models/User";
import { PatientProfile } from "../models/PatientProfile";
import { DoctorProfile } from "../models/DoctorProfile";
import { Appointment } from "../models/Appointment";
import { Payment } from "../models/Payment";
import { ActivityLog } from "../models/ActivityLog";
import dotenv from "dotenv";

dotenv.config();

async function seed() {
  try {
    console.log("Connecting to Database...");
    await connectDB();
    console.log("Clearing existing collections...");
    
    await User.deleteMany({});
    await PatientProfile.deleteMany({});
    await DoctorProfile.deleteMany({});
    await Appointment.deleteMany({});
    await Payment.deleteMany({});
    await ActivityLog.deleteMany({});

    console.log("Generating secure passwords...");
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash("Password123!", salt);
    const adminPasswordHash = await bcrypt.hash("Pass@123", salt);

    console.log("Seeding Admin accounts...");
    const admin = new User({
      name: "ADMIN",
      email: "Admin01@gmail.com",
      password: adminPasswordHash,
      role: "admin",
      emailVerified: true
    });
    await admin.save();

    const superadmin = new User({
      name: "MediCare Lead Architect",
      email: "superadmin@medicare.com",
      password: passwordHash,
      role: "superadmin",
      emailVerified: true
    });
    await superadmin.save();

    console.log("Seeding Doctor accounts & practice settings...");
    const doc1 = new User({
      name: "Dr. Sarah Chen",
      email: "sarah.chen@medicare.com",
      password: passwordHash,
      role: "doctor",
      emailVerified: true
    });
    await doc1.save();

    const doc1Profile = new DoctorProfile({
      userId: doc1._id,
      qualification: "M.D. Cardiology, Harvard Medical",
      experience: 12,
      medicalRegistrationNumber: "MC-CARD-12345",
      department: "Cardiology",
      languagesSpoken: ["English", "Mandarin"],
      consultationFee: 150,
      availabilityCalendar: [
        { dayOfWeek: "Monday", startTime: "09:00", endTime: "13:00" },
        { dayOfWeek: "Wednesday", startTime: "14:00", endTime: "18:00" }
      ]
    });
    await doc1Profile.save();

    const doc2 = new User({
      name: "Dr. Emily Blunt",
      email: "emily.blunt@medicare.com",
      password: passwordHash,
      role: "doctor",
      emailVerified: true
    });
    await doc2.save();

    const doc2Profile = new DoctorProfile({
      userId: doc2._id,
      qualification: "M.D. Pediatrics, Johns Hopkins",
      experience: 8,
      medicalRegistrationNumber: "MC-PED-67890",
      department: "Pediatrics",
      languagesSpoken: ["English", "Spanish"],
      consultationFee: 80,
      availabilityCalendar: [
        { dayOfWeek: "Tuesday", startTime: "10:00", endTime: "16:00" },
        { dayOfWeek: "Friday", startTime: "09:00", endTime: "15:00" }
      ]
    });
    await doc2Profile.save();

    console.log("Seeding Patient accounts & health cards...");
    const pat1 = new User({
      name: "James Wilson",
      email: "james.wilson@gmail.com",
      password: passwordHash,
      role: "patient",
      emailVerified: true
    });
    await pat1.save();

    const pat1Profile = new PatientProfile({
      userId: pat1._id,
      allergies: ["Peanuts", "Aspirin"],
      height: 180,
      weight: 78,
      bmi: 24.1,
      bloodGroup: "O+",
      insuranceDetails: {
        provider: "Blue Cross Shield",
        policyNumber: "POL-BC-7890",
        policyHolder: "James Wilson"
      },
      emergencyContact: {
        name: "Jane Wilson",
        phone: "+1-555-0199",
        relationship: "Spouse"
      },
      currentMedications: ["Lisinopril 10mg"],
      chronicDiseases: ["Hypertension"]
    });
    await pat1Profile.save();

    const pat2 = new User({
      name: "Maria Anderson",
      email: "maria.anderson@yahoo.com",
      password: passwordHash,
      role: "patient",
      emailVerified: true
    });
    await pat2.save();

    const pat2Profile = new PatientProfile({
      userId: pat2._id,
      allergies: ["Penicillin"],
      height: 165,
      weight: 60,
      bmi: 22.0,
      bloodGroup: "A-",
      insuranceDetails: {
        provider: "UnitedHealth Group",
        policyNumber: "POL-UH-1234",
        policyHolder: "Maria Anderson"
      },
      emergencyContact: {
        name: "John Anderson",
        phone: "+1-555-0122",
        relationship: "Father"
      },
      currentMedications: [],
      chronicDiseases: []
    });
    await pat2Profile.save();

    console.log("Seeding Appointment consultations and invoice logs...");
    
    // Appointment 1: Completed
    const app1 = new Appointment({
      patientId: pat1._id,
      doctorId: doc1._id,
      date: new Date(),
      time: "10:30",
      status: "completed",
      notes: "Routine checkup, feeling slight chest stiffness.",
      diagnosis: "Mild cardiac fatigue, advice rest and reduce sodium intake.",
      prescription: "Coenzyme Q10 - once daily after meal (30 days)",
      history: [
        { status: "pending", note: "Submitted via patient app", timestamp: new Date(Date.now() - 3600000) },
        { status: "confirmed", note: "Schedules confirmed by doctor", timestamp: new Date(Date.now() - 3000000) },
        { status: "checked_in", note: "Patient checked in", timestamp: new Date(Date.now() - 2000000) },
        { status: "completed", note: "Prescription complete", timestamp: new Date() }
      ]
    });
    
    const pay1 = new Payment({
      invoiceNumber: "INV-SEED-01",
      transactionId: "TXN-SEED-01",
      paymentMethod: "credit_card",
      amount: 165.00, // Fee + 10% tax
      tax: 15.00,
      discount: 0,
      paymentStatus: "paid",
      patientId: pat1._id,
      appointmentId: app1._id
    });
    await pay1.save();
    app1.paymentId = pay1._id;
    await app1.save();

    // Update doctor 1 profile completed stats
    doc1Profile.completedAppointments = 1;
    doc1Profile.revenue = 165.00;
    await doc1Profile.save();

    // Appointment 2: Confirmed/Upcoming
    const app2 = new Appointment({
      patientId: pat2._id,
      doctorId: doc2._id,
      date: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
      time: "14:15",
      status: "confirmed",
      notes: "Slight throat pain.",
      history: [
        { status: "pending", note: "Submitted via patient app", timestamp: new Date() },
        { status: "confirmed", note: "Confirmed by doctor", timestamp: new Date() }
      ]
    });

    const pay2 = new Payment({
      invoiceNumber: "INV-SEED-02",
      transactionId: "TXN-SEED-02",
      paymentMethod: "paypal",
      amount: 88.00,
      tax: 8.00,
      paymentStatus: "paid",
      patientId: pat2._id,
      appointmentId: app2._id
    });
    await pay2.save();
    app2.paymentId = pay2._id;
    await app2.save();

    // Log Activity seed
    await ActivityLog.create({
      userId: superadmin._id,
      ipAddress: "127.0.0.1",
      action: "admin_action",
      status: "success",
      details: "Database initialization seed script executed successfully"
    });

    console.log("=========================================");
    console.log("🎉 Database Seed Completed Successfully!");
    console.log("Common logins password: Password123!");
    console.log("- Super Admin: superadmin@medicare.com");
    console.log("- Doctor 1: sarah.chen@medicare.com (Cardiology)");
    console.log("- Patient 1: james.wilson@gmail.com");
    console.log("=========================================");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seed();
