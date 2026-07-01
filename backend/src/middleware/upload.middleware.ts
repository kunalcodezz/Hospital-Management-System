import multer from "multer";
import path from "path";
import fs from "fs";
import { Request } from "express";
import { ApiError } from "./error.middleware";
import { v2 as cloudinary } from "cloudinary";
import { isConfigured as isCloudinaryConfigured } from "../config/cloudinary";

// Ensure local uploads directory exists
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration (Local temporary storage)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

// File filter validation
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedExtensions = [".png", ".jpg", ".jpeg", ".pdf"];
  const allowedMimeTypes = ["image/png", "image/jpeg", "image/jpg", "application/pdf"];

  const fileExtension = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype.toLowerCase();

  if (!allowedExtensions.includes(fileExtension) || !allowedMimeTypes.includes(mimeType)) {
    return cb(new ApiError(400, "Invalid file type. Only PDF, PNG, JPEG, and JPG are allowed."));
  }

  cb(null, true);
};

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter,
});

/**
 * Helper to upload a local file to Cloudinary and clean up the local file afterwards.
 * Falls back to local URL if Cloudinary is not configured.
 */
export async function uploadToCloudinary(localFilePath: string, folderName: string): Promise<string> {
  if (!isCloudinaryConfigured) {
    // Return relative URL for local fallback
    const fileName = path.basename(localFilePath);
    return `/uploads/${fileName}`;
  }

  try {
    const result = await cloudinary.uploader.upload(localFilePath, {
      folder: `medicare/${folderName}`,
      resource_type: "auto",
    });
    
    // Clean up local temp file asynchronously
    fs.unlink(localFilePath, (err) => {
      if (err) console.error("Error deleting local temp file:", err);
    });

    return result.secure_url;
  } catch (error) {
    console.error("Cloudinary upload failed, falling back to local file:", error);
    const fileName = path.basename(localFilePath);
    return `/uploads/${fileName}`;
  }
}
