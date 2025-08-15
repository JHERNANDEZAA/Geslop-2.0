
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
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
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Save, Users, Filter } from 'lucide-react';
import { getAllAuthUsers, UserRecord } from '@/app/actions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

type CombinedUser = {
  auth: UserRecord;
  profile: UserProfile | null;
};

const filterSchema = {
  email: '',
  fullName: '',
  role: 'all-roles',
};

const USERS_PER_PAGE = 1;

export default function AdminUserRolesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [combinedUsers, setCombinedUsers] = useState<CombinedUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<CombinedUser[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<string | boolean>(false);
  const [isFetching, setIsFetching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  const [userToManage, setUserToManage] = useState<CombinedUser | null>(null);
  const [rolesForManagedUser, setRolesForManagedUser] = useState<string[]>([]);
  const [fullNameForManagedUser, setFullNameForManagedUser] = useState('');
  
  const form = useForm({
    defaultValues: filterSchema,
  });

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

  const handleFilterSubmit = async (filters: typeof filterSchema) => {
    setIsFetching(true);
    setCurrentPage(0);
    setFilteredUsers([]);
    setHasSearched(true);

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
        
        let results = combined;

        if (filters.email) {
            results = results.filter(u => u.auth.email?.toLowerCase().includes(filters.email.toLowerCase()));
        }
        if (filters.fullName) {
            results = results.filter(u => u.profile?.fullName?.toLowerCase().includes(filters.fullName.toLowerCase()));
        }
        if (filters.role && filters.role !== 'all-roles') {
            results = results.filter(u => u.profile?.roles.includes(filters.role));
        }
        
        setFilteredUsers(results);
        
    } catch (error: any) {
        toast({
            title: "Error al cargar usuarios",
            description: error.message,
            variant: "destructive",
        });
        setFilteredUsers([]);
    } finally {
        setIsFetching(false);
    }
  };

  const refreshUsersAfterSave = async () => {
    // This function re-fetches and re-applies the last used filters.
    const currentFilters = form.getValues();
    await handleFilterSubmit(currentFilters);
  };
  
  const paginatedUsers = useMemo(() => {
    const start = currentPage * USERS_PER_PAGE;
    const end = start + USERS_PER_PAGE;
    return filteredUsers.slice(start, end);
  }, [filteredUsers, currentPage]);

  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);

  const openRoleManager = (user: CombinedUser) => {
    setUserToManage(user);
    setRolesForManagedUser(user.profile?.roles || []);
    setFullNameForManagedUser(user.profile?.fullName || user.auth.displayName || '');
  };

  const closeRoleManager = () => {
    setUserToManage(null);
    setRolesForManagedUser([]);
    setFullNameForManagedUser('');
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

    if (!userToManage.profile && !fullNameForManagedUser) {
        toast({
            title: "Campo requerido",
            description: "El nombre y apellidos son requeridos para crear un perfil.",
            variant: "destructive",
        });
        return;
    }

    setIsSaving(userToManage.auth.uid);
    try {
      if (userToManage.profile) {
        await updateUserRoles(userToManage.auth.uid, rolesForManagedUser);
        toast({
            title: "Roles actualizados",
            description: `Los roles para ${userToManage.auth.email} han sido guardados.`,
            variant: "default",
            className: "bg-accent text-accent-foreground",
        });
      } else {
        await createProfileForUser(userToManage.auth.uid, userToManage.auth.email!, fullNameForManagedUser, rolesForManagedUser);
        toast({
            title: "Perfil Creado",
            description: `El perfil para ${userToManage.auth.email} ha sido creado con los roles seleccionados.`,
            variant: "default",
        });
      }
      await refreshUsersAfterSave();
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
                    Utilice los filtros para buscar usuarios y administrar sus roles. Los usuarios de la autenticación que no tengan un perfil en la base de datos se pueden crear desde aquí.
                </CardDescription>
            </CardHeader>
            <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleFilterSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input placeholder="Filtrar por email..." {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="fullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nombre y Apellidos</FormLabel>
                              <FormControl>
                                <Input placeholder="Filtrar por nombre..." {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="role"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Rol</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Filtrar por rol..." />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="all-roles">Todos</SelectItem>
                                  {allRoles.map(role => (
                                    <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                      </div>
                       <Button type="submit" disabled={isFetching}>
                          <Filter className="mr-2 h-4 w-4" />
                          {isFetching ? "Filtrando..." : "Filtrar usuarios"}
                       </Button>
                    </form>
                  </Form>
            </CardContent>

            {hasSearched && !isFetching && (
              <>
                {filteredUsers.length > 0 ? (
                    <CardContent className="mt-6 border-t pt-6">
                        <CardTitle className="text-xl mb-4">Usuarios del sistema</CardTitle>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[250px]">Email</TableHead>
                                        <TableHead>Nombre y Apellidos</TableHead>
                                        <TableHead>Roles Asignados</TableHead>
                                        <TableHead className="text-right w-[250px]">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedUsers.map((combinedUser) => (
                                        <TableRow key={combinedUser.auth.uid}>
                                            <TableCell className="font-medium">{combinedUser.auth.email}</TableCell>
                                            <TableCell>{combinedUser.profile?.fullName || <span className="text-muted-foreground italic">N/A</span>}</TableCell>
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
                                                    {combinedUser.profile ? 'Asignar Roles' : 'Asignar roles y crear perfil'}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                            <p className="text-sm text-muted-foreground">
                                Página {currentPage + 1} de {totalPages}
                            </p>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0}>
                                    Anterior
                                </Button>
                                <Button variant="outline" onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))} disabled={currentPage >= totalPages - 1}>
                                    Siguiente
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                ) : (
                    <CardContent className="text-center py-10">
                        <p className="text-muted-foreground">No se encontraron usuarios con los filtros especificados.</p>
                    </CardContent>
                )}
              </>
            )}
             {isFetching && (
                 <CardContent className="text-center py-10">
                     <Skeleton className="h-40 w-full" />
                 </CardContent>
            )}

        </Card>
        
        {userToManage && (
            <AlertDialog open={!!userToManage} onOpenChange={(open) => !open && closeRoleManager()}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Asignar roles para {userToManage.auth.email}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {userToManage.profile 
                                ? 'Seleccione los roles para este usuario. Al guardar, se actualizarán sus permisos.'
                                : 'Este usuario no tiene perfil. Complete su nombre, seleccione sus roles y al guardar se creará su perfil en la base de datos.'
                            }
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-4 py-4">
                        {!userToManage.profile && (
                             <div>
                                <Label htmlFor="fullName">Nombre y Apellidos</Label>
                                <Input 
                                    id="fullName"
                                    value={fullNameForManagedUser}
                                    onChange={(e) => setFullNameForManagedUser(e.target.value)}
                                    placeholder="John Doe"
                                    className="mt-2"
                                />
                            </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
