export const siteConfig = {
  name: 'Academania',
  description:
    'Academic project and research services platform — thesis, dissertations, assignments, and more.',
  url: process.env.NEXTAUTH_URL ?? 'http://localhost:3000',
  links: {
    contact: '/contact',
    order: '/order',
    login: '/login',
    dashboard: '/dashboard',
    admin: '/admin',
  },
} as const;
