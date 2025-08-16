"use client";

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Prueba3Page() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PageHeader />
      <main className="flex-grow p-4">
        <Card>
          <CardHeader>
            <CardTitle>Prueba 3</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Esta es la página de Prueba 3.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
