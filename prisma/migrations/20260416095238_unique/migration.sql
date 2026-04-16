/*
  Warnings:

  - A unique constraint covering the columns `[sip_id,user_id]` on the table `UserSip` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "UserSip_sip_id_user_id_key" ON "UserSip"("sip_id", "user_id");
