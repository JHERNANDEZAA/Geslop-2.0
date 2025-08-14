
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/lib/auth';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { saveAdminCatalog, searchAdminCatalogs, deleteAdminCatalog } from '@/lib/catalogs';
import { useToast } from '@/hooks/use-toast';
import type { CatalogAdmin } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const catalogSchema = z.object({
  id: z.string().min(1, 'El ID del catálogo es requerido'),
  description: z.string().min(1, 'La descripción es requerida'),
  validFrom: z.date({ required_error: 'La fecha de inicio es requerida' }),
  validTo: z.date({ required_error: 'La fecha de fin es requerida' }),
  status: z.enum(['unlocked', 'locked'], { required_error: 'El estado es requerido' }),
  type: z.enum(['C', 'T'], { required_error: 'El tipo es requerido' }),
  numDays: z.coerce.number().min(1, 'El número de días es requerido y debe ser mayor que 0'),
  salesOrg: z.string().min(1, 'La organización de ventas es requerida'),
  purchaseGroup: z.string().min(1, 'El grupo de compras es requerido'),
  maxAnticipationDays: z.coerce.number().min(0, 'Los días de anticipación máxima son requeridos'),
  minAnticipationDays: z.coerce.number().min(0, 'Los días de anticipación mínimos son requeridos'),
});

const searchSchema = z.object({
  id: z.string().optional(),
  description: z.string().optional(),
  purchaseGroup: z.string().optional(),
  type: z.enum(['', 'C', 'T']).optional(),
  salesOrg: z.string().optional(),
});


export default function AdminPurchasingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [searchResults, setSearchResults] = useState<CatalogAdmin[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [catalogToDelete, setCatalogToDelete] = useState<CatalogAdmin | null>(null);

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
  
  const searchForm = useForm<z.infer<typeof searchSchema>>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
        id: '',
        description: '',
        purchaseGroup: '',
        type: '',
        salesOrg: '',
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
        toast({
          title: "Error al guardar",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
         toast({
          title: "Error al guardar el catálogo",
          description: error.message || "No se pudo guardar el catálogo. Revise los permisos o inténtelo de nuevo.",
          variant: 'destructive',
        });
    }
  };
  
  const onSearch = async (values: z.infer<typeof searchSchema>) => {
      setIsSearching(true);
      try {
        const results = await searchAdminCatalogs(values);
        setSearchResults(results);
        if (results.length === 0) {
             toast({
                title: "Búsqueda sin resultados",
                description: "No se encontraron catálogos con los filtros especificados.",
                variant: "default",
            });
        }
      } catch (error: any) {
           toast({
                title: "Error en la búsqueda",
                description: error.message || "Ocurrió un error al realizar la búsqueda.",
                variant: "destructive",
            });
      } finally {
          setIsSearching(false);
      }
  }
  
  const handleDeleteCatalog = async () => {
    if (!catalogToDelete) return;

    try {
        await deleteAdminCatalog(catalogToDelete.id);
        toast({
            title: "Catálogo Eliminado",
            description: `El catálogo "${catalogToDelete.description}" ha sido eliminado.`,
            variant: "default",
        });
        setSearchResults(prev => prev.filter(c => c.id !== catalogToDelete.id));
    } catch (error: any) {
        toast({
            title: "Error al eliminar",
            description: error.message || "Ocurrió un error al eliminar el catálogo.",
            variant: "destructive",
        });
    } finally {
        setCatalogToDelete(null);
    }
  }


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
      <main className="flex-grow flex flex-col">
        <Card className="shadow-none rounded-none border-x-0 border-t-0 border-b-0">
          <CardHeader>
            <CardTitle>Administración de compras</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="catalog-management" className="w-full">
              <TabsList className="inline-flex h-auto rounded-lg bg-muted p-1 text-muted-foreground">
                <TabsTrigger value="catalog-management" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Gestión de catálogos</TabsTrigger>
                <TabsTrigger value="catalog-assignment" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Asignación de catálogos a familias</TabsTrigger>
                <TabsTrigger value="catalog-recipient-assignment" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Asignación de catálogos a destinatarios</TabsTrigger>
              </TabsList>
              <TabsContent value="catalog-management">
                <Card className="mt-4">
                    <CardHeader>
                        <CardTitle className="text-xl">Gestión de catálogos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="creation" className="w-full">
                            <TabsList className="inline-flex">
                                <TabsTrigger value="creation" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Creación</TabsTrigger>
                                <TabsTrigger value="search" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Búsqueda</TabsTrigger>
                            </TabsList>
                            <TabsContent value="creation">
                                <Card className="mt-4">
                                    <CardHeader>
                                        <CardTitle className="text-lg">Creación de catálogos</CardTitle>
                                    </CardHeader>
                                    <Form {...form}>
                                        <form onSubmit={form.handleSubmit(onSubmit)}>
                                        <CardContent className="pt-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            <FormField
                                                control={form.control}
                                                name="id"
                                                render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>ID del catálogo *</FormLabel>
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
                                                    <FormLabel>Descripción del catálogo *</FormLabel>
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
                                                    <FormLabel>Fecha inicio de validez *</FormLabel>
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
                                                    <FormLabel>Fecha fin de validez *</FormLabel>
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
                                                    <FormLabel>Estado *</FormLabel>
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
                                                    <FormLabel>Tipo de catálogo *</FormLabel>
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
                                                    <FormLabel>Número de días *</FormLabel>
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
                                                    <FormLabel>Organización de ventas *</FormLabel>
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
                                                    <FormLabel>Grupo de compras *</FormLabel>
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
                                                    <FormLabel>Días de anticipación máxima *</FormLabel>
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
                                                    <FormLabel>Días de anticipación mínimos *</FormLabel>
                                                    <FormControl>
                                                    <Input type="number" min="0" placeholder="Ej: 1" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                                )}
                                            />
                                            </div>
                                        </CardContent>
                                        <CardFooter className="flex justify-start">
                                            <Button type="submit" disabled={form.formState.isSubmitting} className="bg-accent text-accent-foreground hover:bg-accent/90">
                                                {form.formState.isSubmitting ? "Creando..." : "Crear catálogo"}
                                            </Button>
                                        </CardFooter>
                                        </form>
                                    </Form>
                                </Card>
                            </TabsContent>
                            <TabsContent value="search">
                                <Card className="mt-4">
                                    <CardHeader className="p-4">
                                        <CardTitle className="text-lg">Búsqueda de Catálogos</CardTitle>
                                        <CardDescription>
                                        Utilice los filtros para buscar catálogos existentes.
                                        </CardDescription>
                                    </CardHeader>
                                    <Form {...searchForm}>
                                        <form onSubmit={searchForm.handleSubmit(onSearch)}>
                                        <CardContent className="space-y-4 p-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                <FormField
                                                    control={searchForm.control}
                                                    name="id"
                                                    render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>ID del catálogo</FormLabel>
                                                        <FormControl>
                                                        <Input placeholder="Filtrar por ID" {...field} />
                                                        </FormControl>
                                                    </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={searchForm.control}
                                                    name="description"
                                                    render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Descripción del catálogo</FormLabel>
                                                        <FormControl>
                                                        <Input placeholder="Filtrar por descripción" {...field} />
                                                        </FormControl>
                                                    </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={searchForm.control}
                                                    name="purchaseGroup"
                                                    render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Grupo de compras</FormLabel>
                                                        <FormControl>
                                                        <Input placeholder="Filtrar por grupo de compras" {...field} />
                                                        </FormControl>
                                                    </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={searchForm.control}
                                                    name="type"
                                                    render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Tipo de catálogo</FormLabel>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                <SelectValue placeholder="Filtrar por tipo" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="">Todos</SelectItem>
                                                                <SelectItem value="C">C: Compras</SelectItem>
                                                                <SelectItem value="T">T: Traspaso</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={searchForm.control}
                                                    name="salesOrg"
                                                    render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Organización de ventas</FormLabel>
                                                        <FormControl>
                                                        <Input placeholder="Filtrar por org. ventas" {...field} />
                                                        </FormControl>
                                                    </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </CardContent>
                                        <CardFooter className="flex justify-start p-4">
                                            <Button type="submit" disabled={isSearching} className="bg-primary text-primary-foreground hover:bg-primary/90">
                                                {isSearching ? "Buscando..." : "Filtrar"}
                                            </Button>
                                        </CardFooter>
                                        </form>
                                    </Form>

                                    {searchResults.length > 0 && (
                                    <div className="mt-6">
                                        <Card className="border-0 shadow-none">
                                            <CardHeader className="p-4 pt-0">
                                                <CardTitle className="text-base font-medium">Catálogos</CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-4 pt-0">
                                                <div className="rounded-md border">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead className="w-10"></TableHead>
                                                                <TableHead>ID</TableHead>
                                                                <TableHead>Descripción</TableHead>
                                                                <TableHead>Tipo</TableHead>
                                                                <TableHead>Estado</TableHead>
                                                                <TableHead>Válido Desde</TableHead>
                                                                <TableHead>Válido Hasta</TableHead>
                                                                <TableHead>Días</TableHead>
                                                                <TableHead>Grupo Compras</TableHead>
                                                                <TableHead>Org. Ventas</TableHead>
                                                                <TableHead>Ant. Mín.</TableHead>
                                                                <TableHead>Ant. Máx.</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {searchResults.map((catalog) => (
                                                                <TableRow key={catalog.id} className="odd:bg-muted/50">
                                                                    <TableCell>
                                                                        <AlertDialog>
                                                                            <AlertDialogTrigger asChild>
                                                                                <Button variant="ghost" size="icon" onClick={() => setCatalogToDelete(catalog)}>
                                                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                                                </Button>
                                                                            </AlertDialogTrigger>
                                                                        </AlertDialog>
                                                                    </TableCell>
                                                                    <TableCell>{catalog.id}</TableCell>
                                                                    <TableCell>{catalog.description}</TableCell>
                                                                    <TableCell>{catalog.type}</TableCell>
                                                                    <TableCell>{catalog.status === 'locked' ? 'Bloqueado' : 'Desbloqueado'}</TableCell>
                                                                    <TableCell>{catalog.validFrom}</TableCell>
                                                                    <TableCell>{catalog.validTo}</TableCell>
                                                                    <TableCell>{catalog.numDays}</TableCell>
                                                                    <TableCell>{catalog.purchaseGroup}</TableCell>
                                                                    <TableCell>{catalog.salesOrg}</TableCell>
                                                                    <TableCell>{catalog.minAnticipationDays}</TableCell>
                                                                    <TableCell>{catalog.maxAnticipationDays}</TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                    )}

                                </Card>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="catalog-assignment">
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-xl">Asignación de catálogos a familias</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>Página en construcción</p>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="catalog-recipient-assignment">
                <Card className="mt-4">
                    <CardHeader>
                        <CardTitle className="text-xl">Asignación de catálogos a destinatarios</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>Página en construcción</p>
                    </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        {catalogToDelete && (
            <AlertDialog open={!!catalogToDelete} onOpenChange={(open) => !open && setCatalogToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Está seguro que desea eliminar este catálogo?</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div>
                                <span>Esta acción no se puede deshacer. Se eliminará permanentemente el siguiente catálogo:</span>
                                <div className="mt-4 space-y-2 text-sm text-foreground bg-muted/50 p-4 rounded-md">
                                    <p><strong>ID:</strong> {catalogToDelete.id}</p>
                                    <p><strong>Descripción:</strong> {catalogToDelete.description}</p>
                                    <p><strong>Tipo:</strong> {catalogToDelete.type === 'C' ? 'Compras' : 'Traspaso'}</p>
                                    <p><strong>Estado:</strong> {catalogToDelete.status === 'locked' ? 'Bloqueado' : 'Desbloqueado'}</p>
                                    <p><strong>Válido Desde:</strong> {catalogToDelete.validFrom}</p>
                                    <p><strong>Válido Hasta:</strong> {catalogToDelete.validTo}</p>
                                    <p><strong>Grupo Compras:</strong> {catalogToDelete.purchaseGroup}</p>
                                    <p><strong>Org. Ventas:</strong> {catalogToDelete.salesOrg}</p>
                                </div>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setCatalogToDelete(null)}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteCatalog} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        )}

      </main>
    </div>
  );
}

    