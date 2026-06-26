-- CreateTable
CREATE TABLE "AuthVerificationCode" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "payload" JSONB,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthVerificationCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AuthVerificationCode_tokenHash_key" ON "AuthVerificationCode"("tokenHash");

-- CreateIndex
CREATE INDEX "AuthVerificationCode_email_purpose_idx" ON "AuthVerificationCode"("email", "purpose");
