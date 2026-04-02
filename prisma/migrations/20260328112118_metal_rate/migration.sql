/*
  Warnings:

  - A unique constraint covering the columns `[metal,createdBy,isActive]` on the table `MetalRate` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "MetalRate_metal_createdBy_isActive_key" ON "MetalRate"("metal", "createdBy", "isActive");
