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
import { getAllAuthUsers } from '@/app/actions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { UserRecord } from 'firebase-admin/auth';

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
  
  const [userToCreate, setUserToCreate] = useState<UserRecord | null>(null);
  const [rolesForNewUser, setRolesForNewUser] = useState<string[]>([]);


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

        const initialAssignedRoles: Record<string, string[]> = {};
        combined.forEach(u => {
            if (u.profile) {
                initialAssignedRoles[u.auth.uid] = u.profile.roles;
            }
        });
        setAssignedRoles(initialAssignedRoles);

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

  const handleRoleChange = (uid: string, roleId: string, checked: boolean | 'indeterminate') => {
    if (typeof checked !== 'boolean') return;

    setAssignedRoles(prev => {
        const currentRoles = prev[uid] || [];
        if (checked) {
            return { ...prev, [uid]: [...currentRoles, roleId] };
        } else {
            return { ...prev, [uid]: currentRoles.filter(id => id !== roleId) };
        }
    });
  };

  const handleSaveChanges = async (uid: string) => {
    setIsSaving(uid);
    try {
        const rolesToSave = assignedRoles[uid] || [];
        await updateUserRoles(uid, rolesToSave);
        toast({
            title: "Roles actualizados",
            description: `Los roles para el usuario han sido guardados.`,
            variant: "default",
            className: "bg-accent text-accent-foreground",
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

  const handleCreateProfile = async () => {
    if (!userToCreate) return;
    setIsSaving(userToCreate.uid);
    try {
        await createProfileForUser(userToCreate.uid, userToCreate.email!, rolesForNewUser);
        toast({
            title: "Perfil Creado",
            description: `El perfil para ${userToCreate.email} ha sido creado.`,
            variant: "default",
        });
        // Refetch all users to update the UI
        handleFetchUsers();
    } catch (error: any) {
        toast({
            title: "Error al crear perfil",
            description: error.message,
            variant: "destructive",
        });
    } finally {
        setIsSaving(false);
        setUserToCreate(null);
        setRolesForNewUser([]);
    }
  }
  
  const handleNewUserRoleChange = (roleId: string, checked: boolean | 'indeterminate') => {
      if (typeof checked !== 'boolean') return;
      setRolesForNewUser(prev => {
          if (checked) {
              return [...prev, roleId];
          } else {
              return prev.filter(id => id !== roleId);
          }
      });
  }


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
                                {combinedUsers.map(({ auth, profile }) => (
                                    <TableRow key={auth.uid}>
                                        <TableCell className="font-medium">{auth.email}</TableCell>
                                        <TableCell>
                                            {profile ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {allRoles.map(role => (
                                                        <div key={role.id} className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id={`role-${auth.uid}-${role.id}`}
                                                                checked={(assignedRoles[auth.uid] || []).includes(role.id)}
                                                                onCheckedChange={(checked) => handleRoleChange(auth.uid, role.id, checked)}
                                                            />
                                                            <Label htmlFor={`role-${auth.uid}-${role.id}`}>{role.name}</Label>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-sm text-muted-foreground">Perfil no creado en la base de datos</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {profile ? (
                                                <Button onClick={() => handleSaveChanges(auth.uid)} disabled={isSaving === auth.uid || !!isSaving && isSaving !== auth.uid}>
                                                    <Save className="mr-2 h-4 w-4" />
                                                    {isSaving === auth.uid ? "Guardando..." : "Guardar"}
                                                </Button>
                                            ) : (
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="outline" onClick={() => setUserToCreate(auth)}>Asignar Roles y Crear Perfil</Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Asignar roles para {auth.email}</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Seleccione los roles para este usuario. Al guardar, se creará su perfil en la base de datos.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                                                            {allRoles.map(role => (
                                                                <div key={role.id} className="flex items-center space-x-2">
                                                                    <Checkbox
                                                                        id={`new-user-role-${role.id}`}
                                                                        onCheckedChange={(checked) => handleNewUserRoleChange(role.id, checked)}
                                                                    />
                                                                    <Label htmlFor={`new-user-role-${role.id}`}>{role.name}</Label>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel onClick={() => {setUserToCreate(null); setRolesForNewUser([])}}>Cancelar</AlertDialogCancel>
                                                            <AlertDialogAction onClick={handleCreateProfile} disabled={isSaving === auth.uid}>
                                                                {isSaving === auth.uid ? "Creando..." : "Crear Perfil"}
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            )}
        </Card>
        
      </main>
    </div>
  );
}