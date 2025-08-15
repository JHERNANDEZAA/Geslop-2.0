"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/lib/auth';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Role, UserProfile } from '@/lib/types';
import { getAllRoles } from '@/lib/roles';
import { getAllUsers } from '@/lib/users';
import { createUserAction } from '@/app/actions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const userSchema = z.object({
  email: z.string().email('Debe ser un correo electrónico válido.'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
  roles: z.array(z.string()).min(1, 'Debe seleccionar al menos un rol.'),
});

export default function AdminUsersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: '',
      password: '',
      roles: [],
    },
  });

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [roles, userList] = await Promise.all([
        getAllRoles(),
        getAllUsers(),
      ]);
      setAllRoles(roles.filter(role => role.isActive));
      setUsers(userList);
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
    if (!loading && !user) {
      router.push('/login');
    } else if (user) {
      fetchInitialData();
    }
  }, [user, loading, router]);


  const onSubmit = async (values: z.infer<typeof userSchema>) => {
    const result = await createUserAction(values.email, values.password, values.roles);
    if (result.success) {
      toast({
        title: "Usuario Creado",
        description: result.message,
        variant: "default",
        className: "bg-accent text-accent-foreground",
      });
      form.reset();
      fetchInitialData(); // Refresh user list
    } else {
      toast({
        title: "Error al crear usuario",
        description: result.message,
        variant: "destructive",
      });
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
            <Skeleton className="h-96 w-full" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PageHeader />
      <main className="flex-grow flex flex-col p-6 space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Crear Nuevo Usuario</CardTitle>
                <CardDescription>
                    Complete el formulario para añadir un nuevo usuario al sistema y asignarle sus roles.
                </CardDescription>
            </CardHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Correo Electrónico</FormLabel>
                                    <FormControl>
                                    <Input type="email" placeholder="usuario@ejemplo.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Contraseña</FormLabel>
                                    <FormControl>
                                    <Input type="password" placeholder="••••••••" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </div>

                         <FormField
                            control={form.control}
                            name="roles"
                            render={() => (
                                <FormItem>
                                    <div className="mb-4">
                                        <FormLabel className="text-base">Roles</FormLabel>
                                        <FormDescription>
                                            Seleccione los roles que desea asignar al nuevo usuario.
                                        </FormDescription>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {allRoles.map((role) => (
                                            <FormField
                                                key={role.id}
                                                control={form.control}
                                                name="roles"
                                                render={({ field }) => {
                                                    return (
                                                        <FormItem
                                                            key={role.id}
                                                            className="flex items-center space-x-2 rounded-md border p-4"
                                                        >
                                                            <FormControl>
                                                                <Checkbox
                                                                    checked={field.value?.includes(role.id)}
                                                                    onCheckedChange={(checked) => {
                                                                        return checked
                                                                            ? field.onChange([...field.value, role.id])
                                                                            : field.onChange(
                                                                                field.value?.filter(
                                                                                    (value) => value !== role.id
                                                                                )
                                                                            )
                                                                    }}
                                                                />
                                                            </FormControl>
                                                            <Label htmlFor={`role-${role.id}`} className="flex flex-col gap-1 cursor-pointer">
                                                                <span className="font-semibold">{role.name}</span>
                                                                <span className="font-normal text-muted-foreground">{role.description}</span>
                                                            </Label>
                                                        </FormItem>
                                                    )
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting ? "Creando..." : "Crear Usuario"}
                        </Button>
                    </CardFooter>
                </form>
            </Form>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Usuarios Existentes</CardTitle>
                 <CardDescription>
                    Lista de todos los usuarios registrados en el sistema.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Email</TableHead>
                                <TableHead>Roles</TableHead>
                                <TableHead>UID</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((u) => (
                                <TableRow key={u.uid}>
                                    <TableCell className="font-medium">{u.email}</TableCell>
                                    <TableCell>
                                        {u.roles.map(roleId => allRoles.find(r => r.id === roleId)?.name).join(', ')}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-xs">{u.uid}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
