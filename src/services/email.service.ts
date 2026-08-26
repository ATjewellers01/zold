import { Resend } from "resend";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import prisma from "../config/db.js";

dotenv.config();

export const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy");

const createSmtpTransporter = () => {
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return null;
};

interface AdminDetails {
  name: string;
  email: string;
  username: string;
}

export const sendEmail = async (
  to: string,
  subject: string,
  html: string,
): Promise<boolean> => {
  // Option A: Send via Nodemailer SMTP (Gmail, SendGrid, Mailtrap, etc.) if configured
  const smtpTransporter = createSmtpTransporter();
  if (smtpTransporter) {
    try {
      const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER;
      await smtpTransporter.sendMail({
        from: `Zold Gold <${fromAddress}>`,
        to: to,
        subject: subject,
        html: html,
      });
      console.log(`✅ [Nodemailer SMTP] Email sent successfully to ${to}`);
      return true;
    } catch (error) {
      console.error(`❌ [Nodemailer SMTP Error] Could not send email to ${to}:`, error);
    }
  }

  // Option B: Send via Resend API
  if (process.env.RESEND_API_KEY) {
    try {
      const fromAddress = process.env.EMAIL_FROM || "zold@support.zold.in";//OTP1
      const { data, error } = await resend.emails.send({
        from: fromAddress,
        to: to,
        subject: subject,
        html: html,
      });

      if (error) {
        console.error(`❌ [Resend Error] Failed to send email to ${to}:`, error);
        if ((error as any).statusCode === 401 || error.message?.includes("invalid")) {
          console.error(`⚠️ [API KEY ERROR] Your RESEND_API_KEY in .env is INVALID or EXPIRED.`);
          console.error(`👉 Solution: Replace RESEND_API_KEY in backend/zold/.env with a valid key, or add SMTP_USER & SMTP_PASS for Gmail SMTP.`);
        }
        return false;
      }
      
      console.log(`✅ [Resend Success] Email sent to ${to} (ID: ${data?.id})`);
      return true;
    } 
    catch (error) {
      console.error(`❌ [Resend Exception] Error sending email to ${to}:`, error);
      return false;
    }
  }

  console.warn(`⚠️ [Email Warning] No working email configuration found. Please set a valid RESEND_API_KEY or SMTP_USER/SMTP_PASS in .env`);
  return false;
};

export const sendOTP = async (
  userId: string | null | undefined,
  userEmail: string,
  otp: string,
): Promise<boolean> => {
  const subject = "Your Verification OTP";
  const html = `
    <h2>Verify Your Email</h2>
    <p>Your One-Time Password (OTP) for registration is:</p>
    <h1 style="color: #3D3066; letter-spacing: 5px;">${otp}</h1>
    <p>This code will expire in 10 minutes.</p>
    <p>If you did not request this, please ignore this email.</p>
    <br/>
    <p style="color: gray; font-size: 12px;">(Recipient: ${userEmail})</p>
  `;

  if (process.env.NODE_ENV !== "production") {
    console.log(`\n========================================`);
    console.log(`🔑 DEV OTP for ${userEmail}: ${otp}`);
    console.log(`========================================\n`);
  }

  if (userId) {
    await prisma.user.update({
      where: { id: userId },
      data: { otp, otpExpiry: new Date(Date.now() + 10 * 60 * 1000) },
    });
  }

  return await sendEmail(`${userEmail}`, subject, html);
};

export const sendAdminApprovalEmail = async (
  adminDetails: AdminDetails,
  approvalLink: string,
): Promise<boolean> => {
  const subject = "Action Required: Approve New Admin User";
  const html = `
    <h2>New Admin Approval Request</h2>
    <p>A new user has signed up and requested Admin access.</p>
    <p><strong>Name:</strong> ${adminDetails.name}</p>
    <p><strong>Email:</strong> ${adminDetails.email}</p>
    <p><strong>Username:</strong> ${adminDetails.username}</p>
    <br/>
    <p>Please click the link below to approve this user as an Admin:</p>
    <a href="${approvalLink}" style="padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Approve Admin</a>
    <p>If you did not expect this, please ignore this email.</p>
  `;
  return await sendEmail("vikashchaudhari103@gmail.com", subject, html);
};

export const sendApprovalNotificationToAdmin = async (
  adminEmail: string,
): Promise<boolean> => {
  const subject = "Admin Access Approved";
  const html = `
    <h2>Access Approved!</h2>
    <p>Your request for Admin access has been approved.</p>
    <p>You can now log in to the dashboard.</p>
  `;
  return await sendEmail(adminEmail, subject, html);
};
