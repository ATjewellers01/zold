import prisma from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  sendAdminApprovalEmail,
  sendOTP,
  sendApprovalNotificationToAdmin,
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

  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (existingUser) {
    throw Object.assign(new Error("User with this email or username already exists"), {
      status: 400,
    });
  }

  const userCount = await prisma.user.count();
  const role: "ADMIN" | "USER" = userCount === 0 ? "ADMIN" : "USER";

  const hashedPassword = await bcrypt.hash(password, 10);
  const newReferralCode = await generateUniqueReferralCode(name);

  const newUser = await prisma.user.create({
    data: {
      name,
      username,
      email,
      password: hashedPassword,
      phone: phone || "",
      role: role as any,
      isVerified: false,
      referralCode: newReferralCode,
    },
  });

  if (inputReferralCode && role === "USER") {
    const referrer = await prisma.user.findUnique({
      where: { referralCode: inputReferralCode },
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

  if (role === "ADMIN") {
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

  await prisma.user.update({
    where: { id: newUser.id },
    data: {otp, otpExpiry },
  });

  await sendOTP(newUser.email, otp);

  return { role: "USER", referralCode: newReferralCode };
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

export const verifyOtpService = async (
  email: string,
  otp: string
): Promise<{ alreadyVerified: boolean }> => {
  const user = await prisma.user.findUnique({ where: { email } });
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
