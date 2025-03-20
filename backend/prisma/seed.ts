import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.user.deleteMany({});

  console.log('Seeding database...');

  // Create users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'john.doe@example.com',
        name: 'John Doe',
      },
    }),
    prisma.user.create({
      data: {
        email: 'jane.smith@example.com',
        name: 'Jane Smith',
      },
    }),
    prisma.user.create({
      data: {
        email: 'robert.johnson@example.com',
        name: 'Robert Johnson',
      },
    }),
    prisma.user.create({
      data: {
        email: 'emily.wilson@example.com',
        name: 'Emily Wilson',
      },
    }),
    prisma.user.create({
      data: {
        email: 'michael.brown@example.com',
        name: null,
      },
    }),
  ]);

  console.log(`Created ${users.length} users`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 