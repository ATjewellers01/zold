/*
  Warnings:

  - You are about to drop the `GoldGift` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[metalGiftId]` on the table `MetalTransaction` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "GiftType" AS ENUM ('COIN', 'VIRTUAL');

-- CreateEnum
CREATE TYPE "GiftStatus" AS ENUM ('COMPLETED', 'FAILED');

-- DropForeignKey
ALTER TABLE "GoldGift" DROP CONSTRAINT "GoldGift_recipientId_fkey";

-- DropForeignKey
ALTER TABLE "GoldGift" DROP CONSTRAINT "GoldGift_senderId_fkey";

-- AlterTable
ALTER TABLE "MetalTransaction" ADD COLUMN     "metalGiftId" TEXT;

-- DropTable
DROP TABLE "GoldGift";

-- CreateTable
CREATE TABLE "MetalGift" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "giftType" "GiftType" NOT NULL DEFAULT 'VIRTUAL',
    "metalType" "Metal" NOT NULL,
    "metalGrams" DECIMAL(10,4),
    "coinGrams" DECIMAL(10,4),
    "coinQuantity" INTEGER,
    "message" TEXT,
    "occasion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "GiftStatus" NOT NULL DEFAULT 'COMPLETED',

    CONSTRAINT "MetalGift_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MetalGift_senderId_idx" ON "MetalGift"("senderId");

-- CreateIndex
CREATE INDEX "MetalGift_recipientId_idx" ON "MetalGift"("recipientId");

-- CreateIndex
CREATE UNIQUE INDEX "MetalTransaction_metalGiftId_key" ON "MetalTransaction"("metalGiftId");

-- AddForeignKey
ALTER TABLE "MetalTransaction" ADD CONSTRAINT "MetalTransaction_metalGiftId_fkey" FOREIGN KEY ("metalGiftId") REFERENCES "MetalGift"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetalGift" ADD CONSTRAINT "MetalGift_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetalGift" ADD CONSTRAINT "MetalGift_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
