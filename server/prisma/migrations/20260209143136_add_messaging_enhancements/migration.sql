-- AlterTable
ALTER TABLE "ChatGroup" ADD COLUMN     "batchId" TEXT,
ADD COLUMN     "groupType" TEXT NOT NULL DEFAULT 'group';

-- AddForeignKey
ALTER TABLE "ChatGroup" ADD CONSTRAINT "ChatGroup_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
