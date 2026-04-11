/*
  Warnings:

  - You are about to drop the `TestWallet` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "LockedCart" DROP CONSTRAINT "LockedCart_user_id_fkey";

-- DropForeignKey
ALTER TABLE "TestWallet" DROP CONSTRAINT "TestWallet_userId_fkey";

-- DropTable
DROP TABLE "TestWallet";

-- CreateIndex
CREATE INDEX "LockedCart_user_id_idx" ON "LockedCart"("user_id");

-- AddForeignKey
ALTER TABLE "LockedCart" ADD CONSTRAINT "LockedCart_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
