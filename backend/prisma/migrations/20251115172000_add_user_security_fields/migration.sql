-- Migration: Campos de segurança e auditoria em User

ALTER TABLE "User"
    ADD COLUMN "email_verified_at" TIMESTAMP(3),
    ADD COLUMN "last_login_at" TIMESTAMP(3),
    ADD COLUMN "last_password_change_at" TIMESTAMP(3),
    ADD COLUMN "failed_attempts" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "locked_until" TIMESTAMP(3);


