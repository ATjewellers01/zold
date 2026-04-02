/*
  Warnings:

  - You are about to drop the column `coinGrams` on the `MetalGift` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "MetalGift" DROP COLUMN "coinGrams",
ADD COLUMN     "coin" DECIMAL(10,4);
