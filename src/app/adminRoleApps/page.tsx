
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Role, AppDefinition } from '@/lib/types';
import { getAllRoles, updateRoleApps } from '@/lib/roles';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Save } from 'lucide-react';

const availableApps: AppDefinition[] = [
    { id: '/purchaseRequisition', name: 'Solicitud de productos', description: 'Permite a los usuarios crear y gestionar solicitudes de productos.' },
    { id: '/adminPurchasing', name: 'Administración de compras', description: 'Permite gestionar catálogos, familias y destinatarios.' },
    { id: '/adminRoles', name: 'Administración de Roles', description: 'Permite crear y gestionar los roles de usuario.' },
    { id: '/adminRoleApps', name: 'Asignación de Aplicaciones', description: 'Permite asignar aplicaciones a los diferentes roles.' },
];

export default function AdminRoleAppsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [assignedApps, setAssignedApps] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const fetchRoles = async () => {
    setIsLoading(true);
    try {
      const allRoles = await getAllRoles();
      setRoles(allRoles);
      // Initialize assignedApps state from fetched roles
      const initialAssignedApps: Record<string, string[]> = {};
      allRoles.forEach(role => {
        initialAssignedApps[role.id] = role.apps || [];
      });
      setAssignedApps(initialAssignedApps);
    } catch (error: any) {
      toast({
        title: "Error al cargar roles",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
      fetchRoles();
  }, [])

  const handleCheckboxChange = (roleId: string, appId: string, checked: boolean | 'indeterminate') => {
    setAssignedApps(prev => {
        const currentApps = prev[roleId] || [];
        if (checked) {
            return { ...prev, [roleId]: [...currentApps, appId] };
        } else {
            return { ...prev, [roleId]: currentApps.filter(id => id !== appId) };
        }
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
        await Promise.all(
            Object.entries(assignedApps).map(([roleId, appIds]) => 
                updateRoleApps(roleId, appIds)
            )
        );
        toast({
            title: "Guardado Correctamente",
            description: "Las asignaciones de aplicaciones a roles han sido actualizadas.",
            variant: "default",
            className: "bg-accent text-accent-foreground"
        });
    } catch (error: any) {
        toast({
            title: "Error al guardar",
            description: error.message,
            variant: "destructive",
        });
    } finally {
        setIsSaving(false);
    }
  };


  if (loading || !user || isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <PageHeader />
        <main className="flex-grow p-6">
          <div className="space-y-4">
            <Skeleton className="h-12 w-1/3" />
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PageHeader />
      <main className="flex-grow flex flex-col p-6">
        <Card>
            <CardHeader>
                <CardTitle>Asignación de Aplicaciones a Roles</CardTitle>
                <CardDescription>
                    Seleccione las aplicaciones a las que cada rol tendrá acceso. Los cambios se guardarán para todos los roles al hacer clic en el botón Guardar.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="font-bold text-lg text-foreground w-[250px]">Rol</TableHead>
                                {availableApps.map(app => (
                                    <TableHead key={app.id} className="text-center">{app.name}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {roles.map((role) => (
                                <TableRow key={role.id}>
                                    <TableCell className="font-medium">{role.name}</TableCell>
                                    {availableApps.map(app => (
                                        <TableCell key={app.id} className="text-center">
                                            <Checkbox
                                                id={`checkbox-${role.id}-${app.id}`}
                                                checked={(assignedApps[role.id] || []).includes(app.id)}
                                                onCheckedChange={(checked) => handleCheckboxChange(role.id, app.id, checked)}
                                                aria-label={`Asignar ${app.name} a ${role.name}`}
                                            />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
            <CardFooter className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving}>
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? "Guardando..." : "Guardar Cambios"}
                </Button>
            </CardFooter>
        </Card>
      </main>
    </div>
  );
}
