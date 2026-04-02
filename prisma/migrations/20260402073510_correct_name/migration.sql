/*
  Warnings:

  - You are about to drop the column `coin` on the `MetalGift` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "MetalGift" DROP COLUMN "coin",
ADD COLUMN     "coinGrams" DECIMAL(10,4);
