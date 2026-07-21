import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";
import { config } from "dotenv";

import { PrismaClient } from "../src/generated/prisma/client";

config({ path: ".env.local" });

/**
 * Foundation seed data: 1 Admin, 2 Owner, 2 Renter — per
 * docs/database-design.md §5. Item/Booking/Payment/Review seed data is out
 * of scope until those Prisma models exist (tracked separately in
 * docs/todo/backend.md).
 */
const BCRYPT_COST_FACTOR = 12;

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function hash(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST_FACTOR);
}

async function main() {
  const seedUsers = [
    {
      name: "Admin Utama",
      email: "admin@rentalsewa.test",
      password: "Admin123!",
      role: "ADMIN" as const,
      phone: "081100000001",
    },
    {
      name: "Budi Santoso",
      email: "budi.owner@rentalsewa.test",
      password: "Owner123!",
      role: "OWNER" as const,
      phone: "081100000002",
    },
    {
      name: "Dewi Lestari",
      email: "dewi.owner@rentalsewa.test",
      password: "Owner123!",
      role: "OWNER" as const,
      phone: "081100000003",
    },
    {
      name: "Siti Aminah",
      email: "siti.renter@rentalsewa.test",
      password: "Renter123!",
      role: "RENTER" as const,
      phone: "081100000004",
    },
    {
      name: "Andi Wijaya",
      email: "andi.renter@rentalsewa.test",
      password: "Renter123!",
      role: "RENTER" as const,
      phone: "081100000005",
    },
  ];

  for (const seedUser of seedUsers) {
    const passwordHash = await hash(seedUser.password);

    await prisma.user.upsert({
      where: { email: seedUser.email },
      update: {},
      create: {
        name: seedUser.name,
        email: seedUser.email,
        passwordHash,
        role: seedUser.role,
        phone: seedUser.phone,
      },
    });
  }

  console.log(`Seeded ${seedUsers.length} users.`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
