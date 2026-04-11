/*
  Warnings:

  - The primary key for the `CoinPurchaseSession` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `session_id` on the `CoinPurchaseSession` table. All the data in the column will be lost.
  - The required column `id` was added to the `CoinPurchaseSession` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropForeignKey
ALTER TABLE "CoinTransaction" DROP CONSTRAINT "CoinTransaction_session_id_fkey";

-- DropForeignKey
ALTER TABLE "LockedCart" DROP CONSTRAINT "LockedCart_session_id_fkey";

-- AlterTable
ALTER TABLE "CoinPurchaseSession" DROP CONSTRAINT "CoinPurchaseSession_pkey",
DROP COLUMN "session_id",
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "CoinPurchaseSession_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "CoinTransaction" ADD CONSTRAINT "CoinTransaction_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "CoinPurchaseSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LockedCart" ADD CONSTRAINT "LockedCart_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "CoinPurchaseSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
