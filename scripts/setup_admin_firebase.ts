import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { connectDB, disconnectDB } from "../src/backend/config/db";
import { User } from "../src/backend/models/User";

// Load environment variables
dotenv.config();

async function setupAdminAccounts() {
  console.log("=========================================");
  console.log("🚀 Setting up Admin Accounts in Firebase...");
  console.log("=========================================");

  try {
    // 1. Connect to Database (using Firestore or mock depending on config)
    await connectDB();
    
    // Check if we are connected to the actual Firebase
    const isMock = process.env.FIREBASE_SERVICE_ACCOUNT_JSON ? false : true;
    if (isMock) {
      console.warn("⚠️ Warning: FIREBASE_SERVICE_ACCOUNT_JSON is not defined in the environment.");
      console.warn("⚠️ Running in mock in-memory mode. Script will not persist to Firebase!");
      console.warn("⚠️ Please check your .env file credentials.");
      await disconnectDB();
      process.exit(1);
    }

    console.log("✅ Successfully connected to Firebase Firestore.");

    // 2. Define Admin accounts to create
    const salt = await bcrypt.genSalt(12);
    const adminPasswordHash = await bcrypt.hash("Pass@123", salt);
    const superadminPasswordHash = await bcrypt.hash("Password123!", salt);

    const adminAccounts = [
      {
        email: "admin01@gmail.com",
        name: "ADMIN",
        password: adminPasswordHash,
        role: "admin",
        emailVerified: true,
      },
      {
        email: "superadmin@medicare.com",
        name: "MediCare Lead Architect",
        password: superadminPasswordHash,
        role: "superadmin",
        emailVerified: true,
      }
    ];

    // 3. Insert or update accounts in Firestore
    for (const acc of adminAccounts) {
      console.log(`Checking account: ${acc.email}...`);
      const existingUser = await User.findOne({ email: acc.email });

      if (existingUser) {
        console.log(`- Account already exists. Updating role to '${acc.role}' and resetting password...`);
        existingUser.role = acc.role;
        existingUser.password = acc.password;
        existingUser.emailVerified = acc.emailVerified;
        existingUser.name = acc.name;
        // Reset security attributes
        existingUser.failedLoginAttempts = 0;
        existingUser.lockUntil = undefined;
        existingUser.passwordChangedAt = new Date();
        existingUser.passwordHistory = [acc.password];
        await existingUser.save();
        console.log(`✅ Updated account: ${acc.email}`);
      } else {
        console.log(`- Account does not exist. Creating new '${acc.role}' account...`);
        const newUser = new User({
          name: acc.name,
          email: acc.email,
          password: acc.password,
          role: acc.role,
          emailVerified: acc.emailVerified,
          failedLoginAttempts: 0,
          passwordHistory: [acc.password]
        });
        await newUser.save();
        console.log(`✅ Created account: ${acc.email}`);
      }
    }

    // 4. Clean up test users if they exist
    const testEmail = "test_user@medicare.com";
    console.log(`Checking for test user cleanup (${testEmail})...`);
    const testUser = await User.findOne({ email: testEmail });
    if (testUser) {
      console.log(`- Found test user. Deleting to keep DB clean...`);
      await testUser.delete();
      console.log(`✅ Test user deleted successfully.`);
    }

    console.log("=========================================");
    console.log("🎉 Admin accounts setup completed successfully!");
    console.log("=========================================");
    console.log("Default credentials:");
    console.log("1. Admin Account:");
    console.log("   - Email:    admin01@gmail.com");
    console.log("   - Password: Pass@123");
    console.log("   - Role:     admin");
    console.log("2. Super Admin Account:");
    console.log("   - Email:    superadmin@medicare.com");
    console.log("   - Password: Password123!");
    console.log("   - Role:     superadmin");
    console.log("=========================================");

  } catch (error: any) {
    console.error("❌ Failed to setup admin accounts:", error.message || error);
  } finally {
    console.log("Disconnecting from Database...");
    await disconnectDB();
    console.log("Disconnected.");
  }
}

setupAdminAccounts();
