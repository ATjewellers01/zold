/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `Partner` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "AdminRoleType" AS ENUM ('SUPER_ADMIN', 'OPERATIONS_ADMIN', 'FINANCE_ADMIN', 'LOAN_ADMIN', 'SUPPORT_ADMIN');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'PARTNER';

-- AlterTable
ALTER TABLE "GoldRate" ADD COLUMN     "margin" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'MANUAL',
ADD COLUMN     "spread" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "GoldTransaction" ADD COLUMN     "purchaseRate" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "Partner" ADD COLUMN     "bankAccount" TEXT,
ADD COLUMN     "commission" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "adminRole" "AdminRoleType";

-- AlterTable
ALTER TABLE "Wallet" ADD COLUMN     "pledgedGold" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "GoldRate_isActive_createdAt_idx" ON "GoldRate"("isActive", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Partner_userId_key" ON "Partner"("userId");

-- CreateIndex
CREATE INDEX "Partner_userId_idx" ON "Partner"("userId");

-- AddForeignKey
ALTER TABLE "Partner" ADD CONSTRAINT "Partner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
