-- AlterTable
ALTER TABLE "LearningResource" ADD COLUMN     "batchId" TEXT,
ADD COLUMN     "type" TEXT;

-- AddForeignKey
ALTER TABLE "LearningResource" ADD CONSTRAINT "LearningResource_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
