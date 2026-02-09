-- CreateTable
CREATE TABLE "AnnouncementBatch" (
    "id" TEXT NOT NULL,
    "announcementId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnnouncementBatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AnnouncementBatch_announcementId_batchId_key" ON "AnnouncementBatch"("announcementId", "batchId");

-- AddForeignKey
ALTER TABLE "AnnouncementBatch" ADD CONSTRAINT "AnnouncementBatch_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "Announcement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementBatch" ADD CONSTRAINT "AnnouncementBatch_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
