-- DropIndex
DROP INDEX "MetalRate_metal_isActive_idx";

-- CreateIndex
CREATE INDEX "MetalRate_metal_createdBy_isActive_idx" ON "MetalRate"("metal", "createdBy", "isActive");
