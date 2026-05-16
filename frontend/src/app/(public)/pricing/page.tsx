import type { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Pricing',
};

const plans = [
  {
    name: 'Starter',
    price: 'From $99',
    features: ['Single assignment', '7-day delivery', '1 revision'],
  },
  {
    name: 'Standard',
    price: 'From $249',
    features: ['Research paper', '14-day delivery', '2 revisions'],
  },
  {
    name: 'Premium',
    price: 'Custom',
    features: ['Thesis / dissertation', 'Dedicated manager', 'Unlimited chat'],
  },
];

export default function PricingPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-center text-3xl font-bold">Pricing Plans</h1>
      <div className="mt-12 grid gap-8 md:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.name}>
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <p className="text-2xl font-semibold text-primary">{plan.price}</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {plan.features.map((f) => (
                  <li key={f}>• {f}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
