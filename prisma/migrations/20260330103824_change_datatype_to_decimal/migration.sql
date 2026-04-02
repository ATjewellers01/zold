/*
  Warnings:

  - You are about to alter the column `gstRate` on the `CoinPurchaseSession` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(5,2)`.
  - You are about to alter the column `gstRate` on the `CoinTransaction` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(5,2)`.
  - You are about to alter the column `goldGrams` on the `GoldGift` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,4)`.
  - You are about to alter the column `targetGrams` on the `GoldGoal` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,4)`.
  - You are about to alter the column `currentGrams` on the `GoldGoal` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,4)`.
  - You are about to alter the column `rate` on the `GstConfig` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(5,2)`.
  - You are about to alter the column `gstRate` on the `LockedCart` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(5,2)`.
  - You are about to alter the column `metalGrams` on the `MetalPurchaseSession` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,4)`.
  - You are about to alter the column `gstRate` on the `MetalPurchaseSession` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(5,2)`.
  - You are about to alter the column `metalGrams` on the `MetalTransaction` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,4)`.
  - You are about to alter the column `gstRate` on the `MetalTransaction` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(5,2)`.
  - You are about to alter the column `commission` on the `Partner` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(5,2)`.
  - You are about to alter the column `goldGrams` on the `SellGoldRequest` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,4)`.
  - You are about to alter the column `gstRate` on the `SellGoldRequest` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(5,2)`.
  - You are about to alter the column `goldBalance` on the `Wallet` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,4)`.
  - You are about to alter the column `silverBalance` on the `Wallet` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,4)`.
  - You are about to alter the column `pledgedGold` on the `Wallet` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,4)`.

*/
-- AlterTable
ALTER TABLE "CoinPurchaseSession" ALTER COLUMN "gstRate" SET DATA TYPE DECIMAL(5,2);

-- AlterTable
ALTER TABLE "CoinTransaction" ALTER COLUMN "gstRate" SET DATA TYPE DECIMAL(5,2);

-- AlterTable
ALTER TABLE "GoldGift" ALTER COLUMN "goldGrams" SET DATA TYPE DECIMAL(10,4);

-- AlterTable
ALTER TABLE "GoldGoal" ALTER COLUMN "targetGrams" SET DATA TYPE DECIMAL(10,4),
ALTER COLUMN "currentGrams" SET DATA TYPE DECIMAL(10,4);

-- AlterTable
ALTER TABLE "GstConfig" ALTER COLUMN "rate" SET DATA TYPE DECIMAL(5,2);

-- AlterTable
ALTER TABLE "LockedCart" ALTER COLUMN "gstRate" SET DATA TYPE DECIMAL(5,2);

-- AlterTable
ALTER TABLE "MetalPurchaseSession" ALTER COLUMN "metalGrams" SET DATA TYPE DECIMAL(10,4),
ALTER COLUMN "gstRate" SET DATA TYPE DECIMAL(5,2);

-- AlterTable
ALTER TABLE "MetalTransaction" ALTER COLUMN "metalGrams" SET DATA TYPE DECIMAL(10,4),
ALTER COLUMN "gstRate" SET DATA TYPE DECIMAL(5,2);

-- AlterTable
ALTER TABLE "Partner" ALTER COLUMN "commission" SET DATA TYPE DECIMAL(5,2);

-- AlterTable
ALTER TABLE "SellGoldRequest" ALTER COLUMN "goldGrams" SET DATA TYPE DECIMAL(10,4),
ALTER COLUMN "gstRate" SET DATA TYPE DECIMAL(5,2);

-- AlterTable
ALTER TABLE "Wallet" ALTER COLUMN "goldBalance" SET DATA TYPE DECIMAL(10,4),
ALTER COLUMN "silverBalance" SET DATA TYPE DECIMAL(10,4),
ALTER COLUMN "pledgedGold" SET DATA TYPE DECIMAL(10,4);
