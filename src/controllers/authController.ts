import { Response } from "express";
import prisma from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AuthenticatedRequest } from "../types/index.js";
import {
  sendAdminApprovalEmail,
  sendOTP,
  sendApprovalNotificationToAdmin,
} from "../services/emailService.js";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

export const signup = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const {
      name,
      username,
      email,
      password,
      phone,
      referralCode: inputReferralCode,
    } = req.body;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      res.status(400).json({
        success: false,
        message: "User with this email or username already exists",
      });
      return;
    }

    const userCount = await prisma.user.count();
    const role = userCount === 0 ? "ADMIN" : "USER";

    const hashedPassword = await bcrypt.hash(password, 10);

    const namePart = name.slice(0, 4).toUpperCase();
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    let newReferralCode = `ZOLD-${namePart}${randomPart}`;

    let codeExists = await prisma.user.findUnique({
      where: { referralCode: newReferralCode },
    });
    while (codeExists) {
      const newRandom = Math.floor(1000 + Math.random() * 9000);
      newReferralCode = `ZOLD-${namePart}${newRandom}`;
      codeExists = await prisma.user.findUnique({
        where: { referralCode: newReferralCode },
      });
    }

    const newUser = await prisma.user.create({
      data: {
        name,
        username,
        email,
        password: hashedPassword,
        phone: phone || null,
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

    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email, purpose: "verification" },
      JWT_SECRET,
      { expiresIn: "24h" },
    );

    const approvalLink = `http://localhost:5001/api/auth/approve-admin/${token}`;

    if (role === "ADMIN") {
      await sendAdminApprovalEmail(
        {
          name: newUser.name,
          email: newUser.email,
          username: newUser.username,
        },
        approvalLink,
      );
      res.status(201).json({
        success: true,
        message: "Admin account created. Waiting for Super Admin approval.",
        role: "ADMIN",
      });
    } else {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

      await prisma.user.update({
        where: { id: newUser.id },
        data: { otp, otpExpiry },
      });

      await sendOTP(newUser.email, otp);

      res.status(201).json({
        success: true,
        message: "OTP sent to your email.",
        role: "USER",
        referralCode: newReferralCode,
      });
    }
  } catch (error: any) {
    console.error("Signup error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const login = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { username, password } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username: username }, { email: username }],
      },
    });

    console.log(user, "getting response back from the user");

    if (!user) {
      res.status(401).json({ success: false, message: "Invalid credentials" });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: "Invalid credentials" });
      return;
    }

    if (!user.isVerified) {
      res.status(403).json({
        success: false,
        message: "Account not verified or pending approval.",
      });
      return;
    }

    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        adminRole: user.adminRole,
        username: user.username,
      },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        adminRole: user.adminRole,
      },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const verifyOtp = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { email, otp } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    if (user.isVerified) {
      res
        .status(200)
        .json({ success: true, message: "Email already verified" });
      return;
    }

    if (!user.otp || user.otp !== otp) {
      res.status(400).json({ success: false, message: "Invalid OTP" });
      return;
    }

    if (user.otpExpiry && new Date() > user.otpExpiry) {
      res.status(400).json({ success: false, message: "OTP expired" });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        otp: null,
        otpExpiry: null,
      },
    });

    res
      .status(200)
      .json({ success: true, message: "Email verified successfully" });
  } catch (error: any) {
    console.error("OTP Verification error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const approveAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { token } = req.params;

    const decoded = jwt.verify(token, JWT_SECRET) as any;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || user.role !== "ADMIN") {
      res.status(400).send("<h1>Invalid Request</h1>");
      return;
    }

    if (user.isVerified) {
      res.send("<h1>Admin already approved.</h1>");
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true },
    });

    await sendApprovalNotificationToAdmin(user.email);

    res.send("<h1>Admin Access Approved Successfully!</h1>");
  } catch (error: any) {
    console.error("Approval error:", error);
    res.status(400).send("<h1>Invalid or Expired Link</h1>");
  }
};
