/*
  Warnings:

  - You are about to drop the column `investment_amount` on the `UserSip` table. All the data in the column will be lost.
  - You are about to drop the column `total_invested_amount` on the `UserSip` table. All the data in the column will be lost.
  - Added the required column `invested_amount` to the `UserSip` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UserSip" DROP COLUMN "investment_amount",
DROP COLUMN "total_invested_amount",
ADD COLUMN     "invested_amount" DECIMAL(10,2) NOT NULL;
