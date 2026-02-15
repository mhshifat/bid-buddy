-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('DESKTOP', 'SMS', 'WHATSAPP', 'IN_APP');

-- CreateTable
CREATE TABLE "alert_preferences" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "auto_scan_enabled" BOOLEAN NOT NULL DEFAULT false,
    "scan_interval_minutes" INTEGER NOT NULL DEFAULT 10,
    "min_match_percentage" INTEGER NOT NULL DEFAULT 80,
    "categories" TEXT[],
    "target_skills" TEXT[],
    "channels" "NotificationChannel"[],
    "desktop_enabled" BOOLEAN NOT NULL DEFAULT false,
    "push_subscription" JSONB,
    "sms_enabled" BOOLEAN NOT NULL DEFAULT false,
    "sms_phone_number" TEXT,
    "sms_country_code" TEXT,
    "sms_verified" BOOLEAN NOT NULL DEFAULT false,
    "whatsapp_enabled" BOOLEAN NOT NULL DEFAULT false,
    "whatsapp_phone_number" TEXT,
    "whatsapp_country_code" TEXT,
    "whatsapp_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alert_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "job_id" TEXT,
    "channel" "NotificationChannel" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "match_percentage" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error_message" TEXT,
    "correlation_id" TEXT,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "alert_preferences_user_id_key" ON "alert_preferences"("user_id");

-- CreateIndex
CREATE INDEX "alert_preferences_tenant_id_idx" ON "alert_preferences"("tenant_id");

-- CreateIndex
CREATE INDEX "notification_logs_tenant_id_idx" ON "notification_logs"("tenant_id");

-- CreateIndex
CREATE INDEX "notification_logs_job_id_idx" ON "notification_logs"("job_id");

-- CreateIndex
CREATE INDEX "notification_logs_created_at_idx" ON "notification_logs"("created_at");

-- AddForeignKey
ALTER TABLE "alert_preferences" ADD CONSTRAINT "alert_preferences_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_preferences" ADD CONSTRAINT "alert_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
