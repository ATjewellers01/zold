/*
  Warnings:

  - You are about to drop the column `day_of_month` on the `Sip` table. All the data in the column will be lost.
  - You are about to drop the column `end_date` on the `Sip` table. All the data in the column will be lost.
  - You are about to drop the column `installments_paid` on the `Sip` table. All the data in the column will be lost.
  - You are about to drop the column `investment_amount` on the `Sip` table. All the data in the column will be lost.
  - You are about to drop the column `started_at` on the `Sip` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Sip` table. All the data in the column will be lost.
  - You are about to drop the column `total_invested` on the `Sip` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `Sip` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `Sip` table. All the data in the column will be lost.
  - You are about to drop the column `amount` on the `SipTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `executed_at` on the `SipTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `grams` on the `SipTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `gst_rate` on the `SipTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `metal_rate` on the `SipTransaction` table. All the data in the column will be lost.
  - You are about to alter the column `gst` on the `SipTransaction` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(5,2)`.
  - Added the required column `type` to the `Sip` table without a default value. This is not possible if the table is not empty.
  - Added the required column `investment_amount` to the `SipTransaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `metal` to the `SipTransaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `razorpay_order_id` to the `SipTransaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `razorpay_payment_id` to the `SipTransaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `razorpay_signature` to the `SipTransaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_amount` to the `SipTransaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `SipTransaction` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `status` on the `SipTransaction` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "SipType" AS ENUM ('REGULAR');

-- DropForeignKey
ALTER TABLE "Sip" DROP CONSTRAINT "Sip_user_id_fkey";

-- AlterTable
ALTER TABLE "Sip" DROP COLUMN "day_of_month",
DROP COLUMN "end_date",
DROP COLUMN "installments_paid",
DROP COLUMN "investment_amount",
DROP COLUMN "started_at",
DROP COLUMN "status",
DROP COLUMN "total_invested",
DROP COLUMN "updated_at",
DROP COLUMN "user_id",
ADD COLUMN     "min_investment" DECIMAL(10,2) NOT NULL DEFAULT 500.00,
ADD COLUMN     "type" "SipType" NOT NULL,
ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "SipTransaction" DROP COLUMN "amount",
DROP COLUMN "executed_at",
DROP COLUMN "grams",
DROP COLUMN "gst_rate",
DROP COLUMN "metal_rate",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "investment_amount" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "metal" "Metal" NOT NULL,
ADD COLUMN     "razorpay_order_id" TEXT NOT NULL,
ADD COLUMN     "razorpay_payment_id" TEXT NOT NULL,
ADD COLUMN     "razorpay_signature" TEXT NOT NULL,
ADD COLUMN     "total_amount" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "gst" SET DATA TYPE DECIMAL(5,2),
DROP COLUMN "status",
ADD COLUMN     "status" "TransactionStatus" NOT NULL;

-- CreateTable
CREATE TABLE "UserSip" (
    "id" TEXT NOT NULL,
    "sip_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "metal" "Metal" NOT NULL,
    "investment_amount" DECIMAL(10,2) NOT NULL,
    "total_invested_amount" DECIMAL(10,3) NOT NULL,
    "day_of_month" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),

    CONSTRAINT "UserSip_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Sip" ADD CONSTRAINT "Sip_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSip" ADD CONSTRAINT "UserSip_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSip" ADD CONSTRAINT "UserSip_sip_id_fkey" FOREIGN KEY ("sip_id") REFERENCES "Sip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
