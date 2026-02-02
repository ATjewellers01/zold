-- CreateTable
CREATE TABLE "GoldGift" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "recipientName" TEXT NOT NULL,
    "recipientPhone" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "goldGrams" DOUBLE PRECISION NOT NULL,
    "message" TEXT,
    "occasion" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoldGift_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GoldGift_senderId_idx" ON "GoldGift"("senderId");

-- AddForeignKey
ALTER TABLE "GoldGift" ADD CONSTRAINT "GoldGift_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
