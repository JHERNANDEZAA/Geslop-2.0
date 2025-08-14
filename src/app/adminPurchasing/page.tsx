
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/lib/auth';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { saveAdminCatalog } from '@/lib/catalogs';
import { useToast } from '@/hooks/use-toast';
import type { CatalogAdmin } from '@/lib/types';

const catalogSchema = z.object({
  id: z.string().min(1, 'El ID del catálogo es requerido'),
  description: z.string().min(1, 'La descripción es requerida'),
  validFrom: z.date({ required_error: 'La fecha de inicio es requerida' }),
  validTo: z.date({ required_error: 'La fecha de fin es requerida' }),
  status: z.enum(['unlocked', 'locked'], { required_error: 'El estado es requerido' }),
  type: z.enum(['C', 'T'], { required_error: 'El tipo es requerido' }),
  numDays: z.coerce.number().min(0, 'Debe ser mayor o igual a 0'),
  salesOrg: z.string().min(1, 'La organización de ventas es requerida'),
  purchaseGroup: z.string().min(1, 'El grupo de compras es requerido'),
  maxAnticipationDays: z.coerce.number().min(0, 'Debe ser mayor o igual a 0'),
  minAnticipationDays: z.coerce.number().min(0, 'Debe ser mayor o igual a 0'),
});


export default function AdminPurchasingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof catalogSchema>>({
    resolver: zodResolver(catalogSchema),
    defaultValues: {
      id: '',
      description: '',
      status: 'unlocked',
      type: 'C',
      numDays: 0,
      salesOrg: '',
      purchaseGroup: '',
      maxAnticipationDays: 0,
      minAnticipationDays: 0,
    }
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);
  
  const onSubmit = async (values: z.infer<typeof catalogSchema>) => {
    try {
      const catalogData: CatalogAdmin = {
        ...values,
        validFrom: format(values.validFrom, 'dd-MM-yyyy'),
        validTo: format(values.validTo, 'dd-MM-yyyy'),
      };
      
      const result = await saveAdminCatalog(catalogData);

      if (result.success) {
        toast({
          title: "Catálogo Guardado",
          description: `El catálogo "${values.description}" ha sido guardado correctamente.`,
          variant: "default",
          className: "bg-accent text-accent-foreground"
        });
        form.reset();
      } else {
        // If the ID already exists, result.message will contain the error string.
        form.setError("id", {
          type: "manual",
          message: result.message,
        });
      }
    } catch (error: any) {
        // This will now only catch other errors, like permission issues.
         toast({
          title: "Error al guardar el catálogo",
          description: error.message || "No se pudo guardar el catálogo. Revise los permisos o inténtelo de nuevo.",
          variant: 'destructive',
        });
    }
  };

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
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          <FormField
                            control={form.control}
                            name="id"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>ID del catálogo</FormLabel>
                                <FormControl>
                                  <Input placeholder="Ej: CAT001" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Descripción del catálogo</FormLabel>
                                <FormControl>
                                  <Input placeholder="Ej: Catálogo de Bebidas Verano" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="validFrom"
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel>Fecha inicio de validez</FormLabel>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant={"outline"}
                                        className={cn(
                                          "w-full justify-start text-left font-normal",
                                          !field.value && "text-muted-foreground"
                                        )}
                                      >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {field.value ? format(field.value, "dd-MM-yyyy") : <span>Seleccione una fecha</span>}
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0">
                                    <Calendar
                                      mode="single"
                                      selected={field.value}
                                      onSelect={field.onChange}
                                      initialFocus
                                      locale={es}
                                    />
                                  </PopoverContent>
                                </Popover>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                           <FormField
                            control={form.control}
                            name="validTo"
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel>Fecha fin de validez</FormLabel>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant={"outline"}
                                        className={cn(
                                          "w-full justify-start text-left font-normal",
                                          !field.value && "text-muted-foreground"
                                        )}
                                      >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {field.value ? format(field.value, "dd-MM-yyyy") : <span>Seleccione una fecha</span>}
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0">
                                    <Calendar
                                      mode="single"
                                      selected={field.value}
                                      onSelect={field.onChange}
                                      initialFocus
                                      locale={es}
                                    />
                                  </PopoverContent>
                                </Popover>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Estado</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Seleccione un estado" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="unlocked">Desbloqueado</SelectItem>
                                    <SelectItem value="locked">Bloqueado</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                           <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tipo de catálogo</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Seleccione un tipo" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="C">C: Compras</SelectItem>
                                    <SelectItem value="T">T: Traspaso</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="numDays"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Número de días</FormLabel>
                                <FormControl>
                                  <Input type="number" min="0" placeholder="Ej: 30" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="salesOrg"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Organización de ventas</FormLabel>
                                <FormControl>
                                  <Input placeholder="Ej: 1000" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="purchaseGroup"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Grupo de compras</FormLabel>
                                <FormControl>
                                  <Input placeholder="Ej: 001" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="maxAnticipationDays"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Días de anticipación máxima</FormLabel>
                                <FormControl>
                                  <Input type="number" min="0" placeholder="Ej: 90" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="minAnticipationDays"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Días de anticipación mínimos</FormLabel>
                                <FormControl>
                                  <Input type="number" min="0" placeholder="Ej: 1" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-end">
                          <Button type="submit" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting ? "Creando..." : "Crear Catálogo"}
                          </Button>
                      </CardFooter>
                    </form>
                  </Form>
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