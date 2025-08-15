

"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Role, UserProfile } from '@/lib/types';
import { getAllRoles } from '@/lib/roles';
import { getAllUsers, updateUserProfile, createProfileForUser } from '@/lib/users';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Save, Filter } from 'lucide-react';
import { getAllAuthUsers, UserRecord } from '@/app/actions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useForm } from 'react-hook-form';


type CombinedUser = {
  auth: UserRecord;
  profile: UserProfile | null;
};

const filterSchema = {
  email: '',
  fullName: '',
  roles: [] as string[],
};

const USERS_PER_PAGE = 10;

export default function AdminUserRolesPage() {
  const { user, loading } = useAuth();
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
  const [fullNameError, setFullNameError] = useState<string | null>(null);
  
  const form = useForm({
    defaultValues: filterSchema,
  });

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
    if(user) {
        fetchAllRoles();
    }
  }, [user]);

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
           results = results.filter(u => u.profile && u.profile.fullName && u.profile.fullName.toLowerCase().includes(filters.fullName.toLowerCase()));
        }
        if (filters.roles && filters.roles.length > 0) {
            results = results.filter(u => 
                u.profile?.roles.some(userRole => filters.roles.includes(userRole))
            );
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
    setFullNameError(null);
  };

  const closeRoleManager = () => {
    setUserToManage(null);
    setRolesForManagedUser([]);
    setFullNameForManagedUser('');
    setFullNameError(null);
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

    const needsFullName = !userToManage.profile || !userToManage.profile.fullName;
    if (needsFullName && !fullNameForManagedUser.trim()) {
        setFullNameError("El nombre y apellidos son requeridos.");
        toast({
            title: "Campo obligatorio",
            description: "Debe indicar el nombre y apellidos para crear o actualizar el perfil.",
            variant: "destructive",
        });
        return;
    }

    setIsSaving(userToManage.auth.uid);
    try {
      if (userToManage.profile) {
        const updateData: Partial<UserProfile> = { roles: rolesForManagedUser };
        if (needsFullName) {
          updateData.fullName = fullNameForManagedUser;
        }
        await updateUserProfile(userToManage.auth.uid, updateData);
        toast({
            title: "Perfil actualizado",
            description: `El perfil para ${userToManage.auth.email} ha sido guardado.`,
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
      closeRoleManager();
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


  if (isLoading) {
    return (
        <div className="space-y-4">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-64 w-full" />
        </div>
    );
  }

  return (
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
                        name="roles"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Rol</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className={cn(
                                                "w-full justify-between",
                                                !field.value.length && "text-muted-foreground"
                                                )}
                                            >
                                                {field.value.length > 0
                                                    ? `${field.value.length} roles seleccionados`
                                                    : "Seleccionar roles..."
                                                }
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-full p-0">
                                            <div className="p-2 space-y-1">
                                                {allRoles.map((role) => (
                                                        <div key={role.id} className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`filter-role-${role.id}`}
                                                            checked={field.value.includes(role.id)}
                                                            onCheckedChange={(checked) => {
                                                                return checked
                                                                ? field.onChange([...field.value, role.id])
                                                                : field.onChange(field.value.filter((value) => value !== role.id));
                                                            }}
                                                        />
                                                        <Label htmlFor={`filter-role-${role.id}`} className="font-normal">{role.name}</Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </PopoverContent>
                                    </Popover>
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
                    <CardDescription className="mb-4">
                        Mostrando {filteredUsers.length} de {combinedUsers.length} usuarios.
                    </CardDescription>
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

        {userToManage && (
            <AlertDialog open={!!userToManage} onOpenChange={(open) => !open && closeRoleManager()}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Asignar roles para {userToManage.auth.email}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {(!userToManage.profile || !userToManage.profile.fullName) 
                                ? 'Este usuario no tiene perfil o nombre. Complete su nombre, seleccione sus roles y al guardar se creará o actualizará su perfil.'
                                : 'Seleccione los roles para este usuario. Al guardar, se actualizarán sus permisos.'
                            }
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-4 py-4">
                        {(!userToManage.profile || !userToManage.profile.fullName) && (
                                <div>
                                <Label htmlFor="fullName" className={cn(fullNameError && "text-destructive")}>
                                    Nombre y Apellidos
                                </Label>
                                <Input 
                                    id="fullName"
                                    value={fullNameForManagedUser}
                                    onChange={(e) => {
                                        setFullNameForManagedUser(e.target.value);
                                        if (e.target.value.trim()) {
                                            setFullNameError(null);
                                        }
                                    }}
                                    placeholder="John Doe"
                                    className={cn("mt-2", fullNameError && "border-destructive focus-visible:ring-destructive")}
                                />
                                {fullNameError && <p className="text-sm font-medium text-destructive mt-2">{fullNameError}</p>}
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
    </Card>
  );
}
