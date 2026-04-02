/*
  Warnings:

  - A unique constraint covering the columns `[metal,createdBy,source,isActive]` on the table `MetalRate` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `source` to the `MetalRate` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `createdBy` on the `MetalRate` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropIndex
DROP INDEX "MetalRate_metal_createdBy_isActive_key";

-- AlterTable
ALTER TABLE "MetalRate" ADD COLUMN     "source" "Source" NOT NULL,
DROP COLUMN "createdBy",
ADD COLUMN     "createdBy" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "MetalRate_metal_createdBy_isActive_idx" ON "MetalRate"("metal", "createdBy", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "MetalRate_metal_createdBy_source_isActive_key" ON "MetalRate"("metal", "createdBy", "source", "isActive");

-- AddForeignKey
ALTER TABLE "MetalRate" ADD CONSTRAINT "MetalRate_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
