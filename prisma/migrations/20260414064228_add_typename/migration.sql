/*
  Warnings:

  - You are about to drop the column `amount` on the `Sip` table. All the data in the column will be lost.
  - You are about to drop the column `day_of_week` on the `Sip` table. All the data in the column will be lost.
  - You are about to drop the column `frequency` on the `Sip` table. All the data in the column will be lost.
  - You are about to drop the column `next_execution_at` on the `Sip` table. All the data in the column will be lost.
  - You are about to drop the column `start_date` on the `Sip` table. All the data in the column will be lost.
  - You are about to drop the column `total_grams` on the `Sip` table. All the data in the column will be lost.
  - Added the required column `investment_amount` to the `Sip` table without a default value. This is not possible if the table is not empty.
  - Made the column `name` on table `Sip` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Sip" DROP COLUMN "amount",
DROP COLUMN "day_of_week",
DROP COLUMN "frequency",
DROP COLUMN "next_execution_at",
DROP COLUMN "start_date",
DROP COLUMN "total_grams",
ADD COLUMN     "investment_amount" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "name" SET NOT NULL;
