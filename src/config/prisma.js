const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

globalThis.__truckconnectPrisma = prisma;

async function connectDB() {
  try {
    await prisma.$connect();
    console.log("✅ Connected to Neon PostgreSQL Database");
  } catch (error) {
    console.error("❌ Database connection failed");
    console.error(error);
    process.exit(1);
  }
}

async function disconnectDB() {
  await prisma.$disconnect();
}

// ✅ Keep this export
module.exports = {
  prisma,
  connectDB,
  disconnectDB,
};
