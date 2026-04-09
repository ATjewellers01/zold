/*
  Warnings:

  - You are about to alter the column `targetGrams` on the `GoldGoal` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,4)` to `Decimal(10,3)`.
  - You are about to alter the column `currentGrams` on the `GoldGoal` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,4)` to `Decimal(10,3)`.
  - You are about to alter the column `metalGrams` on the `MetalGift` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,4)` to `Decimal(10,3)`.
  - You are about to alter the column `coinGrams` on the `MetalGift` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,4)` to `Decimal(10,3)`.
  - You are about to alter the column `metalGrams` on the `MetalPurchaseSession` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,4)` to `Decimal(10,3)`.
  - You are about to alter the column `metalGrams` on the `MetalTransaction` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,4)` to `Decimal(10,3)`.
  - You are about to alter the column `goldBalance` on the `Wallet` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,4)` to `Decimal(10,3)`.
  - You are about to alter the column `silverBalance` on the `Wallet` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,4)` to `Decimal(10,3)`.
  - You are about to alter the column `pledgedGold` on the `Wallet` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,4)` to `Decimal(10,3)`.

*/
-- CreateEnum
CREATE TYPE "SipFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "SipStatus" AS ENUM ('ACTIVE', 'PAUSED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "SipTransactionStatus" AS ENUM ('SUCCESS', 'FAILED', 'SKIPPED');

-- AlterTable
ALTER TABLE "CoinTransaction" ADD COLUMN     "razorpay_signature" TEXT;

-- AlterTable
ALTER TABLE "GoldGoal" ALTER COLUMN "targetGrams" SET DATA TYPE DECIMAL(10,3),
ALTER COLUMN "currentGrams" SET DATA TYPE DECIMAL(10,3);

-- AlterTable
ALTER TABLE "MetalGift" ALTER COLUMN "metalGrams" SET DATA TYPE DECIMAL(10,3),
ALTER COLUMN "coinGrams" SET DATA TYPE DECIMAL(10,3);

-- AlterTable
ALTER TABLE "MetalPurchaseSession" ALTER COLUMN "metalGrams" SET DATA TYPE DECIMAL(10,3);

-- AlterTable
ALTER TABLE "MetalTransaction" ADD COLUMN     "razorpay_signature" TEXT,
ALTER COLUMN "metalGrams" SET DATA TYPE DECIMAL(10,3);

-- AlterTable
ALTER TABLE "Wallet" ALTER COLUMN "goldBalance" SET DATA TYPE DECIMAL(10,3),
ALTER COLUMN "silverBalance" SET DATA TYPE DECIMAL(10,3),
ALTER COLUMN "pledgedGold" SET DATA TYPE DECIMAL(10,3);

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
    "user_id" TEXT NOT NULL,
    "name" TEXT,
    "metal" "Metal" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "frequency" "SipFrequency" NOT NULL,
    "day_of_week" INTEGER,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "status" "SipStatus" NOT NULL DEFAULT 'ACTIVE',
    "total_invested" DECIMAL(10,2) NOT NULL,
    "total_grams" DECIMAL(10,3) NOT NULL,
    "installments_paid" INTEGER NOT NULL,
    "next_execution_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "day_of_month" INTEGER,

    CONSTRAINT "Sip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SipTransaction" (
    "id" TEXT NOT NULL,
    "sip_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "metal_rate" DECIMAL(10,2) NOT NULL,
    "grams" DECIMAL(10,3) NOT NULL,
    "gst" DECIMAL(10,2) NOT NULL,
    "gst_rate" INTEGER NOT NULL,
    "status" "SipTransactionStatus" NOT NULL,
    "executed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SipTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_user_id_idx" ON "Notification"("user_id");

-- CreateIndex
CREATE INDEX "Notification_is_read_idx" ON "Notification"("is_read");

-- CreateIndex
CREATE INDEX "Notification_created_at_idx" ON "Notification"("created_at");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sip" ADD CONSTRAINT "Sip_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SipTransaction" ADD CONSTRAINT "SipTransaction_sip_id_fkey" FOREIGN KEY ("sip_id") REFERENCES "Sip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SipTransaction" ADD CONSTRAINT "SipTransaction_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
