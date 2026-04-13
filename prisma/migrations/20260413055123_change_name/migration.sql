/*
  Warnings:

  - You are about to drop the `GoldGoal` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "GoldGoal" DROP CONSTRAINT "GoldGoal_userId_fkey";

-- DropTable
DROP TABLE "GoldGoal";

-- CreateTable
CREATE TABLE "MetalGoal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "metal" "Metal" NOT NULL,
    "targetAmount" DECIMAL(10,2) NOT NULL,
    "currentAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "targetGrams" DECIMAL(10,3) NOT NULL,
    "currentGrams" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "autoAllocate" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "GoalStatus" NOT NULL DEFAULT 'ACTIVE',
    "paymentFrequency" "Frequency" NOT NULL DEFAULT 'MONTHLY',
    "goalCategory" TEXT NOT NULL,
    "goalName" TEXT NOT NULL,
    "targetDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MetalGoal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MetalGoal_userId_idx" ON "MetalGoal"("userId");

-- AddForeignKey
ALTER TABLE "MetalGoal" ADD CONSTRAINT "MetalGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
