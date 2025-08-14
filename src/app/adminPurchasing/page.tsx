
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminPurchasingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <PageHeader />
        <main className="flex-grow p-4">
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PageHeader />
      <main className="flex-grow p-6">
        <Card>
          <CardHeader>
            <CardTitle>Administración de compras</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="catalog-management" className="w-full">
              <TabsList className="inline-flex h-auto rounded-lg bg-muted p-1 text-muted-foreground">
                <TabsTrigger value="catalog-management" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Gestión de catálogos</TabsTrigger>
                <TabsTrigger value="catalog-assignment" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Asignación de catálogos a familias</TabsTrigger>
              </TabsList>
              <TabsContent value="catalog-management">
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle>Gestión de catálogos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>Página en construcción</p>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="catalog-assignment">
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle>Asignación de catálogos a familias</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>Página en construcción</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
