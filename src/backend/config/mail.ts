import nodemailer from "nodemailer";
import { env } from "./env";

const isMailConfigured = !!(env.SMTP_USER && env.SMTP_PASS);

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465, // true for 465, false for other ports
  auth: isMailConfigured
    ? {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      }
    : undefined,
});

export async function sendEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}) {
  if (!isMailConfigured) {
    console.log("=========================================");
    console.log(`✉️ MOCK EMAIL TO: ${to}`);
    console.log(`SUBJECT: ${subject}`);
    console.log(`BODY: ${text}`);
    console.log("=========================================");
    return;
  }

  try {
    await transporter.sendMail({
      from: env.SMTP_FROM,
      to,
      subject,
      text,
      html,
    });
  } catch (error) {
    console.error("Failed to send email via SMTP:", error);
  }
}
