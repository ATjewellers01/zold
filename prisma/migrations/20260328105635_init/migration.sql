-- CreateEnum
CREATE TYPE "Source" AS ENUM ('ADMIN', 'LIVE');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER', 'PARTNER');

-- CreateEnum
CREATE TYPE "AdminRoleType" AS ENUM ('SUPER_ADMIN', 'OPERATIONS_ADMIN', 'FINANCE_ADMIN', 'LOAN_ADMIN', 'SUPPORT_ADMIN');

-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SellRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('BUY', 'SELL');

-- CreateEnum
CREATE TYPE "PaymentMode" AS ENUM ('RAZORPAY', 'WALLET', 'UPI');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REJECTED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PurchaseSessionStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "Metal" AS ENUM ('GOLD', 'SILVER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "otp" TEXT,
    "otpExpiry" TIMESTAMP(3),
    "phone" TEXT,
    "riskLevel" TEXT NOT NULL DEFAULT 'LOW',
    "dataSharing" BOOLEAN NOT NULL DEFAULT false,
    "profileVisibility" TEXT NOT NULL DEFAULT 'contacts',
    "readReceipts" BOOLEAN NOT NULL DEFAULT true,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "adminRole" "AdminRoleType",
    "referralCode" TEXT,
    "profilePicture" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "goldBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "silverBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rupeeBalance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "pledgedGold" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kyc" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "KycStatus" NOT NULL DEFAULT 'PENDING',
    "panNumber" TEXT,
    "aadhaarNumber" TEXT,
    "bankName" TEXT,
    "accountNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "rejectionReason" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,

    CONSTRAINT "Kyc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestWallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "virtualBalance" DECIMAL(10,2) NOT NULL DEFAULT 10000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetalTransaction" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "session_id" TEXT,
    "metalType" "Metal" NOT NULL,
    "transactionType" "TransactionType" NOT NULL,
    "metalGrams" DOUBLE PRECISION NOT NULL,
    "ratePerGram" DECIMAL(10,2) NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "gst" DECIMAL(10,2) NOT NULL,
    "finalAmount" DECIMAL(10,2) NOT NULL,
    "paymentMode" "PaymentMode" NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "storageType" TEXT,
    "purchaseRate" DECIMAL(10,2),
    "gstRate" DOUBLE PRECISION NOT NULL DEFAULT 3,
    "razorpay_order_id" TEXT,
    "razorpay_payment_id" TEXT,
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MetalTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetalPurchaseSession" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "metalType" "Metal" NOT NULL,
    "transactionType" "TransactionType" NOT NULL,
    "metalGrams" DOUBLE PRECISION NOT NULL,
    "locked_rate" DECIMAL(10,2) NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "gst" DECIMAL(10,2) NOT NULL,
    "gstRate" DOUBLE PRECISION NOT NULL DEFAULT 3,
    "finalAmount" DECIMAL(10,2) NOT NULL,
    "status" "PurchaseSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MetalPurchaseSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetalRate" (
    "id" TEXT NOT NULL,
    "metal" "Metal" NOT NULL,
    "buyRate" DECIMAL(10,2) NOT NULL,
    "sellRate" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" "Source" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MetalRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountHolderName" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "ifscCode" TEXT NOT NULL,
    "accountType" TEXT NOT NULL,
    "branch" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentMethod" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT,
    "upiId" TEXT,
    "cardLast4" TEXT,
    "cardNetwork" TEXT,
    "expiryMonth" INTEGER,
    "expiryYear" INTEGER,
    "bankAccountId" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedAddress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'India',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceName" TEXT NOT NULL,
    "deviceType" TEXT NOT NULL,
    "browser" TEXT,
    "os" TEXT,
    "ipAddress" TEXT,
    "location" TEXT,
    "userAgent" TEXT,
    "token" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KycDocument" (
    "id" TEXT NOT NULL,
    "kycId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "documentUrl" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KycDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'Chhattisgarh',
    "country" TEXT NOT NULL DEFAULT 'India',
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "distance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "website" TEXT,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviews" INTEGER NOT NULL DEFAULT 0,
    "timings" TEXT NOT NULL,
    "services" TEXT NOT NULL,
    "offers" TEXT NOT NULL DEFAULT '[]',
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "bankAccount" TEXT,
    "commission" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "userId" TEXT,

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoldGoal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "targetAmount" DECIMAL(10,2) NOT NULL,
    "currentAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "targetGrams" DOUBLE PRECISION NOT NULL,
    "currentGrams" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deadline" TIMESTAMP(3) NOT NULL,
    "category" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "autoAllocate" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "paymentFrequency" TEXT NOT NULL DEFAULT 'monthly',

    CONSTRAINT "GoldGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoldGift" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT,
    "recipientName" TEXT NOT NULL,
    "recipientPhone" TEXT NOT NULL,
    "giftType" TEXT NOT NULL DEFAULT 'rupees',
    "amount" DECIMAL(10,2) NOT NULL,
    "goldGrams" DOUBLE PRECISION NOT NULL,
    "coinGrams" INTEGER,
    "coinQuantity" INTEGER,
    "message" TEXT,
    "occasion" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "claimedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoldGift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "referredUserId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "rewardAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoinInventory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "metal" "Metal" NOT NULL,
    "coinGrams" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoinInventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoinTransaction" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "session_id" TEXT,
    "locked_cart_id" TEXT,
    "metal" "Metal" NOT NULL,
    "type" "TransactionType" NOT NULL,
    "weight" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "rate_per_gram" DECIMAL(10,2) NOT NULL,
    "gold_locked_price" DECIMAL(10,2),
    "silver_locked_price" DECIMAL(10,2),
    "gst" DECIMAL(10,2) NOT NULL,
    "gstRate" DOUBLE PRECISION NOT NULL DEFAULT 3,
    "final_amount" DECIMAL(10,2) NOT NULL,
    "payment_mode" "PaymentMode" NOT NULL,
    "razorpay_order_id" TEXT,
    "razorpay_payment_id" TEXT,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoinTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SellGoldRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "goldGrams" DOUBLE PRECISION NOT NULL,
    "ratePerGram" DECIMAL(10,2) NOT NULL,
    "grossAmount" DECIMAL(10,2) NOT NULL,
    "gst" DECIMAL(10,2) NOT NULL,
    "gstRate" DOUBLE PRECISION NOT NULL DEFAULT 3,
    "netAmount" DECIMAL(10,2) NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "bankAccountId" TEXT,
    "paymentMethodId" TEXT,
    "status" "SellRequestStatus" NOT NULL DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "processedBy" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SellGoldRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoinPurchaseSession" (
    "session_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "status" "PurchaseSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "gstRate" DOUBLE PRECISION NOT NULL DEFAULT 3,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoinPurchaseSession_pkey" PRIMARY KEY ("session_id")
);

-- CreateTable
CREATE TABLE "Cart" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartItem" (
    "id" TEXT NOT NULL,
    "cart_id" TEXT NOT NULL,
    "weight" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "metal" "Metal" NOT NULL,

    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LockedCart" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "locked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gold_locked_price" DECIMAL(10,2) NOT NULL,
    "silver_locked_price" DECIMAL(10,2) NOT NULL,
    "gstRate" DOUBLE PRECISION NOT NULL DEFAULT 3,

    CONSTRAINT "LockedCart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LockedCartItem" (
    "id" TEXT NOT NULL,
    "locked_cart_id" TEXT NOT NULL,
    "weight" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "metal" "Metal" NOT NULL,
    "item_price" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "LockedCartItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GstConfig" (
    "id" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "GstConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_userId_key" ON "Wallet"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Kyc_userId_key" ON "Kyc"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TestWallet_userId_key" ON "TestWallet"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MetalTransaction_session_id_key" ON "MetalTransaction"("session_id");

-- CreateIndex
CREATE INDEX "MetalTransaction_user_id_idx" ON "MetalTransaction"("user_id");

-- CreateIndex
CREATE INDEX "MetalTransaction_status_idx" ON "MetalTransaction"("status");

-- CreateIndex
CREATE INDEX "MetalTransaction_session_id_idx" ON "MetalTransaction"("session_id");

-- CreateIndex
CREATE INDEX "MetalTransaction_razorpay_order_id_idx" ON "MetalTransaction"("razorpay_order_id");

-- CreateIndex
CREATE INDEX "MetalPurchaseSession_user_id_idx" ON "MetalPurchaseSession"("user_id");

-- CreateIndex
CREATE INDEX "MetalPurchaseSession_status_idx" ON "MetalPurchaseSession"("status");

-- CreateIndex
CREATE INDEX "MetalPurchaseSession_expires_at_idx" ON "MetalPurchaseSession"("expires_at");

-- CreateIndex
CREATE INDEX "MetalRate_metal_isActive_idx" ON "MetalRate"("metal", "isActive");

-- CreateIndex
CREATE INDEX "BankAccount_userId_idx" ON "BankAccount"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BankAccount_userId_accountNumber_key" ON "BankAccount"("userId", "accountNumber");

-- CreateIndex
CREATE INDEX "PaymentMethod_userId_idx" ON "PaymentMethod"("userId");

-- CreateIndex
CREATE INDEX "SavedAddress_userId_idx" ON "SavedAddress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSession_token_key" ON "UserSession"("token");

-- CreateIndex
CREATE INDEX "UserSession_userId_idx" ON "UserSession"("userId");

-- CreateIndex
CREATE INDEX "UserSession_token_idx" ON "UserSession"("token");

-- CreateIndex
CREATE INDEX "KycDocument_kycId_idx" ON "KycDocument"("kycId");

-- CreateIndex
CREATE UNIQUE INDEX "Partner_userId_key" ON "Partner"("userId");

-- CreateIndex
CREATE INDEX "Partner_city_idx" ON "Partner"("city");

-- CreateIndex
CREATE INDEX "Partner_isActive_idx" ON "Partner"("isActive");

-- CreateIndex
CREATE INDEX "Partner_userId_idx" ON "Partner"("userId");

-- CreateIndex
CREATE INDEX "GoldGoal_userId_idx" ON "GoldGoal"("userId");

-- CreateIndex
CREATE INDEX "GoldGift_senderId_idx" ON "GoldGift"("senderId");

-- CreateIndex
CREATE INDEX "GoldGift_recipientId_idx" ON "GoldGift"("recipientId");

-- CreateIndex
CREATE INDEX "GoldGift_recipientPhone_idx" ON "GoldGift"("recipientPhone");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_referredUserId_key" ON "Referral"("referredUserId");

-- CreateIndex
CREATE INDEX "Referral_referrerId_idx" ON "Referral"("referrerId");

-- CreateIndex
CREATE INDEX "CoinInventory_userId_idx" ON "CoinInventory"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CoinInventory_userId_coinGrams_metal_key" ON "CoinInventory"("userId", "coinGrams", "metal");

-- CreateIndex
CREATE INDEX "CoinTransaction_user_id_idx" ON "CoinTransaction"("user_id");

-- CreateIndex
CREATE INDEX "CoinTransaction_created_at_idx" ON "CoinTransaction"("created_at");

-- CreateIndex
CREATE INDEX "CoinTransaction_status_idx" ON "CoinTransaction"("status");

-- CreateIndex
CREATE INDEX "CoinTransaction_session_id_idx" ON "CoinTransaction"("session_id");

-- CreateIndex
CREATE INDEX "CoinTransaction_razorpay_order_id_idx" ON "CoinTransaction"("razorpay_order_id");

-- CreateIndex
CREATE INDEX "SellGoldRequest_userId_idx" ON "SellGoldRequest"("userId");

-- CreateIndex
CREATE INDEX "SellGoldRequest_status_idx" ON "SellGoldRequest"("status");

-- CreateIndex
CREATE INDEX "SellGoldRequest_createdAt_idx" ON "SellGoldRequest"("createdAt");

-- CreateIndex
CREATE INDEX "CoinPurchaseSession_user_id_idx" ON "CoinPurchaseSession"("user_id");

-- CreateIndex
CREATE INDEX "CoinPurchaseSession_status_idx" ON "CoinPurchaseSession"("status");

-- CreateIndex
CREATE INDEX "CoinPurchaseSession_expires_at_idx" ON "CoinPurchaseSession"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "Cart_user_id_key" ON "Cart"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_cart_id_weight_metal_key" ON "CartItem"("cart_id", "weight", "metal");

-- CreateIndex
CREATE UNIQUE INDEX "LockedCart_session_id_key" ON "LockedCart"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "LockedCartItem_locked_cart_id_weight_metal_key" ON "LockedCartItem"("locked_cart_id", "weight", "metal");

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kyc" ADD CONSTRAINT "Kyc_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestWallet" ADD CONSTRAINT "TestWallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetalTransaction" ADD CONSTRAINT "MetalTransaction_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetalTransaction" ADD CONSTRAINT "MetalTransaction_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "MetalPurchaseSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetalPurchaseSession" ADD CONSTRAINT "MetalPurchaseSession_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankAccount" ADD CONSTRAINT "BankAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentMethod" ADD CONSTRAINT "PaymentMethod_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedAddress" ADD CONSTRAINT "SavedAddress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KycDocument" ADD CONSTRAINT "KycDocument_kycId_fkey" FOREIGN KEY ("kycId") REFERENCES "Kyc"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Partner" ADD CONSTRAINT "Partner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoldGoal" ADD CONSTRAINT "GoldGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoldGift" ADD CONSTRAINT "GoldGift_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoldGift" ADD CONSTRAINT "GoldGift_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referredUserId_fkey" FOREIGN KEY ("referredUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoinInventory" ADD CONSTRAINT "CoinInventory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoinTransaction" ADD CONSTRAINT "CoinTransaction_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoinTransaction" ADD CONSTRAINT "CoinTransaction_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "CoinPurchaseSession"("session_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoinTransaction" ADD CONSTRAINT "CoinTransaction_locked_cart_id_fkey" FOREIGN KEY ("locked_cart_id") REFERENCES "LockedCart"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellGoldRequest" ADD CONSTRAINT "SellGoldRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoinPurchaseSession" ADD CONSTRAINT "CoinPurchaseSession_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LockedCart" ADD CONSTRAINT "LockedCart_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "CoinPurchaseSession"("session_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LockedCart" ADD CONSTRAINT "LockedCart_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LockedCartItem" ADD CONSTRAINT "LockedCartItem_locked_cart_id_fkey" FOREIGN KEY ("locked_cart_id") REFERENCES "LockedCart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GstConfig" ADD CONSTRAINT "GstConfig_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
