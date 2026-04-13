/*
  Warnings:

  - Added the required column `completionDate` to the `MetalGoal` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MetalGoal" ADD COLUMN     "completionDate" TIMESTAMP(3) NOT NULL;
