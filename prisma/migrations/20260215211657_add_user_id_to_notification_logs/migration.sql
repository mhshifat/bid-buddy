-- AlterTable
ALTER TABLE "notification_logs" ADD COLUMN     "user_id" TEXT;

-- CreateIndex
CREATE INDEX "notification_logs_user_id_idx" ON "notification_logs"("user_id");
