/*
  Warnings:

  - You are about to drop the column `locked_cart_id` on the `CoinTransaction` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "CoinTransaction" DROP CONSTRAINT "CoinTransaction_locked_cart_id_fkey";

-- AlterTable
ALTER TABLE "CoinTransaction" DROP COLUMN "locked_cart_id";
