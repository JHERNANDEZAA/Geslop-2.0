
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getAllHardcodedApps, getAppsFromDB, saveApp, deleteApp } from '@/lib/apps';
import type { AppDefinition, App } from '@/lib/types';
import { Trash2, PlusCircle } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

type CombinedApp = {
  id: string;
  name: string;
  description: string;
  route: string;
  isAdmin: boolean;
  iconName: string;
  inCode: boolean;
  inDb: boolean;
};

export default function AdminAppsPage() {
  const [combinedApps, setCombinedApps] = useState<CombinedApp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [appToDelete, setAppToDelete] = useState<CombinedApp | null>(null);
  const { toast } = useToast();

  const fetchApps = async () => {
    setIsLoading(true);
    try {
      const [codedApps, databaseApps] = await Promise.all([
        getAllHardcodedApps(),
        getAppsFromDB()
      ]);

      const appsMap = new Map<string, CombinedApp>();

      // Process hardcoded apps
      codedApps.forEach(app => {
        appsMap.set(app.route, {
          id: app.id,
          name: app.name,
          description: app.description,
          route: app.route,
          isAdmin: app.isAdmin || false,
          iconName: (app.icon as any)?.displayName || 'AppWindow',
          inCode: true,
          inDb: false // Assume not in DB until checked
        });
      });

      // Process database apps and merge
      databaseApps.forEach(dbApp => {
        if (appsMap.has(dbApp.route)) {
          // App exists in both code and DB
          const existing = appsMap.get(dbApp.route)!;
          existing.inDb = true;
          existing.id = dbApp.id; // Use DB id
        } else {
          // App exists only in DB (inconsistent)
          appsMap.set(dbApp.route, {
            ...dbApp,
            inCode: false,
            inDb: true
          });
        }
      });
      
      const sortedApps = Array.from(appsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
      setCombinedApps(sortedApps);

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

  const handleAddToDb = async (appDef: CombinedApp) => {
    setIsSaving(true);
    try {
      const appToSave: App = {
        id: appDef.id,
        name: appDef.name,
        description: appDef.description,
        iconName: appDef.iconName,
        isAdmin: appDef.isAdmin,
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
  
  const getStatus = (app: CombinedApp): { text: string; variant: "default" | "secondary" | "destructive" } => {
      if (app.inDb && !app.inCode) return { text: "Inconsistente", variant: "destructive" };
      if (app.inDb) return { text: "En BBDD", variant: "default" };
      return { text: "No en BBDD", variant: "secondary" };
  }

  return (
    <AlertDialog>
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Aplicaciones</CardTitle>
          <CardDescription>
            Este informe unificado muestra todas las aplicaciones definidas en el código y las que se encuentran en la base de datos. 
            Permite añadir, eliminar y detectar incoherencias.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? <Skeleton className="h-64 w-full" /> : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Ruta</TableHead>
                    <TableHead>Origen</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {combinedApps.map((app) => {
                    const status = getStatus(app);
                    return (
                      <TableRow key={app.route}>
                        <TableCell className="font-medium">{app.name}</TableCell>
                        <TableCell className="text-muted-foreground">{app.route}</TableCell>
                        <TableCell>
                          {app.inCode && app.inDb ? "Ambos" : app.inCode ? "Código" : "Base de Datos"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant} className={status.variant === 'default' ? 'bg-green-600' : ''}>
                            {status.text}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          {app.inCode && !app.inDb && (
                            <Button
                              onClick={() => handleAddToDb(app)}
                              disabled={isSaving}
                              size="sm"
                              variant="outline"
                            >
                              <PlusCircle className="mr-2 h-4 w-4" />
                              {isSaving ? 'Añadiendo...' : 'Añadir a BBDD'}
                            </Button>
                          )}
                          {app.inDb && (
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="icon" onClick={() => setAppToDelete(app)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
              Esta acción no se puede deshacer y eliminará permanentemente la aplicación <span className="font-bold">{appToDelete.name}</span> de la base de datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      )}
    </AlertDialog>
  );
}

