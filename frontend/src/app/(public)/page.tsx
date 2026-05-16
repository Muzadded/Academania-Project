import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { siteConfig } from '@/config/site';

export default function HomePage() {
  return (
    <>
      <section className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
          Expert Academic Support, Delivered On Time
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          {siteConfig.description}
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Button size="lg" asChild>
            <Link href="/order">Submit Your Project</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/book-meeting">Book a Consultation</Link>
          </Button>
        </div>
      </section>

      <section className="bg-muted/40 py-20">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold">Our Services</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {['Thesis Writing', 'Research Papers', 'Data Analysis'].map((title) => (
              <Card key={title}>
                <CardHeader>
                  <CardTitle>{title}</CardTitle>
                  <CardDescription>
                    Professional support tailored to your academic goals.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="link" className="px-0" asChild>
                    <Link href="/services">Learn more</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
