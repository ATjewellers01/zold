/*
  Warnings:

  - You are about to drop the column `color` on the `GoldGoal` table. All the data in the column will be lost.
  - You are about to drop the column `icon` on the `GoldGoal` table. All the data in the column will be lost.
  - The `status` column on the `GoldGoal` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `paymentFrequency` column on the `GoldGoal` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `SellGoldRequest` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "Frequency" AS ENUM ('MONTHLY', 'QUATERLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'COMPLETED');

-- DropForeignKey
ALTER TABLE "SellGoldRequest" DROP CONSTRAINT "SellGoldRequest_userId_fkey";

-- AlterTable
ALTER TABLE "GoldGoal" DROP COLUMN "color",
DROP COLUMN "icon",
DROP COLUMN "status",
ADD COLUMN     "status" "GoalStatus" NOT NULL DEFAULT 'ACTIVE',
DROP COLUMN "paymentFrequency",
ADD COLUMN     "paymentFrequency" "Frequency" NOT NULL DEFAULT 'MONTHLY';

-- DropTable
DROP TABLE "SellGoldRequest";

-- DropEnum
DROP TYPE "SellRequestStatus";
