const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const users = [
    { name: "Alice Johnson", email: "alice@example.com", balance: 12500 },
    { name: "Bob Smith", email: "bob@example.com", balance: 8300 },
    { name: "Carol White", email: "carol@example.com", balance: 15200 },
    { name: "David Brown", email: "david@example.com", balance: 6750 },
    { name: "Eva Martinez", email: "eva@example.com", balance: 20100 },
  ];

  const password = await bcrypt.hash("password123", 10);

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, password },
    });
  }

  // Add some demo transactions between users
  const allUsers = await prisma.user.findMany();
  if (allUsers.length >= 3) {
    const txs = [
      { senderId: allUsers[0].id, receiverId: allUsers[1].id, amount: 250, note: "Lunch money" },
      { senderId: allUsers[2].id, receiverId: allUsers[0].id, amount: 500, note: "Rent split" },
      { senderId: allUsers[1].id, receiverId: allUsers[3].id, amount: 120, note: "Movie tickets" },
      { senderId: allUsers[4].id, receiverId: allUsers[0].id, amount: 1000, note: "Project payment" },
      { senderId: allUsers[0].id, receiverId: allUsers[4].id, amount: 75, note: "Coffee" },
      { senderId: allUsers[3].id, receiverId: allUsers[2].id, amount: 330, note: "Utilities" },
    ];

    const existing = await prisma.transaction.count();
    if (existing === 0) {
      for (const tx of txs) {
        await prisma.transaction.create({ data: tx });
      }
    }
  }

  console.log("Database seeded successfully!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
