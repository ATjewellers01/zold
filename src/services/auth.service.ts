import prisma from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  sendAdminApprovalEmail,
  sendOTP,
  sendApprovalNotificationToAdmin,
  sendEmail,
} from "./email.service.js";
import { generateOtp } from "../utils/otp.js";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set");
}
const JWT_SECRET = process.env.JWT_SECRET;

export interface SignupInput {
  name: string;
  username: string;
  email: string;
  password: string;
  phone?: string | null;
  referralCode?: string;
}

export interface SignupResult {
  role: "ADMIN" | "USER";
  referralCode?: string;
}

interface PendingSignup {
  name: string;
  username: string;
  email: string;
  password: string;
  phone?: string | null;
  referralCode?: string;
  otp: string;
  otpExpiry: Date;
}

const pendingSignups = new Map<string, PendingSignup>();

const generateUniqueReferralCode = async (name: string): Promise<string> => {
  const namePart = name.slice(0, 4).toUpperCase();
  while (true) {
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    const code = `ZOLD-${namePart}${randomPart}`;
    const exists = await prisma.user.findUnique({ where: { referralCode: code } });
    if (!exists) return code;
  }
};

export const signupService = async (
  input: SignupInput
): Promise<SignupResult> => {
  const { name, username, email, password, phone, referralCode: inputReferralCode } = input;
  const normalizedEmail = email.toLowerCase().trim();

  const existingConditions: any[] = [{ email: normalizedEmail }, { username }];
  if (phone && phone.trim() !== "") {
    existingConditions.push({ phone: phone.trim() });
  }

  const existingUser = await prisma.user.findFirst({
    where: { OR: existingConditions },
  });
  if (existingUser) {
    throw Object.assign(
      new Error("User with this email, username, or phone already exists"),
      { status: 400 }
    );
  }

  const userCount = await prisma.user.count();
  const role: "ADMIN" | "USER" = userCount === 0 ? "ADMIN" : "USER";

  const hashedPassword = await bcrypt.hash(password, 10);

  if (role === "ADMIN") {
    const newReferralCode = await generateUniqueReferralCode(name);
    const newUser = await prisma.user.create({
      data: {
        name,
        username,
        email: normalizedEmail,
        password: hashedPassword,
        phone: phone || "",
        role: role as any,
        isVerified: false,
        referralCode: newReferralCode,
      },
    });

    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email, purpose: "verification" },
      JWT_SECRET,
      { expiresIn: "24h" }
    );
    const baseUrl =
      process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    const approvalLink = `${baseUrl}/api/auth/approve-admin/${token}`;

    await sendAdminApprovalEmail(
      { name: newUser.name, email: newUser.email, username: newUser.username },
      approvalLink
    );
    return { role: "ADMIN" };
  }

  const otp = generateOtp();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  pendingSignups.set(normalizedEmail, {
    name,
    username,
    email: normalizedEmail,
    password: hashedPassword,
    phone: phone || "",
    referralCode: inputReferralCode,
    otp,
    otpExpiry,
  });

  await sendOTP(null, normalizedEmail, otp);

  return { role: "USER" };
};

export interface LoginResult {
  token: string;
  user: {
    id: string;
    name: string;
    username: string;
    email: string;
    role: string;
    adminRole: string | null;
    profilePicture: string | null;
  };
}

export const loginService = async (
  username: string,
  password: string
): Promise<LoginResult> => {
  const user = await prisma.user.findFirst({
    where: { OR: [{ username }, { email: username }] },
  });
  if (!user) {
    throw Object.assign(new Error("Invalid credentials"), { status: 401 });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw Object.assign(new Error("Invalid credentials"), { status: 401 });
  }

  if (!user.isVerified) {
    throw Object.assign(
      new Error("Account not verified or pending approval."),
      { status: 403 }
    );
  }

  const token = jwt.sign(
    {
      userId: user.id,
      role: user.role,
      adminRole: user.adminRole,
      username: user.username,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      adminRole: user.adminRole,
      profilePicture: user.profilePicture ?? null,
    },
  };
};

export const resendOtpService = async (email: string): Promise<void> => {
  const normalizedEmail = email.toLowerCase().trim();
  const pending = pendingSignups.get(normalizedEmail);

  if (pending) {
    const otp = generateOtp();
    pending.otp = otp;
    pending.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await sendOTP(null, pending.email, otp);
    return;
  }

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) {
    throw Object.assign(new Error("No account found with this email"), { status: 404 });
  }

  if (user.isVerified) {
    throw Object.assign(new Error("Account is already verified"), { status: 400 });
  }

  const otp = generateOtp();
  await sendOTP(user.id, user.email, otp);
};

export const verifyOtpService = async (
  email: string,
  otp: string
): Promise<{ alreadyVerified: boolean }> => {
  const normalizedEmail = email.toLowerCase().trim();
  const pending = pendingSignups.get(normalizedEmail);

  if (pending) {
    if (pending.otp !== otp) {
      throw Object.assign(new Error("Invalid OTP"), { status: 400 });
    }
    if (new Date() > pending.otpExpiry) {
      throw Object.assign(new Error("OTP expired"), { status: 400 });
    }

    const existingConditions: any[] = [{ email: pending.email }, { username: pending.username }];
    if (pending.phone) {
      existingConditions.push({ phone: pending.phone });
    }
    const existingUser = await prisma.user.findFirst({
      where: { OR: existingConditions },
    });
    if (existingUser) {
      pendingSignups.delete(normalizedEmail);
      throw Object.assign(
        new Error("User with this email, username, or phone already exists"),
        { status: 400 }
      );
    }

    const userCount = await prisma.user.count();
    const role: "ADMIN" | "USER" = userCount === 0 ? "ADMIN" : "USER";
    const newReferralCode = await generateUniqueReferralCode(pending.name);

    const newUser = await prisma.user.create({
      data: {
        name: pending.name,
        username: pending.username,
        email: pending.email,
        password: pending.password,
        phone: pending.phone || "",
        role: role as any,
        isVerified: true,
        referralCode: newReferralCode,
      },
    });

    if (pending.referralCode && role === "USER") {
      const referrer = await prisma.user.findUnique({
        where: { referralCode: pending.referralCode },
      });
      if (referrer) {
        await prisma.referral.create({
          data: {
            referrerId: referrer.id,
            referredUserId: newUser.id,
            status: "PENDING",
            rewardAmount: 100,
          },
        });
      }
    }

    pendingSignups.delete(normalizedEmail);
    return { alreadyVerified: false };
  }

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) {
    throw Object.assign(new Error("User not found"), { status: 404 });
  }
  if (user.isVerified) return { alreadyVerified: true };

  if (!user.otp || user.otp !== otp) {
    throw Object.assign(new Error("Invalid OTP"), { status: 400 });
  }
  if (user.otpExpiry && new Date() > user.otpExpiry) {
    throw Object.assign(new Error("OTP expired"), { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { isVerified: true, otp: null, otpExpiry: null },
  });

  return { alreadyVerified: false };
};

export const approveAdminService = async (
  token: string
): Promise<{ status: "approved" | "already" | "invalid" }> => {
  let decoded: any;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch {
    return { status: "invalid" };
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
  if (!user || user.role !== "ADMIN") return { status: "invalid" };
  if (user.isVerified) return { status: "already" };

  await prisma.user.update({
    where: { id: user.id },
    data: { isVerified: true },
  });

  await sendApprovalNotificationToAdmin(user.email);
  return { status: "approved" };
};

export const getMeService = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      adminRole: true,
      profilePicture: true,
      isVerified: true,
    },
  });
  if (!user || !user.isVerified) {
    throw Object.assign(new Error("User no longer exists"), { status: 401 });
  }
  return user;
};


// For password reset -> create token with the email, set ttl of 5 min, save OTP to DB and send email
export const verifyEmailAndSendOtpService = async (email: string) => {
  const emailExist = await prisma.user.findUnique({
    where: { email }
  });
  
  if (!emailExist) return { result: false };
  const otp = generateOtp();
  const subject = "Your Email Verification OTP";
  const html = `
    <h2>Verify your email to reset your password</h2>
    <p>Your One-Time Password (OTP) for email verification is:</p>
    <h1 style="color: #3D3066; letter-spacing: 5px;">${otp}</h1>
    <p>This code will expire in 5 minutes.</p>
    <p>If you did not request this, please ignore this email.</p>
    <br/>
    <p style="color: gray; font-size: 12px;">(Recipient: ${email})</p>
  `;

  if (process.env.NODE_ENV !== "production") {
    console.log(`\n========================================`);
    console.log(`🔑 DEV FORGOT-PASSWORD OTP for ${email}: ${otp}`);
    console.log(`========================================\n`);
  }

  await prisma.user.update({
    where: { id: emailExist.id },
    data: { otp, otpExpiry: new Date(Date.now() + 5 * 60 * 1000) }
  });

  await sendEmail(email, subject, html);
  const payload = { otp, email };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: 300 });
  return { result: true, token };
};

export const verifyOtpAndResetPasswordService = async (
  enteredOtp: string,
  expectedOtp: string,
  email: string,
  newPassword: string
) => {
  if (!enteredOtp || !expectedOtp || enteredOtp !== expectedOtp) {
    throw Object.assign(new Error("Invalid or expired OTP"), { status: 400 });
  }
  
  const hashPassword = await bcrypt.hash(newPassword, 10);
  const updatePassword = await prisma.user.update({
    where: { email },
    data: { password: hashPassword, otp: null, otpExpiry: null }
  });
  
  return updatePassword;
};

