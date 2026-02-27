const fs = require('fs');

function updateSchema() {
  const schemaPath = 'server/prisma/schema.prisma';
  let schema = fs.readFileSync(schemaPath, 'utf8');

  // Add soft delete and indexes to LearningResource
  schema = schema.replace(
    /model LearningResource \{([\s\S]*?)\n\}/g,
    `model LearningResource {$1\n  deletedAt     DateTime?\n  @@index([uploadedById])\n  @@index([createdAt])\n  @@index([type])\n}`
  );

  // Add soft delete and indexes to Mentorship
  schema = schema.replace(
    /model Mentorship \{([\s\S]*?)\n\}/g,
    `model Mentorship {$1\n  deletedAt     DateTime?\n  status        String   @default("ACTIVE")\n  @@index([mentorId])\n  @@index([menteeId])\n  @@index([assignedAt])\n}`
  );

  // Add soft delete and indexes to Meeting
  schema = schema.replace(
    /model Meeting \{([\s\S]*?)\n\}/g,
    `model Meeting {$1\n  deletedAt     DateTime?\n  status        String   @default("SCHEDULED")\n  @@index([mentorshipId])\n  @@index([meetingDate])\n}`
  );

  // Assignment
  schema = schema.replace(
    /model Assignment \{([\s\S]*?)\n\}/g,
    `model Assignment {$1\n  deletedAt     DateTime?\n  status        String   @default("ACTIVE")\n  @@index([createdById])\n  @@index([batchId])\n  @@index([createdAt])\n}`
  );

  // AssignmentSubmission
  const hasIndex = schema.indexOf('@@index([assignmentId])') !== -1;
  if (!hasIndex) {
    schema = schema.replace(
      /model AssignmentSubmission \{([\s\S]*?)(@@unique\[\[assignmentId, studentId\]\])\n\}/g,
      `model AssignmentSubmission {$1$2\n  deletedAt     DateTime?\n  @@index([assignmentId])\n  @@index([studentId])\n  @@index([status])\n}`
    );
  }

  // Session
  schema = schema.replace(
    /model Session \{([\s\S]*?)\n\}/g,
    `model Session {$1\n  deletedAt     DateTime?\n  @@index([scheduledAt])\n}`
  );

  fs.writeFileSync(schemaPath, schema);
}

updateSchema();
