const { PrismaMariaDb} = require('@prisma/adapter-mariadb');
const { PrismaClient } = require('../generated/prisma/client');

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  port: process.env.DATABASE_PORT,
  connectionLimit: 5
});
const prisma = new PrismaClient({ adapter });

async function connectDatabase() {
  await prisma.$connect();
  await prisma.$queryRaw`SELECT 1`;
  console.log("Connected to database");
}

// Handle disconnect by reconnecting
prisma.$on('error', async (err) => {
  console.error('Database error:', err);
  if (err.code === 'ECONNREFUSED') {
    console.log('Attempting to reconnect to the database...');
    try {
      await prisma.$connect();
      console.log('Reconnected to the database successfully!');
    } catch (reconnectErr) {
      console.error('Error reconnecting to the database:', reconnectErr);
    }
  }
});

module.exports = { prisma, connectDatabase }