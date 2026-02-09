const { PrismaMariaDb} = require('@prisma/adapter-mariadb');
const { PrismaClient } = require('../generated/prisma/client');

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  connectionLimit: 5
});
const prisma = new PrismaClient({ adapter });
prisma.$connect().then(()=>{
  console.log("Connected to database")
}).catch(err=>{
  console.error("Error connecting to database",err)
})
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

module.exports = { prisma }