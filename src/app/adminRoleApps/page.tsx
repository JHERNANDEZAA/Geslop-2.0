
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
import { getAllRoles, updateRoleApps, updateRoleAdministrator } from '@/lib/roles';
import { getAllApps } from '@/lib/apps';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Save } from 'lucide-react';
import { Label } from '@/components/ui/label';


export default function AdminRoleAppsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [roles, setRoles] = useState<Role[]>([]);
  const [availableApps, setAvailableApps] = useState<AppDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [assignedApps, setAssignedApps] = useState<Record<string, string[]>>({});
  const [adminRoles, setAdminRoles] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [allRoles, allApps] = await Promise.all([
        getAllRoles(),
        getAllApps()
      ]);
      
      setRoles(allRoles);
      setAvailableApps(allApps);
      
      const initialAssignedApps: Record<string, string[]> = {};
      const initialAdminRoles: Record<string, boolean> = {};
      
      allRoles.forEach(role => {
        initialAssignedApps[role.id] = role.apps || [];
        initialAdminRoles[role.id] = role.isAdministrator || false;
      });

      setAssignedApps(initialAssignedApps);
      setAdminRoles(initialAdminRoles);

    } catch (error: any) {
      toast({
        title: "Error al cargar datos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
      fetchInitialData();
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

  const handleAdminSwitchChange = (roleId: string, isAdministrator: boolean) => {
    setAdminRoles(prev => ({ ...prev, [roleId]: isAdministrator }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
        const rolesToUpdate = roles.map(role => {
            const isAdministrator = adminRoles[role.id];
            const appIds = isAdministrator ? [] : (assignedApps[role.id] || []);
            return {
                roleId: role.id,
                isAdministrator: isAdministrator,
                appIds: appIds
            };
        });

        await Promise.all(
            rolesToUpdate.map(roleUpdate => Promise.all([
                updateRoleAdministrator(roleUpdate.roleId, roleUpdate.isAdministrator),
                updateRoleApps(roleUpdate.roleId, roleUpdate.appIds)
            ]))
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
                                <TableHead className="w-[350px]">Rol</TableHead>
                                {availableApps.map(app => (
                                    <TableHead key={app.id} className="text-center">{app.name}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {roles.map((role) => {
                                const isAdministrator = adminRoles[role.id];
                                const roleApps = isAdministrator ? availableApps.map(a => a.id) : (assignedApps[role.id] || []);

                                return (
                                <TableRow key={role.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col gap-2">
                                            <div className="font-bold">{role.name}</div>
                                            <div className="text-xs text-muted-foreground">{role.description}</div>
                                            <div className="flex items-center space-x-2 pt-2">
                                                <Switch
                                                    id={`admin-switch-${role.id}`}
                                                    checked={isAdministrator}
                                                    onCheckedChange={(checked) => handleAdminSwitchChange(role.id, checked)}
                                                    aria-label={`Marcar ${role.name} como administrador`}
                                                />
                                                <Label htmlFor={`admin-switch-${role.id}`}>Administrador</Label>
                                            </div>
                                        </div>
                                    </TableCell>
                                    {availableApps.map(app => {
                                        return (
                                            <TableCell key={`${app.id}-${role.id}`} className="text-center">
                                                <Checkbox
                                                    id={`checkbox-${role.id}-${app.id}`}
                                                    checked={roleApps.includes(app.id)}
                                                    onCheckedChange={(checked) => handleCheckboxChange(role.id, app.id, checked)}
                                                    aria-label={`Asignar ${app.name} a ${role.name}`}
                                                    disabled={isAdministrator}
                                                />
                                            </TableCell>
                                        )
                                    })}
                                </TableRow>
                            )})}
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
