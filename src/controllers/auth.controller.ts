import { Response } from "express";
import jwt from "jsonwebtoken";
import { AuthenticatedRequest } from "../types/index.js";
import {
  signupService,
  loginService,
  verifyOtpService,
  resendOtpService,
  approveAdminService,
  getMeService,
  verifyEmailAndSendOtpService,
  verifyOtpAndResetPasswordService,
} from "../services/auth.service.js";
import { sendOTP } from "../services/email.service.js";
import { generateOtp } from "../utils/otp.js";
import prisma from "../config/db.js";

const handleError = (res: Response, error: any, fallback: string) => {
  const status = error?.status || 500;
  const message = status === 500 ? "Internal server error" : error.message;
  if (status === 500) console.error(fallback, error);
  res.status(status).json({ success: false, message });
};

export const signup = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const result = await signupService(req.body);
    if (result.role === "ADMIN") {
      res.status(201).json({
        success: true,
        message: "Admin account created. Waiting for Super Admin approval.",
        role: "ADMIN",
      });
      return;
    }
    res.status(201).json({
      success: true,
      message: "OTP sent to your email.",
      role: "USER",
      referralCode: result.referralCode,
    });
  } catch (error: any) {
    handleError(res, error, "Signup error:");
  }
};

export const resendOtp = async (req: any, res: Response): Promise<any> => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    await resendOtpService(email);
    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      data: {}
    });
  }
  catch (error: any) {
    return res.status(error?.status || 500).json({
      success: false,
      message: error.message || "Server error"
    });
  }
};

export const login = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { username, password } = req.body;
    const { token, user } = await loginService(username, password);

    const isProd = process.env.NODE_ENV === "production";
    res.cookie("token", token, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ success: true, user });
  } catch (error: any) {
    handleError(res, error, "Login error:");
  }
};

export const verifyOtp = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { email, otp } = req.body;
    const { alreadyVerified } = await verifyOtpService(email, otp);
    res.status(200).json({
      success: true,
      message: alreadyVerified
        ? "Email already verified"
        : "Email verified successfully",
    });
  } catch (error: any) {
    handleError(res, error, "OTP Verification error:");
  }
};

export const logout = (
  _req: AuthenticatedRequest,
  res: Response,
): void => {
  const isProd = process.env.NODE_ENV === "production";
  res.clearCookie("token", {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
  });
  res.status(200).json({ success: true, message: "Logged out successfully" });
};

export const approveAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { token } = req.params;
    const { status } = await approveAdminService(token);
    if (status === "invalid") {
      res.status(400).send("<h1>Invalid Request</h1>");
      return;
    }
    if (status === "already") {
      res.send("<h1>Admin already approved.</h1>");
      return;
    }
    res.send("<h1>Admin Access Approved Successfully!</h1>");
  } catch (error: any) {
    console.error("Approval error:", error);
    res.status(400).send("<h1>Invalid or Expired Link</h1>");
  }
};

export const me = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }
    const user = await getMeService(userId);
    res.status(200).json({ success: true, user });
  } catch (error: any) {
    if (error?.status === 401) {
      const isProd = process.env.NODE_ENV === "production";
      res.clearCookie("token", {
        httpOnly: true,
        secure: isProd,
        sameSite: "lax",
      });
    }
    handleError(res, error, "Me error:");
  }
};

export const verifyEmailAndSendOtp = async (req: any, res: Response): Promise<any> => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    const result = await verifyEmailAndSendOtpService(email);
    if (!result.result) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email"
      });
    }

    if (result.token) {
      const isProd = process.env.NODE_ENV === "production";
      res.cookie("token", result.token, {
        httpOnly: true,
        secure: isProd,
        sameSite: "lax",
        maxAge: 5 * 60 * 1000,
      });
    }
    return res.status(200).json({
      success: true,
      message: "Verification code sent to your email",
      token: result.token,
      data: {}
    });
  }
  catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Server error",
    });
  }
};

export const verifyOtpAndResetPassword = async (req: any, res: Response): Promise<any> => {
  try {
    const { enteredOtp, newPassword } = req.body;
    if (!enteredOtp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Required fields empty"
      });
    }

    await verifyOtpAndResetPasswordService(
      enteredOtp,
      req.user.otp,
      req.user.email,
      newPassword
    );
    return res.status(200).json({
      success: true,
      message: "Password reset successfully",
      data: {}
    });
  }
  catch (error: any) {
    return res.status(error?.status || 500).json({
      success: false,
      message: error?.message || "Server error"
    });
  }
};
