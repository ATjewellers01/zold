const { PrismaClient } = require("../generated/prisma");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  sendAdminApprovalEmail,
  sendOTP,
  sendApprovalNotificationToAdmin,
} = require("../services/emailService");

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

const signup = async (req, res) => {
  try {
    const { name, username, email, password, phone } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email or username already exists",
      });
    }

    // Check total users to determine role
    const userCount = await prisma.user.count();
    const role = userCount === 0 ? "ADMIN" : "USER";

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate unique referral code for the new user
    // Format: ZOLD-NAME4-RANDOM4 (e.g., ZOLD-VIKA1234)
    const namePart = name.slice(0, 4).toUpperCase();
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    let newReferralCode = `ZOLD-${namePart}${randomPart}`;

    // Ensure uniqueness (simple retry)
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

    // Create user
    const newUser = await prisma.user.create({
      data: {
        name,
        username,
        email,
        password: hashedPassword,
        phone: phone || null,
        role: role, // Prisma Enum
        isVerified: false, // Always requires verification first
        referralCode: newReferralCode, // Assign generated code
      },
    });

    // Handle Referral Logic (if referral code provided)
    if (req.body.referralCode && role === "USER") {
      // Admins probably don't get referred
      const referrer = await prisma.user.findUnique({
        where: { referralCode: req.body.referralCode },
      });

      if (referrer) {
        await prisma.referral.create({
          data: {
            referrerId: referrer.id,
            referredUserId: newUser.id,
            status: "PENDING",
            rewardAmount: 100, // Hardcoded reward for now
          },
        });
      }
    }

    // Generate Verification Token (valid for 24h)
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email, purpose: "verification" },
      JWT_SECRET,
      { expiresIn: "24h" },
    );

    const verificationLink = `http://localhost:5001/api/auth/verify/${token}`; // Needs frontend or backend route
    const approvalLink = `http://localhost:5001/api/auth/approve-admin/${token}`;

    if (role === "ADMIN") {
      // Send approval email to SUPER ADMIN (hardcoded for now as requested)
      await sendAdminApprovalEmail(newUser, approvalLink);
      res.status(201).json({
        success: true,
        message: "Admin account created. Waiting for Super Admin approval.",
        role: "ADMIN",
      });
    } else {
      // Generate 6-digit OTP for USER
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Save OTP to DB
      await prisma.user.update({
        where: { id: newUser.id },
        data: { otp, otpExpiry },
      });

      // Send OTP email
      await sendOTP(newUser.email, otp);

      res.status(201).json({
        success: true,
        message: "OTP sent to your email.",
        role: "USER",
        referralCode: newReferralCode,
      });
    }
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user (allow login with email or username if desired, here using validation from frontend which sends 'username')
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username: username }, { email: username }],
      },
    });

    console.log(user, "getting responce back from the user ");

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    // Check verification
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Account not verified or pending approval.",
      });
    }

    // Generate Auth Token with adminRole
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
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (user.isVerified) {
      return res
        .status(200)
        .json({ success: true, message: "Email already verified" });
    }

    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    if (new Date() > user.otpExpiry) {
      return res.status(400).json({ success: false, message: "OTP expired" });
    }

    // Update user
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
  } catch (error) {
    console.error("OTP Verification error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const approveAdmin = async (req, res) => {
  try {
    const { token } = req.params;

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Check if user is actually an admin candidate
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || user.role !== "ADMIN") {
      return res.status(400).send("<h1>Invalid Request</h1>");
    }

    if (user.isVerified) {
      return res.send("<h1>Admin already approved.</h1>");
    }

    // Approve
    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true },
    });

    // Notify the admin user
    await sendApprovalNotificationToAdmin(user.email);

    res.send("<h1>Admin Access Approved Successfully!</h1>");
  } catch (error) {
    console.error("Approval error:", error);
    res.status(400).send("<h1>Invalid or Expired Link</h1>");
  }
};

module.exports = {
  signup,
  login,
  verifyOtp,
  approveAdmin,
};
