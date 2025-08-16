
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getAllHardcodedApps, getAppsFromDB, saveApp, deleteApp } from '@/lib/apps';
import type { AppDefinition, App } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function AdminAppsPage() {
  const [hardcodedApps, setHardcodedApps] = useState<AppDefinition[]>([]);
  const [dbApps, setDbApps] = useState<App[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [appToDelete, setAppToDelete] = useState<App | null>(null);
  const { toast } = useToast();

  const fetchApps = async () => {
    setIsLoading(true);
    try {
      const [codedApps, databaseApps] = await Promise.all([
        getAllHardcodedApps(),
        getAppsFromDB()
      ]);
      setHardcodedApps(codedApps.sort((a, b) => a.name.localeCompare(b.name)));
      setDbApps(databaseApps.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error: any) {
      toast({
        title: "Error al cargar aplicaciones",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const handleAddToDb = async (appDef: AppDefinition) => {
    setIsSaving(true);
    try {
      const appToSave: App = {
        id: appDef.route.replace(/\//g, '-').substring(1), // Create a safe ID from route
        name: appDef.name,
        description: appDef.description,
        iconName: (appDef.icon as any).displayName || 'AppWindow', 
        isAdmin: appDef.isAdmin || false,
        route: appDef.route,
      };
      await saveApp(appToSave);
      toast({
        title: "Aplicación añadida",
        description: `La aplicación "${appDef.name}" ha sido añadida a la base de datos.`,
        variant: "default",
        className: "bg-accent text-accent-foreground"
      });
      await fetchApps();
    } catch (error: any) {
      toast({
        title: "Error al añadir la aplicación",
        description: error.message || 'No se pudo guardar la aplicación.',
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDelete = async () => {
    if (!appToDelete) return;
    setIsSaving(true);
    try {
        await deleteApp(appToDelete.id);
        toast({
            title: "Aplicación eliminada",
            description: `La aplicación "${appToDelete.name}" ha sido eliminada.`,
            variant: "default"
        });
        await fetchApps();
    } catch(error: any) {
        toast({
            title: "Error al eliminar",
            description: error.message,
            variant: "destructive",
        });
    } finally {
        setIsSaving(false);
        setAppToDelete(null);
    }
  }

  const isAppInDb = (appRoute: string) => {
    return dbApps.some(dbApp => dbApp.route === appRoute);
  };
  
  const isInconsistent = (appRoute: string) => {
    return !hardcodedApps.some(hApp => hApp.route === appRoute);
  };


  return (
    <Tabs defaultValue="inconsistencies">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="management">Gestión de Aplicaciones</TabsTrigger>
        <TabsTrigger value="inconsistencies">Informe de Incoherencias</TabsTrigger>
      </TabsList>
      <TabsContent value="management">
        <div className="flex flex-col gap-6">
            <AlertDialog>
              <Card>
                  <CardHeader><CardTitle>Aplicaciones en Base de Datos</CardTitle></CardHeader>
                  <CardContent>
                    {isLoading ? <Skeleton className="h-48 w-full" /> : (
                      <div className="rounded-md border">
                          <Table>
                              <TableHeader>
                                  <TableRow>
                                      <TableHead>Nombre</TableHead>
                                      <TableHead>Ruta</TableHead>
                                      <TableHead>Es Admin</TableHead>
                                      <TableHead className="text-right">Acciones</TableHead>
                                  </TableRow>
                              </TableHeader>
                              <TableBody>
                                  {dbApps.map((app) => (
                                      <TableRow key={app.id}>
                                          <TableCell className="font-medium flex flex-col">
                                            {app.name}
                                            {isInconsistent(app.route) && <Badge variant="destructive" className="w-fit mt-1">Inconsistente</Badge>}
                                          </TableCell>
                                          <TableCell>{app.route}</TableCell>
                                          <TableCell>{app.isAdmin ? 'Sí' : 'No'}</TableCell>
                                          <TableCell className="text-right space-x-2">
                                              <AlertDialogTrigger asChild>
                                                  <Button variant="destructive" size="icon" onClick={() => setAppToDelete(app)}><Trash2 className="h-4 w-4" /></Button>
                                              </AlertDialogTrigger>
                                          </TableCell>
                                      </TableRow>
                                  ))}
                              </TableBody>
                          </Table>
                      </div>
                    )}
                  </CardContent>
              </Card>
               {appToDelete && (
                  <AlertDialogContent>
                      <AlertDialogHeader>
                          <AlertDialogTitle>¿Está seguro que desea eliminar esta aplicación?</AlertDialogTitle>
                          <AlertDialogDescription>
                              Esta acción no se puede deshacer y eliminará permanentemente la aplicación <span className="font-bold">{appToDelete.name}</span>.
                          </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                      </AlertDialogFooter>
                  </AlertDialogContent>
              )}
            </AlertDialog>
        </div>
      </TabsContent>
      <TabsContent value="inconsistencies">
        <Card>
            <CardHeader>
            <CardTitle>Informe de Incoherencias</CardTitle>
            <CardDescription>
                Esta tabla muestra las aplicaciones definidas en el código. Puede detectar si falta alguna en la base de datos y añadirla.
            </CardDescription>
            </CardHeader>
            <CardContent>
            {isLoading ? <Skeleton className="h-48 w-full" /> : (
                <div className="rounded-md border">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Ruta</TableHead>
                        <TableHead>Estado en BBDD</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {hardcodedApps.map((app) => (
                        <TableRow key={app.id}>
                        <TableCell className="font-medium">{app.name}</TableCell>
                        <TableCell className="text-muted-foreground">{app.route}</TableCell>
                        <TableCell>
                            {isAppInDb(app.route) ? (
                            <Badge variant="default" className="bg-green-600">En BBDD</Badge>
                            ) : (
                            <Badge variant="secondary">No en BBDD</Badge>
                            )}
                        </TableCell>
                        <TableCell className="text-right">
                            <Button
                            onClick={() => handleAddToDb(app)}
                            disabled={isAppInDb(app.route) || !!isSaving}
                            size="sm"
                            >
                            {isSaving ? 'Añadiendo...' : 'Añadir a BBDD'}
                            </Button>
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
                </div>
            )}
            </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
