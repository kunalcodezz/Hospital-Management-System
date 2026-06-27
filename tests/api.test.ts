import assert from "assert";
import { registerSchema, loginSchema, createAppointmentSchema } from "../src/backend/validators/zod.validators";

console.log("=========================================");
console.log("🧪 Running Hospital SaaS Test Suites...");
console.log("=========================================");

function runValidationTests() {
  console.log("1. Running Input Zod Schema validations...");

  // Test Valid Register Schema
  const validUser = {
    name: "Dr. Robert Smith",
    email: "robert@medicare.com",
    password: "Password123!", // Min 8, has lower, upper, digit, special character
    role: "doctor",
  };
  
  const parsedReg = registerSchema.safeParse(validUser);
  assert.strictEqual(parsedReg.success, true, "Zod: Should accept valid user registration details");
  console.log("✅ Passed: Valid Register Schema");

  // Test Invalid Register Schema (Weak password policy test)
  const weakPasswordUser = {
    name: "John Doe",
    email: "john@gmail.com",
    password: "123", // too short, no upper/lower/special
    role: "patient",
  };

  const parsedRegWeak = registerSchema.safeParse(weakPasswordUser);
  assert.strictEqual(parsedRegWeak.success, false, "Zod: Should fail registration if password violates policy rules");
  console.log("✅ Passed: Weak Password Policy Rejection");

  // Test Invalid Email Login
  const invalidEmailLogin = {
    email: "not-an-email",
    password: "Password123!",
  };

  const parsedLoginEmail = loginSchema.safeParse(invalidEmailLogin);
  assert.strictEqual(parsedLoginEmail.success, false, "Zod: Should fail login if email format is invalid");
  console.log("✅ Passed: Invalid Email Rejection");

  // Test Valid Appointment Booking
  const validAppt = {
    doctorId: "653bfa5e640b6e1564aa6e12", // 24-character hex ObjectId
    date: "2026-10-24",
    time: "10:30",
    notes: "Follow up checkup after surgery",
  };

  const parsedAppt = createAppointmentSchema.safeParse(validAppt);
  assert.strictEqual(parsedAppt.success, true, "Zod: Should accept valid appointment booking hours and doctor IDs");
  console.log("✅ Passed: Valid Appointment Slot Schema");

  // Test Invalid Appointment Booking (Invalid time hours format)
  const invalidAppt = {
    doctorId: "653bfa5e640b6e1564aa6e12",
    date: "2026-10-24",
    time: "32:90", // invalid hour and minutes
    notes: "Follow up checkup after surgery",
  };

  const parsedApptInvalid = createAppointmentSchema.safeParse(invalidAppt);
  assert.strictEqual(parsedApptInvalid.success, false, "Zod: Should reject appointment if hour slot format is invalid");
  console.log("✅ Passed: Invalid Time Slot Rejection");
}

try {
  runValidationTests();
  console.log("\n=========================================");
  console.log("🎉 All Test Suites Passed Successfully!");
  console.log("=========================================");
  process.exit(0);
} catch (error: any) {
  console.error("\n❌ Test Suite Failed:", error.message);
  process.exit(1);
}
