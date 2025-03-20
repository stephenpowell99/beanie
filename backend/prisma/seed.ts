import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

async function main() {
  try {
    // Clear existing data
    // We need to delete in the correct order due to foreign key constraints
    console.log('Cleaning database...');
    
    // Use try/catch for each deletion in case tables don't exist yet
    try {
      await prisma.$executeRaw`TRUNCATE TABLE "Account" CASCADE;`;
    } catch (e) {
      console.log('Account table may not exist yet');
    }
    
    try {
      await prisma.$executeRaw`TRUNCATE TABLE "Session" CASCADE;`;
    } catch (e) {
      console.log('Session table may not exist yet');
    }
    
    try {
      await prisma.$executeRaw`TRUNCATE TABLE "User" CASCADE;`;
    } catch (e) {
      console.log('User table may not exist yet');
    }

    console.log('Seeding database...');

    // Create users with passwords
    const admin = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        name: 'Admin User',
        password: await hashPassword('password123'),
        emailVerified: new Date(),
      },
    });
    
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        password: await hashPassword('password123'),
        emailVerified: new Date(),
      },
    });
    
    const demoUser = await prisma.user.create({
      data: {
        email: 'demo@example.com',
        name: 'Demo Account',
        password: await hashPassword('demo1234'),
        emailVerified: new Date(),
      },
    });
    
    // Create a user with Google OAuth
    const googleUser = await prisma.user.create({
      data: {
        email: 'google.user@example.com',
        name: 'Google User',
        emailVerified: new Date(),
        accounts: {
          create: {
            type: 'oauth',
            provider: 'google',
            providerAccountId: 'google-mock-id-12345',
          }
        }
      },
    });
    
    // Create a user with Microsoft OAuth
    const microsoftUser = await prisma.user.create({
      data: {
        email: 'microsoft.user@example.com',
        name: 'Microsoft User',
        emailVerified: new Date(),
        accounts: {
          create: {
            type: 'oauth',
            provider: 'microsoft',
            providerAccountId: 'microsoft-mock-id-12345',
          }
        }
      },
    });

    console.log('Database seeded successfully!');
    console.log('=============================');
    console.log('You can now log in with:');
    console.log('Email: admin@example.com / Password: password123');
    console.log('Email: test@example.com / Password: password123');
    console.log('Email: demo@example.com / Password: demo1234');
    
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 