-- AlterTable
ALTER TABLE "AssignmentSubmission" ADD COLUMN "deletedAt" DATETIME;

-- AlterTable
ALTER TABLE "LearningResource" ADD COLUMN "deletedAt" DATETIME;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Assignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "maxMarks" INTEGER NOT NULL DEFAULT 100,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdById" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    CONSTRAINT "Assignment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Assignment_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Assignment" ("batchId", "createdAt", "createdById", "description", "dueDate", "id", "maxMarks", "title", "updatedAt") SELECT "batchId", "createdAt", "createdById", "description", "dueDate", "id", "maxMarks", "title", "updatedAt" FROM "Assignment";
DROP TABLE "Assignment";
ALTER TABLE "new_Assignment" RENAME TO "Assignment";
CREATE INDEX "Assignment_createdById_idx" ON "Assignment"("createdById");
CREATE INDEX "Assignment_batchId_idx" ON "Assignment"("batchId");
CREATE INDEX "Assignment_createdAt_idx" ON "Assignment"("createdAt");
CREATE INDEX "Assignment_status_idx" ON "Assignment"("status");
CREATE TABLE "new_Meeting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mentorshipId" TEXT NOT NULL,
    "meetingDate" DATETIME NOT NULL,
    "duration" INTEGER NOT NULL,
    "discussionSummary" TEXT,
    "feedback" TEXT,
    "remarks" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    CONSTRAINT "Meeting_mentorshipId_fkey" FOREIGN KEY ("mentorshipId") REFERENCES "Mentorship" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Meeting" ("createdAt", "discussionSummary", "duration", "feedback", "id", "meetingDate", "mentorshipId", "remarks") SELECT "createdAt", "discussionSummary", "duration", "feedback", "id", "meetingDate", "mentorshipId", "remarks" FROM "Meeting";
DROP TABLE "Meeting";
ALTER TABLE "new_Meeting" RENAME TO "Meeting";
CREATE INDEX "Meeting_mentorshipId_idx" ON "Meeting"("mentorshipId");
CREATE INDEX "Meeting_meetingDate_idx" ON "Meeting"("meetingDate");
CREATE INDEX "Meeting_status_idx" ON "Meeting"("status");
CREATE TABLE "new_Mentorship" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mentorId" TEXT NOT NULL,
    "menteeId" TEXT NOT NULL,
    "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    CONSTRAINT "Mentorship_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Mentorship_menteeId_fkey" FOREIGN KEY ("menteeId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Mentorship" ("assignedAt", "id", "menteeId", "mentorId") SELECT "assignedAt", "id", "menteeId", "mentorId" FROM "Mentorship";
DROP TABLE "Mentorship";
ALTER TABLE "new_Mentorship" RENAME TO "Mentorship";
CREATE INDEX "Mentorship_mentorId_idx" ON "Mentorship"("mentorId");
CREATE INDEX "Mentorship_menteeId_idx" ON "Mentorship"("menteeId");
CREATE INDEX "Mentorship_assignedAt_idx" ON "Mentorship"("assignedAt");
CREATE INDEX "Mentorship_status_idx" ON "Mentorship"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "AssignmentSubmission_assignmentId_idx" ON "AssignmentSubmission"("assignmentId");

-- CreateIndex
CREATE INDEX "AssignmentSubmission_studentId_idx" ON "AssignmentSubmission"("studentId");

-- CreateIndex
CREATE INDEX "AssignmentSubmission_status_idx" ON "AssignmentSubmission"("status");

-- CreateIndex
CREATE INDEX "LearningResource_uploadedById_idx" ON "LearningResource"("uploadedById");

-- CreateIndex
CREATE INDEX "LearningResource_createdAt_idx" ON "LearningResource"("createdAt");

-- CreateIndex
CREATE INDEX "LearningResource_type_idx" ON "LearningResource"("type");
