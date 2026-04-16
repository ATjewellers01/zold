/*
  Warnings:

  - You are about to drop the column `invested_amount` on the `UserSip` table. All the data in the column will be lost.
  - Added the required column `investment_amount` to the `UserSip` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_invested_amount` to the `UserSip` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UserSip" DROP COLUMN "invested_amount",
ADD COLUMN     "investment_amount" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "total_invested_amount" DECIMAL(10,2) NOT NULL;
