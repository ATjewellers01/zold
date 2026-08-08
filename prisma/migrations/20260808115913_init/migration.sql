-- CreateEnum
CREATE TYPE "Source" AS ENUM ('ADMIN', 'LIVE');

-- CreateEnum
CREATE TYPE "Frequency" AS ENUM ('MONTHLY', 'QUATERLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "GiftType" AS ENUM ('COIN', 'VIRTUAL');

-- CreateEnum
CREATE TYPE "GiftStatus" AS ENUM ('COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER', 'PARTNER');

-- CreateEnum
CREATE TYPE "AdminRoleType" AS ENUM ('SUPER_ADMIN', 'OPERATIONS_ADMIN', 'FINANCE_ADMIN', 'LOAN_ADMIN', 'SUPPORT_ADMIN');

-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('BUY', 'SELL', 'GIFT');

-- CreateEnum
CREATE TYPE "PaymentMode" AS ENUM ('RAZORPAY', 'WALLET', 'UPI');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REJECTED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PurchaseSessionStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "Metal" AS ENUM ('GOLD', 'SILVER');

-- CreateEnum
CREATE TYPE "SipFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "SipStatus" AS ENUM ('ACTIVE', 'PAUSED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "SipTransactionStatus" AS ENUM ('SUCCESS', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "SipType" AS ENUM ('REGULAR');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "Services" AS ENUM ('JEWELLERY', 'PICKUP', 'LOAN');

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
    "phone" TEXT NOT NULL,
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
CREATE TABLE "Inventory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "goldBalance" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "silverBalance" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "rupeeBalance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "pledgedGold" DECIMAL(10,3) NOT NULL DEFAULT 0,

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "MetalTransaction" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "session_id" TEXT,
    "metalType" "Metal" NOT NULL,
    "transactionType" "TransactionType" NOT NULL,
    "metalGrams" DECIMAL(10,3) NOT NULL,
    "ratePerGram" DECIMAL(10,2) NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "gst" DECIMAL(10,2) NOT NULL,
    "finalAmount" DECIMAL(10,2) NOT NULL,
    "paymentMode" "PaymentMode" NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "storageType" TEXT,
    "purchaseRate" DECIMAL(10,2),
    "gstRate" DECIMAL(5,2) NOT NULL DEFAULT 3,
    "razorpay_order_id" TEXT,
    "razorpay_payment_id" TEXT,
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metalGiftId" TEXT,
    "razorpay_signature" TEXT,

    CONSTRAINT "MetalTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetalPurchaseSession" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "metalType" "Metal" NOT NULL,
    "transactionType" "TransactionType" NOT NULL,
    "metalGrams" DECIMAL(10,3) NOT NULL,
    "locked_rate" DECIMAL(10,2) NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "gst" DECIMAL(10,2) NOT NULL,
    "gstRate" DECIMAL(5,2) NOT NULL DEFAULT 3,
    "finalAmount" DECIMAL(10,2) NOT NULL,
    "status" "PurchaseSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "razorpay_order_id" TEXT,
    "razorpay_payment_id" TEXT,

    CONSTRAINT "MetalPurchaseSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetalRate" (
    "id" TEXT NOT NULL,
    "metal" "Metal" NOT NULL,
    "buyRate" DECIMAL(10,2) NOT NULL,
    "sellRate" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" "Source" NOT NULL,
    "createdBy" TEXT NOT NULL,

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
    "area" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "longitude" TEXT NOT NULL,
    "timings" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "business_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "full_address" TEXT NOT NULL,
    "owner_name" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "services_offers" "Services" NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "latitude" TEXT NOT NULL,

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetalGoal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "metal" "Metal" NOT NULL,
    "targetAmount" DECIMAL(10,2) NOT NULL,
    "currentAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "targetGrams" DECIMAL(10,3) NOT NULL,
    "currentGrams" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "autoAllocate" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "GoalStatus" NOT NULL DEFAULT 'ACTIVE',
    "paymentFrequency" "Frequency" NOT NULL DEFAULT 'MONTHLY',
    "goalCategory" TEXT NOT NULL,
    "goalName" TEXT NOT NULL,
    "targetDate" TIMESTAMP(3) NOT NULL,
    "completionDate" TIMESTAMP(3),

    CONSTRAINT "MetalGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetalGift" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "giftType" "GiftType" NOT NULL DEFAULT 'VIRTUAL',
    "metalType" "Metal" NOT NULL,
    "metalGrams" DECIMAL(10,3),
    "coinQuantity" INTEGER,
    "message" TEXT,
    "occasion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "GiftStatus" NOT NULL DEFAULT 'COMPLETED',
    "coinGrams" DECIMAL(10,3),

    CONSTRAINT "MetalGift_pkey" PRIMARY KEY ("id")
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
    "metal" "Metal" NOT NULL,
    "type" "TransactionType" NOT NULL,
    "weight" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "rate_per_gram" DECIMAL(10,2) NOT NULL,
    "gold_locked_price" DECIMAL(10,2),
    "silver_locked_price" DECIMAL(10,2),
    "gst" DECIMAL(10,2) NOT NULL,
    "gstRate" DECIMAL(5,2) NOT NULL DEFAULT 3,
    "final_amount" DECIMAL(10,2) NOT NULL,
    "payment_mode" "PaymentMode" NOT NULL,
    "razorpay_order_id" TEXT,
    "razorpay_payment_id" TEXT,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "razorpay_signature" TEXT,
    "remark" TEXT,

    CONSTRAINT "CoinTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoinPurchaseSession" (
    "user_id" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "status" "PurchaseSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "gstRate" DECIMAL(5,2) NOT NULL DEFAULT 3,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "razorpay_order_id" TEXT,
    "razorpay_payment_id" TEXT,
    "id" TEXT NOT NULL,

    CONSTRAINT "CoinPurchaseSession_pkey" PRIMARY KEY ("id")
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
    "gstRate" DECIMAL(5,2) NOT NULL DEFAULT 3,

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
    "rate" DECIMAL(5,2) NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "GstConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sip" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "metal" "Metal" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "min_investment" DECIMAL(10,2) NOT NULL DEFAULT 100.00,
    "type" "SipType" NOT NULL,

    CONSTRAINT "Sip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSip" (
    "id" TEXT NOT NULL,
    "sip_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "metal" "Metal" NOT NULL,
    "day_of_month" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "investment_amount" DECIMAL(10,2) NOT NULL,
    "total_invested_amount" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "UserSip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SipTransaction" (
    "id" TEXT NOT NULL,
    "sip_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "gst" DECIMAL(5,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "investment_amount" DECIMAL(10,2) NOT NULL,
    "metal" "Metal" NOT NULL,
    "razorpay_order_id" TEXT NOT NULL,
    "razorpay_payment_id" TEXT NOT NULL,
    "razorpay_signature" TEXT NOT NULL,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "status" "TransactionStatus" NOT NULL,

    CONSTRAINT "SipTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Delivery" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "metal" "Metal" NOT NULL,
    "coin_grams" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "tentativeDate" TIMESTAMP(3),
    "completionDate" TIMESTAMP(3),
    "addressOfDelivery" TEXT NOT NULL,
    "otp" INTEGER,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Delivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_userId_key" ON "Inventory"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Kyc_userId_key" ON "Kyc"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MetalTransaction_session_id_key" ON "MetalTransaction"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "MetalTransaction_metalGiftId_key" ON "MetalTransaction"("metalGiftId");

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
CREATE INDEX "MetalRate_metal_createdBy_isActive_idx" ON "MetalRate"("metal", "createdBy", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "MetalRate_metal_createdBy_source_isActive_key" ON "MetalRate"("metal", "createdBy", "source", "isActive");

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
CREATE INDEX "Partner_id_area_pincode_idx" ON "Partner"("id", "area", "pincode");

-- CreateIndex
CREATE INDEX "MetalGoal_userId_idx" ON "MetalGoal"("userId");

-- CreateIndex
CREATE INDEX "MetalGift_senderId_idx" ON "MetalGift"("senderId");

-- CreateIndex
CREATE INDEX "MetalGift_recipientId_idx" ON "MetalGift"("recipientId");

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
CREATE INDEX "LockedCart_user_id_idx" ON "LockedCart"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "LockedCartItem_locked_cart_id_weight_metal_key" ON "LockedCartItem"("locked_cart_id", "weight", "metal");

-- CreateIndex
CREATE INDEX "Notification_user_id_idx" ON "Notification"("user_id");

-- CreateIndex
CREATE INDEX "Notification_is_read_idx" ON "Notification"("is_read");

-- CreateIndex
CREATE INDEX "Notification_created_at_idx" ON "Notification"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "UserSip_sip_id_user_id_key" ON "UserSip"("sip_id", "user_id");

-- CreateIndex
CREATE INDEX "Delivery_userId_idx" ON "Delivery"("userId");

-- CreateIndex
CREATE INDEX "Delivery_partnerId_idx" ON "Delivery"("partnerId");

-- CreateIndex
CREATE INDEX "Delivery_status_idx" ON "Delivery"("status");

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kyc" ADD CONSTRAINT "Kyc_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetalTransaction" ADD CONSTRAINT "MetalTransaction_metalGiftId_fkey" FOREIGN KEY ("metalGiftId") REFERENCES "MetalGift"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetalTransaction" ADD CONSTRAINT "MetalTransaction_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "MetalPurchaseSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetalTransaction" ADD CONSTRAINT "MetalTransaction_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetalPurchaseSession" ADD CONSTRAINT "MetalPurchaseSession_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetalRate" ADD CONSTRAINT "MetalRate_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "Partner" ADD CONSTRAINT "Partner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetalGoal" ADD CONSTRAINT "MetalGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetalGift" ADD CONSTRAINT "MetalGift_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetalGift" ADD CONSTRAINT "MetalGift_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referredUserId_fkey" FOREIGN KEY ("referredUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoinInventory" ADD CONSTRAINT "CoinInventory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoinTransaction" ADD CONSTRAINT "CoinTransaction_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "CoinPurchaseSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoinTransaction" ADD CONSTRAINT "CoinTransaction_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoinPurchaseSession" ADD CONSTRAINT "CoinPurchaseSession_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LockedCart" ADD CONSTRAINT "LockedCart_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "CoinPurchaseSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LockedCart" ADD CONSTRAINT "LockedCart_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LockedCartItem" ADD CONSTRAINT "LockedCartItem_locked_cart_id_fkey" FOREIGN KEY ("locked_cart_id") REFERENCES "LockedCart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GstConfig" ADD CONSTRAINT "GstConfig_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSip" ADD CONSTRAINT "UserSip_sip_id_fkey" FOREIGN KEY ("sip_id") REFERENCES "Sip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSip" ADD CONSTRAINT "UserSip_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SipTransaction" ADD CONSTRAINT "SipTransaction_sip_id_fkey" FOREIGN KEY ("sip_id") REFERENCES "Sip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SipTransaction" ADD CONSTRAINT "SipTransaction_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
