
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getAllHardcodedApps, getAppsFromDB, saveApp } from '@/lib/apps';
import type { AppDefinition, App } from '@/lib/types';

export default function AdminAppsPage() {
  const [hardcodedApps, setHardcodedApps] = useState<AppDefinition[]>([]);
  const [dbApps, setDbApps] = useState<App[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchApps = async () => {
    setIsLoading(true);
    try {
      const [codedApps, databaseApps] = await Promise.all([
        getAllHardcodedApps(),
        getAppsFromDB()
      ]);
      setHardcodedApps(codedApps);
      setDbApps(databaseApps);
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

  const handleAddToDb = async (app: AppDefinition) => {
    setIsSaving(app.id);
    try {
      const appToSave: App = {
        id: app.route,
        name: app.name,
        description: app.description,
        iconName: app.icon.displayName || 'AppWindow', 
        isAdmin: app.isAdmin || false,
        route: app.route,
      };
      await saveApp(appToSave);
      toast({
        title: "Aplicación añadida",
        description: `La aplicación "${app.name}" ha sido añadida a la base de datos.`,
        variant: "default",
        className: "bg-accent text-accent-foreground"
      });
      // Refresh the list of apps from the database
      fetchApps();
    } catch (error: any) {
      toast({
        title: "Error al añadir la aplicación",
        description: error.message || 'No se pudo guardar la aplicación.',
        variant: "destructive",
      });
    } finally {
      setIsSaving(null);
    }
  };

  const isAppInDb = (appId: string) => {
    return dbApps.some(dbApp => dbApp.id === appId);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Aplicaciones</CardTitle>
          <CardDescription>Cargando aplicaciones...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestión de Aplicaciones</CardTitle>
        <CardDescription>
          Esta tabla muestra todas las aplicaciones definidas en el código de la aplicación.
          Puedes añadirlas a la base de datos para que puedan ser gestionadas y asignadas a roles.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Ruta</TableHead>
                <TableHead>Es Admin</TableHead>
                <TableHead className="text-center">Estado en BBDD</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hardcodedApps.map((app) => (
                <TableRow key={app.id}>
                  <TableCell className="font-medium">{app.name}</TableCell>
                  <TableCell>{app.description}</TableCell>
                  <TableCell className="text-muted-foreground">{app.route}</TableCell>
                  <TableCell>{app.isAdmin ? 'Sí' : 'No'}</TableCell>
                  <TableCell className="text-center">
                    {isAppInDb(app.id) ? (
                      <Badge variant="default" className="bg-green-600">En BBDD</Badge>
                    ) : (
                      <Badge variant="secondary">No en BBDD</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      onClick={() => handleAddToDb(app)}
                      disabled={isAppInDb(app.id) || isSaving === app.id}
                      size="sm"
                    >
                      {isSaving === app.id ? 'Añadiendo...' : 'Añadir a BBDD'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
