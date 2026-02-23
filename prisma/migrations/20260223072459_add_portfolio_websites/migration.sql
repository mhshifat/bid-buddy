-- CreateTable
CREATE TABLE "portfolio_websites" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "label" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portfolio_websites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "portfolio_websites_tenant_id_idx" ON "portfolio_websites"("tenant_id");

-- AddForeignKey
ALTER TABLE "portfolio_websites" ADD CONSTRAINT "portfolio_websites_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
