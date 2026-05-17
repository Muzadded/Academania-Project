-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'CLIENT');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('RECEIVED', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING_REVIEW', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "MeetingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ORDER_STATUS', 'PAYMENT', 'MESSAGE', 'MEETING', 'SYSTEM');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'CLIENT',
    "googleId" TEXT,
    "refreshToken" TEXT,
    "resetToken" TEXT,
    "resetExpires" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_inquiries" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "referenceNumber" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'RECEIVED',
    "clientName" TEXT NOT NULL,
    "university" TEXT NOT NULL,
    "budget" DECIMAL(12,2) NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "requirementFileUrl" TEXT,
    "revisionNote" TEXT,
    "clientId" TEXT,
    "serviceId" TEXT NOT NULL,
    "assigneeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_status_history" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_slots" (
    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "clientName" TEXT NOT NULL,
    "clientEmail" TEXT NOT NULL,
    "preferredAt" TIMESTAMP(3) NOT NULL,
    "priority" INTEGER NOT NULL,
    "status" "MeetingStatus" NOT NULL DEFAULT 'PENDING',
    "meetingLink" TEXT,
    "notes" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meeting_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deliverables" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "uploadedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deliverables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "method" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "screenshotUrl" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "metadata" JSONB,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "services_slug_key" ON "services"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "orders_referenceNumber_key" ON "orders"("referenceNumber");

-- CreateIndex
CREATE INDEX "orders_clientId_idx" ON "orders"("clientId");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "orders_deadline_idx" ON "orders"("deadline");

-- CreateIndex
CREATE INDEX "order_status_history_orderId_idx" ON "order_status_history"("orderId");

-- CreateIndex
CREATE INDEX "meeting_slots_orderId_idx" ON "meeting_slots"("orderId");

-- CreateIndex
CREATE INDEX "meeting_slots_status_idx" ON "meeting_slots"("status");

-- CreateIndex
CREATE INDEX "deliverables_orderId_idx" ON "deliverables"("orderId");

-- CreateIndex
CREATE INDEX "payments_orderId_idx" ON "payments"("orderId");

-- CreateIndex
CREATE INDEX "messages_orderId_idx" ON "messages"("orderId");

-- CreateIndex
CREATE INDEX "notifications_userId_readAt_idx" ON "notifications"("userId", "readAt");

-- AddForeignKey
ALTER TABLE "password_reset_logs" ADD CONSTRAINT "password_reset_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_slots" ADD CONSTRAINT "meeting_slots_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliverables" ADD CONSTRAINT "deliverables_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
