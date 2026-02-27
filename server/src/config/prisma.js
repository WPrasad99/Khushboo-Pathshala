/**
 * Singleton PrismaClient instance.
 * All controllers MUST import from here instead of creating new PrismaClient().
 * Prevents connection pool exhaustion and SQLite SQLITE_BUSY errors.
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

module.exports = prisma;
