/*
  Warnings:

  - You are about to drop the column `category` on the `GoldGoal` table. All the data in the column will be lost.
  - You are about to drop the column `deadline` on the `GoldGoal` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `GoldGoal` table. All the data in the column will be lost.
  - Added the required column `goalCategory` to the `GoldGoal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `goalName` to the `GoldGoal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `targetDate` to the `GoldGoal` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "GoldGoal" DROP COLUMN "category",
DROP COLUMN "deadline",
DROP COLUMN "name",
ADD COLUMN     "goalCategory" TEXT NOT NULL,
ADD COLUMN     "goalName" TEXT NOT NULL,
ADD COLUMN     "targetDate" TIMESTAMP(3) NOT NULL;
