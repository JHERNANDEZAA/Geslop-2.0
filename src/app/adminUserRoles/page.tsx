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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Role, UserProfile } from '@/lib/types';
import { getAllRoles } from '@/lib/roles';
import { findUserByEmail, getUserRoles, updateUserRoles } from '@/lib/users';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Save } from 'lucide-react';

const searchUserSchema = z.object({
  email: z.string().email('Debe ser un correo electrónico válido.'),
});

export default function AdminUserRolesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [targetUser, setTargetUser] = useState<UserProfile | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const searchForm = useForm<z.infer<typeof searchUserSchema>>({
    resolver: zodResolver(searchUserSchema),
    defaultValues: {
      email: '',
    },
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
      setAllRoles(roles.filter(role => role.isActive)); // Only show active roles
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

  const handleSearchUser = async (values: z.infer<typeof searchUserSchema>) => {
    setIsSearching(true);
    setTargetUser(null);
    setUserRoles([]);
    try {
      const foundUser = await findUserByEmail(values.email);
      if (foundUser) {
        setTargetUser(foundUser);
        const roles = await getUserRoles(foundUser.uid);
        setUserRoles(roles);
      } else {
        toast({
          title: "Usuario no encontrado",
          description: "No se encontró ningún usuario con ese correo electrónico en la base de datos.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error en la búsqueda",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleRoleChange = (roleId: string, checked: boolean | 'indeterminate') => {
    if (typeof checked !== 'boolean') return;
    setUserRoles(prev => {
        if (checked) {
            return [...prev, roleId];
        } else {
            return prev.filter(id => id !== roleId);
        }
    });
  };

  const handleSaveChanges = async () => {
    if (!targetUser) return;
    setIsSaving(true);
    try {
        await updateUserRoles(targetUser.uid, userRoles);
        toast({
            title: "Roles actualizados",
            description: `Los roles para ${targetUser.email} han sido guardados correctamente.`,
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
  }


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
                <CardTitle>Asignación de Roles a Usuarios</CardTitle>
                <CardDescription>
                    Busque un usuario por su correo electrónico para asignarle o modificarle sus roles de acceso.
                </CardDescription>
            </CardHeader>
            <Form {...searchForm}>
                <form onSubmit={searchForm.handleSubmit(handleSearchUser)}>
                    <CardContent className="space-y-4">
                        <FormField
                            control={searchForm.control}
                            name="email"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Correo electrónico del usuario</FormLabel>
                                <div className="flex items-center gap-2">
                                <FormControl>
                                <Input placeholder="usuario@ejemplo.com" {...field} />
                                </FormControl>
                                <Button type="submit" disabled={isSearching}>
                                    {isSearching ? "Buscando..." : "Buscar Usuario"}
                                </Button>
                                </div>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </CardContent>
                </form>
            </Form>

            {targetUser && (
                <CardContent className="mt-6 border-t pt-6">
                    <CardTitle className="text-xl">Roles para: {targetUser.email}</CardTitle>
                    <CardDescription className="mb-4">Seleccione los roles que desea asignar al usuario.</CardDescription>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {allRoles.map((role) => (
                             <div key={role.id} className="flex items-center space-x-2 rounded-md border p-4">
                                <Checkbox
                                    id={`role-${role.id}`}
                                    checked={userRoles.includes(role.id)}
                                    onCheckedChange={(checked) => handleRoleChange(role.id, checked)}
                                />
                                <Label htmlFor={`role-${role.id}`} className="flex flex-col gap-1 cursor-pointer">
                                    <span className="font-semibold">{role.name}</span>
                                    <span className="font-normal text-muted-foreground">{role.description}</span>
                                </Label>
                             </div>
                        ))}
                    </div>
                </CardContent>
            )}

            {targetUser && (
                 <CardFooter className="flex justify-end border-t mt-6 pt-6">
                    <Button onClick={handleSaveChanges} disabled={isSaving}>
                        <Save className="mr-2 h-4 w-4" />
                        {isSaving ? "Guardando..." : "Guardar Cambios"}
                    </Button>
                </CardFooter>
            )}
        </Card>
      </main>
    </div>
  );
}
