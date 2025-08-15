"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Role, UserProfile } from '@/lib/types';
import { getAllRoles } from '@/lib/roles';
import { getAllUsers, updateUserRoles, createProfileForUser } from '@/lib/users';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Save, Users } from 'lucide-react';
import { getAllAuthUsers, UserRecord } from '@/app/actions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";


type CombinedUser = {
  auth: UserRecord;
  profile: UserProfile | null;
};

export default function AdminUserRolesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [combinedUsers, setCombinedUsers] = useState<CombinedUser[]>([]);
  const [assignedRoles, setAssignedRoles] = useState<Record<string, string[]>>({});
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<string | boolean>(false);
  const [isFetching, setIsFetching] = useState(false);
  
  const [userToManage, setUserToManage] = useState<CombinedUser | null>(null);
  const [rolesForManagedUser, setRolesForManagedUser] = useState<string[]>([]);


  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const fetchAllRoles = async () => {
    setIsLoading(true);
    try {
      const roles = await getAllRoles();
      setAllRoles(roles.filter(role => role.isActive));
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
    fetchAllRoles();
  }, []);

  const handleFetchUsers = async () => {
    setIsFetching(true);
    try {
        const [authUsers, firestoreUsers] = await Promise.all([
            getAllAuthUsers(),
            getAllUsers(),
        ]);
        
        const firestoreUsersMap = new Map(firestoreUsers.map(u => [u.uid, u]));

        const combined: CombinedUser[] = authUsers.map(authUser => ({
            auth: authUser,
            profile: firestoreUsersMap.get(authUser.uid) || null,
        }));
        
        setCombinedUsers(combined);
        // We no longer set assignedRoles here, as it's managed inside the dialog

    } catch (error: any) {
        toast({
            title: "Error al cargar usuarios",
            description: error.message,
            variant: "destructive",
        });
    } finally {
        setIsFetching(false);
    }
  };

  const openRoleManager = (user: CombinedUser) => {
    setUserToManage(user);
    setRolesForManagedUser(user.profile?.roles || []);
  };

  const closeRoleManager = () => {
    setUserToManage(null);
    setRolesForManagedUser([]);
  };

  const handleRoleChange = (roleId: string, checked: boolean | 'indeterminate') => {
    if (typeof checked !== 'boolean') return;
    setRolesForManagedUser(prev => {
        if (checked) {
            return [...prev, roleId];
        } else {
            return prev.filter(id => id !== roleId);
        }
    });
  };

  const handleSaveChanges = async () => {
    if (!userToManage) return;

    setIsSaving(userToManage.auth.uid);
    try {
      if (userToManage.profile) {
        // User exists, update roles
        await updateUserRoles(userToManage.auth.uid, rolesForManagedUser);
        toast({
            title: "Roles actualizados",
            description: `Los roles para ${userToManage.auth.email} han sido guardados.`,
            variant: "default",
            className: "bg-accent text-accent-foreground",
        });
      } else {
        // User does not have a profile, create it
        await createProfileForUser(userToManage.auth.uid, userToManage.auth.email!, rolesForManagedUser);
        toast({
            title: "Perfil Creado",
            description: `El perfil para ${userToManage.auth.email} ha sido creado con los roles seleccionados.`,
            variant: "default",
        });
      }
      // Refetch all users to update the UI
      handleFetchUsers();
    } catch (error: any) {
         toast({
            title: "Error al guardar",
            description: error.message,
            variant: "destructive",
        });
    } finally {
        setIsSaving(false);
        closeRoleManager();
    }
  };


  if (loading || isLoading) {
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
                <CardTitle>Asignación de Roles a Usuarios</CardTitle>
                <CardDescription>
                    Cargue todos los usuarios del sistema para ver y administrar sus roles. Los usuarios de la autenticación que no tengan un perfil en la base de datos se pueden crear desde aquí.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <Button onClick={handleFetchUsers} disabled={isFetching}>
                    <Users className="mr-2 h-4 w-4" />
                    {isFetching ? "Cargando..." : "Cargar todos los usuarios"}
                </Button>
            </CardContent>

            {combinedUsers.length > 0 && (
                <CardContent className="mt-6 border-t pt-6">
                    <CardTitle className="text-xl mb-4">Usuarios del sistema</CardTitle>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[250px]">Email</TableHead>
                                    <TableHead>Roles Asignados</TableHead>
                                    <TableHead className="text-right w-[200px]">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {combinedUsers.map((combinedUser) => (
                                    <TableRow key={combinedUser.auth.uid}>
                                        <TableCell className="font-medium">{combinedUser.auth.email}</TableCell>
                                        <TableCell>
                                            {combinedUser.profile ? (
                                                <span className="text-sm text-foreground">
                                                {combinedUser.profile.roles.length > 0
                                                    ? combinedUser.profile.roles.map(roleId => allRoles.find(r => r.id === roleId)?.name || roleId).join(', ')
                                                    : <span className="text-muted-foreground italic">Sin roles asignados</span>
                                                }
                                                </span>
                                            ) : (
                                                <span className="text-sm text-muted-foreground">Perfil no creado en la base de datos</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" onClick={() => openRoleManager(combinedUser)}>
                                                Asignar Roles
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            )}
        </Card>
        
        {userToManage && (
            <AlertDialog open={!!userToManage} onOpenChange={(open) => !open && closeRoleManager()}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Asignar roles para {userToManage.auth.email}</AlertDialogTitle>
                        <AlertDialogDescription>
                            Seleccione los roles para este usuario. Al guardar, se {userToManage.profile ? 'actualizarán sus permisos' : 'creará su perfil en la base de datos'}.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                        {allRoles.map(role => (
                            <div key={role.id} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`manage-role-${role.id}`}
                                    checked={rolesForManagedUser.includes(role.id)}
                                    onCheckedChange={(checked) => handleRoleChange(role.id, checked)}
                                />
                                <Label htmlFor={`manage-role-${role.id}`}>{role.name}</Label>
                            </div>
                        ))}
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={closeRoleManager}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleSaveChanges} disabled={isSaving === userToManage.auth.uid}>
                            {isSaving === userToManage.auth.uid ? "Guardando..." : "Guardar Cambios"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        )}

      </main>
    </div>
  );
}
