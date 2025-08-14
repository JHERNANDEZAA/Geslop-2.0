
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function AdminPurchasingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

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
                    <form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="catalog-id">ID del catálogo</Label>
                        <Input id="catalog-id" placeholder="Ej: CAT001" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="catalog-description">Descripción del catálogo</Label>
                        <Input id="catalog-description" placeholder="Ej: Catálogo de Bebidas Verano" />
                      </div>
                      <div className="space-y-2">
                        <Label>Fecha inicio de validez</Label>
                         <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !startDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {startDate ? format(startDate, "dd-MM-yyyy") : <span>Seleccione una fecha</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={startDate}
                              onSelect={setStartDate}
                              initialFocus
                              locale={es}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                       <div className="space-y-2">
                        <Label>Fecha fin de validez</Label>
                         <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !endDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {endDate ? format(endDate, "dd-MM-yyyy") : <span>Seleccione una fecha</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={endDate}
                              onSelect={setEndDate}
                              initialFocus
                              locale={es}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="status">Estado</Label>
                        <Select>
                          <SelectTrigger id="status">
                            <SelectValue placeholder="Seleccione un estado" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unlocked">Desbloqueado</SelectItem>
                            <SelectItem value="locked">Bloqueado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="catalog-type">Tipo de catálogo</Label>
                        <Select>
                          <SelectTrigger id="catalog-type">
                            <SelectValue placeholder="Seleccione un tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="C">C: Compras</SelectItem>
                            <SelectItem value="T">T: Traspaso</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="num-days">Número de días</Label>
                        <Input id="num-days" type="number" min="0" placeholder="Ej: 30" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sales-org">Organización de ventas</Label>
                        <Input id="sales-org" placeholder="Ej: 1000" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="purchase-group">Grupo de compras</Label>
                        <Input id="purchase-group" placeholder="Ej: 001" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="max-anticipation">Días de anticipación máxima</Label>
                        <Input id="max-anticipation" type="number" min="0" placeholder="Ej: 90" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="min-anticipation">Días de anticipación mínimos</Label>
                        <Input id="min-anticipation" type="number" min="0" placeholder="Ej: 1" />
                      </div>
                    </form>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                      <Button>Crear Catálogo</Button>
                  </CardFooter>
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
