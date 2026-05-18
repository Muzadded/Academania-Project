import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const services = [
  {
    slug: 'thesis-writing',
    title: 'Thesis Writing',
    description: 'End-to-end thesis support from proposal to final submission.',
    icon: 'book-open',
    sortOrder: 1,
  },
  {
    slug: 'research-paper',
    title: 'Research Paper',
    description: 'Original research papers with literature review and methodology.',
    icon: 'file-text',
    sortOrder: 2,
  },
  {
    slug: 'assignment-help',
    title: 'Assignment Help',
    description: 'Course assignments across disciplines with on-time delivery.',
    icon: 'clipboard-list',
    sortOrder: 3,
  },
  {
    slug: 'dissertation',
    title: 'Dissertation',
    description: 'PhD and masters dissertation chapters and full document support.',
    icon: 'graduation-cap',
    sortOrder: 4,
  },
  {
    slug: 'proofreading',
    title: 'Proofreading & Editing',
    description: 'Academic editing, formatting, and plagiarism checks.',
    icon: 'pen-line',
    sortOrder: 5,
  },
  {
    slug: 'data-analysis',
    title: 'Data Analysis',
    description: 'SPSS, R, Python statistical analysis and interpretation.',
    icon: 'bar-chart',
    sortOrder: 6,
  },
];

async function main() {
  const adminPassword = await bcrypt.hash('Admin@12345', 10);

  await prisma.user.upsert({
    where: { email: 'admin@academania.com' },
    update: { passwordHash: adminPassword },
    create: {
      name: 'Admin User',
      email: 'admin@academania.com',
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
    },
  });

  for (const service of services) {
    await prisma.service.upsert({
      where: { slug: service.slug },
      update: service,
      create: service,
    });
  }

  console.log('Seed completed: admin user + services');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
