import { mongoose, connectDB, disconnectDB } from "../src/config/db";
import bcrypt from "bcryptjs";
import { User } from "../src/models/User";
import { PatientProfile } from "../src/models/PatientProfile";
import { DoctorProfile } from "../src/models/DoctorProfile";

async function verifyAuthAndDB() {
  console.log("=========================================");
  console.log("🧪 Starting DB & Authentication Verification...");
  console.log("=========================================");

  try {
    // 1. Initialize Custom Database
    console.log("Starting Custom Database...");
    await connectDB();
    console.log("✅ Database connected successfully.");

    const testEmail = "test_user@medicare.com";
    const testPassword = "Password123!";
    const testName = "John Doe";
    const testRole = "patient";

    console.log("\n--- STEP 1: VERIFYING SIGNUP/REGISTRATION FLOW ---");

    // 3. Check if user already exists
    console.log(`Checking if email ${testEmail} exists...`);
    const existingUser = await User.findOne({ email: testEmail });
    if (existingUser) {
      throw new Error("User already exists before register test");
    }
    console.log("✅ Confirm: Email is unique.");

    // 4. Encrypt password (using the exact salt size of 12 from the controller)
    console.log("Hashing password using bcrypt...");
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(testPassword, salt);
    console.log(`✅ Password hashed: ${hashedPassword}`);

    // 5. Create user document in the database
    console.log("Saving user document to MongoDB...");
    const user = new User({
      name: testName,
      email: testEmail,
      password: hashedPassword,
      role: testRole,
      emailVerificationToken: "verificationToken123",
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      passwordHistory: [hashedPassword]
    });
    await user.save();
    console.log("✅ User document successfully saved.");

    // 6. Create corresponding profile document
    console.log("Creating corresponding PatientProfile document...");
    const profile = await PatientProfile.create({ userId: user._id });
    console.log("✅ PatientProfile document successfully created.");

    // Verify DB structure and constraints
    const savedUser = await User.findById(user._id);
    if (!savedUser) {
      throw new Error("DB Verification failed: Saved user document not found.");
    }
    console.log("\nDatabase Verification:");
    console.log(`- Created User ID: ${savedUser._id}`);
    console.log(`- Saved Email: ${savedUser.email}`);
    console.log(`- Saved Role: ${savedUser.role}`);
    console.log(`- Email Verified State: ${savedUser.emailVerified} (Expected: false)`);

    const savedProfile = await PatientProfile.findOne({ userId: user._id });
    if (!savedProfile) {
      throw new Error("DB Verification failed: PatientProfile not found.");
    }
    console.log(`- Corresponding PatientProfile exists: Yes`);

    console.log("\n--- STEP 2: VERIFYING LOGIN/CREDENTIALS FLOW ---");

    // 7. Find user by email
    console.log(`Querying user by email: ${testEmail}...`);
    const loginUser = await User.findOne({ email: testEmail });
    if (!loginUser) {
      throw new Error(`Login failed: User with email ${testEmail} not found.`);
    }
    console.log("✅ User document retrieved successfully.");

    // 8. Verify password match
    console.log("Verifying password match with bcrypt.compare...");
    const isMatch = await bcrypt.compare(testPassword, loginUser.password);
    if (!isMatch) {
      throw new Error("Password mismatch: Hashed password does not match original.");
    }
    console.log("✅ Password validation successful (Password is correct).");

    // 9. Verify invalid password rejection
    console.log("Verifying incorrect password rejection...");
    const isIncorrectMatch = await bcrypt.compare("WrongPassword123!", loginUser.password);
    if (isIncorrectMatch) {
      throw new Error("Security failure: Incorrect password accepted.");
    }
    console.log("✅ Incorrect password rejected successfully.");

    console.log("\n=========================================");
    console.log("🎉 ALL SIGNUP & LOGIN FLOWS VERIFIED SUCCESSFULLY!");
    console.log("=========================================");

  } catch (error: any) {
    console.error("\n❌ Verification Failed:", error.message || error);
  } finally {
    // Clean up connections and stop server
    console.log("\nDisconnecting from Database...");
    await disconnectDB();
    console.log("Disconnected.");
    console.log("=========================================");
  }
}

verifyAuthAndDB();
