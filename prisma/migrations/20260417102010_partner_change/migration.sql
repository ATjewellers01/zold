/*
  Warnings:

  - You are about to drop the column `bankAccount` on the `Partner` table. All the data in the column will be lost.
  - You are about to drop the column `commission` on the `Partner` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `Partner` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Partner` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Partner` table. All the data in the column will be lost.
  - You are about to drop the column `distance` on the `Partner` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `Partner` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `Partner` table. All the data in the column will be lost.
  - You are about to drop the column `isVerified` on the `Partner` table. All the data in the column will be lost.
  - You are about to drop the column `latitude` on the `Partner` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Partner` table. All the data in the column will be lost.
  - You are about to drop the column `offers` on the `Partner` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `Partner` table. All the data in the column will be lost.
  - You are about to drop the column `rating` on the `Partner` table. All the data in the column will be lost.
  - You are about to drop the column `reviews` on the `Partner` table. All the data in the column will be lost.
  - You are about to drop the column `services` on the `Partner` table. All the data in the column will be lost.
  - You are about to drop the column `state` on the `Partner` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Partner` table. All the data in the column will be lost.
  - You are about to drop the column `verifiedAt` on the `Partner` table. All the data in the column will be lost.
  - You are about to drop the column `website` on the `Partner` table. All the data in the column will be lost.
  - Added the required column `business_name` to the `Partner` table without a default value. This is not possible if the table is not empty.
  - Added the required column `full_address` to the `Partner` table without a default value. This is not possible if the table is not empty.
  - Added the required column `latitue` to the `Partner` table without a default value. This is not possible if the table is not empty.
  - Added the required column `owner_name` to the `Partner` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pincode` to the `Partner` table without a default value. This is not possible if the table is not empty.
  - Added the required column `services_offers` to the `Partner` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `Partner` table without a default value. This is not possible if the table is not empty.
  - Made the column `userId` on table `Partner` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "Services" AS ENUM ('JEWELLERY', 'PICKUP', 'LOAN');

-- DropForeignKey
ALTER TABLE "Partner" DROP CONSTRAINT "Partner_userId_fkey";

-- DropIndex
DROP INDEX "Partner_city_idx";

-- DropIndex
DROP INDEX "Partner_isActive_idx";

-- DropIndex
DROP INDEX "Partner_userId_idx";

-- AlterTable
ALTER TABLE "Partner" DROP COLUMN "bankAccount",
DROP COLUMN "commission",
DROP COLUMN "country",
DROP COLUMN "createdAt",
DROP COLUMN "description",
DROP COLUMN "distance",
DROP COLUMN "email",
DROP COLUMN "isActive",
DROP COLUMN "isVerified",
DROP COLUMN "latitude",
DROP COLUMN "name",
DROP COLUMN "offers",
DROP COLUMN "phone",
DROP COLUMN "rating",
DROP COLUMN "reviews",
DROP COLUMN "services",
DROP COLUMN "state",
DROP COLUMN "updatedAt",
DROP COLUMN "verifiedAt",
DROP COLUMN "website",
ADD COLUMN     "business_name" TEXT NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "full_address" TEXT NOT NULL,
ADD COLUMN     "latitue" TEXT NOT NULL,
ADD COLUMN     "owner_name" TEXT NOT NULL,
ADD COLUMN     "pincode" TEXT NOT NULL,
ADD COLUMN     "services_offers" "Services" NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "longitude" SET DATA TYPE TEXT,
ALTER COLUMN "userId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Partner_id_area_pincode_idx" ON "Partner"("id", "area", "pincode");

-- AddForeignKey
ALTER TABLE "Partner" ADD CONSTRAINT "Partner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
