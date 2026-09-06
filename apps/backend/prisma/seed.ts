import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

// Load env variables from parent directory of prisma (apps/backend/.env)
dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with categories, buyers, and order history...');

  // 1. Clear existing data safely
  await (prisma as any).order?.deleteMany({});
  await (prisma as any).buyer?.deleteMany({});
  await (prisma as any).category?.deleteMany({});

  // 2. Create Categories
  const categorySparkling = await (prisma as any).category.create({
    data: {
      name: 'Sparkling Beverages',
      slug: 'sparkling-beverages',
    },
  });

  const categoryJuices = await (prisma as any).category.create({
    data: {
      name: 'Natural Juices',
      slug: 'natural-juices',
    },
  });

  const categoryEnergy = await (prisma as any).category.create({
    data: {
      name: 'Energy & Health Drinks',
      slug: 'energy-health-drinks',
    },
  });

  console.log('Created categories.');

  // 3. Create Sample Buyers
  const buyer1 = await (prisma as any).buyer.create({
    data: {
      name: 'Metro Hypermarket Ltd',
      email: 'procurement@metro-hypermarket.com',
      phone: '+1 555-019-2831',
      address: '742 Evergreen Terrace, Sector 4, Springfield',
      status: 'ACTIVE',
      categoryId: categorySparkling.id,
    },
  });

  const buyer2 = await (prisma as any).buyer.create({
    data: {
      name: 'Pacific Coast Distributors',
      email: 'orders@pacificdistributors.com',
      phone: '+1 555-014-9922',
      address: '108 Ocean Boulevard, Suite 500, San Diego, CA',
      status: 'ACTIVE',
      categoryId: categoryJuices.id,
    },
  });

  const buyer3 = await (prisma as any).buyer.create({
    data: {
      name: 'Apex Retail Chain',
      email: 'supplies@apexretail.org',
      phone: '+1 555-018-7741',
      address: '420 Madison Avenue, New York, NY',
      status: 'ACTIVE',
      categoryId: categoryEnergy.id,
    },
  });

  const buyer4 = await (prisma as any).buyer.create({
    data: {
      name: 'Blue Horizon Grocers',
      email: 'contact@bluehorizongrocers.com',
      phone: '+1 555-012-3456',
      address: '15 Harbor Way, Seattle, WA',
      status: 'ACTIVE',
      categoryId: categorySparkling.id,
    },
  });

  console.log('Created sample buyers.');

  // 4. Create Sample Orders
  const now = new Date();
  const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const sampleOrders = [
    {
      buyerId: buyer1.id,
      buyerName: buyer1.name,
      quantity: 120,
      amount: 1440.00,
      description: '120 cases of Lemon-Lime Sparkling Soda (24-pack)',
      orderDate: daysAgo(1),
      status: 'COMPLETED',
    },
    {
      buyerId: buyer1.id,
      buyerName: buyer1.name,
      quantity: 80,
      amount: 1040.00,
      description: '80 cases of Wild Berry Fizz (500ml glass bottles)',
      orderDate: daysAgo(12),
      status: 'COMPLETED',
    },
    {
      buyerId: buyer2.id,
      buyerName: buyer2.name,
      quantity: 250,
      amount: 3750.00,
      description: '250 cartons of 100% Organic Cold-Pressed Orange Juice',
      orderDate: daysAgo(3),
      status: 'COMPLETED',
    },
    {
      buyerId: buyer2.id,
      buyerName: buyer2.name,
      quantity: 150,
      amount: 2250.00,
      description: '150 cartons of Tropical Passion Mango Nectar',
      orderDate: daysAgo(18),
      status: 'COMPLETED',
    },
    {
      buyerId: buyer3.id,
      buyerName: buyer3.name,
      quantity: 500,
      amount: 6500.00,
      description: '500 packs of Nitro Boost Electrolite Drink (12-can packs)',
      orderDate: daysAgo(5),
      status: 'COMPLETED',
    },
    {
      buyerId: buyer3.id,
      buyerName: buyer3.name,
      quantity: 300,
      amount: 3900.00,
      description: '300 packs of Zero Sugar Focus Berry Elixir',
      orderDate: daysAgo(25),
      status: 'COMPLETED',
    },
    {
      buyerId: buyer4.id,
      buyerName: buyer4.name,
      quantity: 90,
      amount: 1125.00,
      description: '90 cases of Ginger Mint Craft Soda',
      orderDate: daysAgo(7),
      status: 'PENDING',
    },
    {
      buyerId: null,
      buyerName: 'Sunrise Hospitality Group',
      quantity: 60,
      amount: 900.00,
      description: '60 cartons of Blood Orange Sparkling Splash (Walk-in order)',
      orderDate: daysAgo(2),
      status: 'COMPLETED',
    },
  ];

  for (const order of sampleOrders) {
    await (prisma as any).order.create({
      data: order,
    });
  }

  console.log(`Successfully seeded ${sampleOrders.length} orders!`);

  // 5. Create Sample Tasks
  await (prisma as any).task?.deleteMany({});

  const sampleTasks = [
    {
      title: 'Restock Lemon-Lime Sparkling Soda inventory',
      description: 'Warehouse A is down to 40 cases. Coordinate with bottling plant for a 500-case restock batch.',
      status: 'TODO',
      priority: 'HIGH',
      dueDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Send quarterly wholesale invoice to Pacific Coast Distributors',
      description: 'Reconcile March shipments and email final signed commercial invoice with net-30 terms.',
      status: 'IN_PROGRESS',
      priority: 'URGENT',
      dueDate: new Date(now.getTime() + 12 * 60 * 60 * 1000),
    },
    {
      title: 'Inspect cold storage unit temperature sensors',
      description: 'Routine maintenance check on refrigeration sensors in Bay 3 and Bay 4.',
      status: 'TODO',
      priority: 'MEDIUM',
      dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Follow up with Metro Hypermarket on summer promo catalog',
      description: 'Confirm SKU listings and promotional retail endcap placement for July release.',
      status: 'COMPLETED',
      priority: 'HIGH',
      dueDate: daysAgo(1),
    },
    {
      title: 'Review supplier ingredient certifications for Organic Orange Juice',
      description: 'Audit organic compliance certificates and lot tracking records for Florida citrus vendors.',
      status: 'COMPLETED',
      priority: 'LOW',
      dueDate: daysAgo(4),
    },
  ];

  for (const task of sampleTasks) {
    await (prisma as any).task.create({
      data: task,
    });
  }

  console.log(`Successfully seeded ${sampleTasks.length} tasks!`);
}

main()
  .catch((e) => {
    console.error('Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
