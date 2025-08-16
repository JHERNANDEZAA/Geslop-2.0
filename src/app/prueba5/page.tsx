"use client";

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Prueba5Page() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PageHeader />
      <main className="flex-grow p-4">
        <Card>
          <CardHeader>
            <CardTitle>Prueba5</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Página en construcción</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
