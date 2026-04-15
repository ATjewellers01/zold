/*
  Warnings:

  - You are about to drop the column `userId` on the `Sip` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Sip" DROP CONSTRAINT "Sip_userId_fkey";

-- AlterTable
ALTER TABLE "Sip" DROP COLUMN "userId",
ALTER COLUMN "min_investment" SET DEFAULT 100.00;
