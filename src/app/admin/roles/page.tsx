

"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Role } from '@/lib/types';
import { saveRole, getAllRoles, deleteRole, updateRoleStatus } from '@/lib/roles';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const roleSchema = z.object({
  name: z.string().min(1, 'El nombre del rol es requerido'),
  description: z.string().min(1, 'La descripción es requerida'),
  isActive: z.boolean().default(true),
});

export default function AdminRolesPage() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

  const form = useForm<z.infer<typeof roleSchema>>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: '',
      description: '',
      isActive: true,
    }
  });

  const fetchRoles = async () => {
    setIsLoadingRoles(true);
    try {
      const allRoles = await getAllRoles();
      setRoles(allRoles);
    } catch (error: any) {
      toast({
        title: "Error al cargar roles",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoadingRoles(false);
    }
  };
  
  useEffect(() => {
      if (user) {
        fetchRoles();
      }
  }, [user])


  const onSubmit = async (values: z.infer<typeof roleSchema>) => {
    if (!user?.email) {
        toast({ title: "Error", description: "Usuario no autenticado.", variant: "destructive" });
        return;
    }
    try {
      const result = await saveRole(values, user.email);

      if (result.success) {
        toast({
          title: "Rol Guardado",
          description: `El rol "${values.name}" ha sido guardado correctamente.`,
          variant: "default",
          className: "bg-accent text-accent-foreground"
        });
        form.reset();
        fetchRoles();
      } else {
        toast({
          title: "Error al guardar",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
         toast({
          title: "Error al guardar el rol",
          description: error.message || "No se pudo guardar el rol.",
          variant: 'destructive',
        });
    }
  };

  const handleDeleteRole = async () => {
    if (!roleToDelete) return;
    try {
        await deleteRole(roleToDelete.id);
        toast({
            title: "Rol Eliminado",
            description: `El rol "${roleToDelete.name}" ha sido eliminado.`,
            variant: "default",
        });
        fetchRoles();
    } catch (error: any) {
        toast({
            title: "Error al eliminar",
            description: error.message || "Ocurrió un error al eliminar el rol.",
            variant: "destructive",
        });
    } finally {
        setRoleToDelete(null);
    }
  };

  const handleToggleActive = async (role: Role, isActive: boolean) => {
    // Optimistic update
    setRoles(prevRoles => prevRoles.map(r => r.id === role.id ? { ...r, isActive } : r));
    try {
        await updateRoleStatus(role.id, isActive);
        toast({
            title: "Rol Actualizado",
            description: `El rol "${role.name}" ahora está ${isActive ? 'activo' : 'inactivo'}.`,
            variant: "default",
        });
    } catch (error: any) {
        // Revert on error
        setRoles(prevRoles => prevRoles.map(r => r.id === role.id ? { ...r, isActive: !isActive } : r));
        toast({
            title: "Error al actualizar",
            description: error.message || "Ocurrió un error al actualizar el estado del rol.",
            variant: "destructive",
        });
    }
  };


  return (
    <div className="flex flex-col gap-6">
        <Card>
            <CardHeader>
                <CardTitle>Crear Nuevo Rol</CardTitle>
            </CardHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nombre del Rol</FormLabel>
                                <FormControl>
                                <Input placeholder="Ej: Administrador" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Descripción</FormLabel>
                                <FormControl>
                                <Input placeholder="Ej: Gestiona usuarios y permisos" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="isActive"
                            render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                <div className="space-y-0.5">
                                <FormLabel>Activo</FormLabel>
                                </div>
                                <FormControl>
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                                </FormControl>
                            </FormItem>
                            )}
                        />
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting ? "Creando..." : "Crear Rol"}
                        </Button>
                    </CardFooter>
                </form>
            </Form>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Roles Existentes</CardTitle>
            </CardHeader>
            <CardContent>
                {isLoadingRoles ? (
                    <Skeleton className="h-40 w-full" />
                ) : (
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]"></TableHead>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Descripción</TableHead>
                                <TableHead>Activo</TableHead>
                                <TableHead>Creado el</TableHead>
                                <TableHead>Creado por</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {roles.map((role) => (
                                <TableRow key={role.id}>
                                    <TableCell>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" onClick={() => setRoleToDelete(role)}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </AlertDialogTrigger>
                                        </AlertDialog>
                                    </TableCell>
                                    <TableCell>{role.name}</TableCell>
                                    <TableCell>{role.description}</TableCell>
                                    <TableCell>
                                        <Switch
                                            checked={role.isActive}
                                            onCheckedChange={(isChecked) => handleToggleActive(role, isChecked)}
                                            aria-label={`Activar o desactivar el rol ${role.name}`}
                                        />
                                    </TableCell>
                                    <TableCell>{role.createdAt}</TableCell>
                                    <TableCell>{role.createdBy}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                )}
            </CardContent>
        </Card>
        
        {roleToDelete && (
            <AlertDialog open={!!roleToDelete} onOpenChange={(open) => !open && setRoleToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Está seguro que desea eliminar este rol?</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div>
                                <span>Esta acción no se puede deshacer. Se eliminará permanentemente el siguiente rol:</span>
                                <div className="mt-4 space-y-2 text-sm text-foreground bg-muted/50 p-4 rounded-md">
                                    <p><strong>ID:</strong> {roleToDelete.id}</p>
                                    <p><strong>Nombre:</strong> {roleToDelete.name}</p>
                                    <p><strong>Descripción:</strong> {roleToDelete.description}</p>
                                    <p><strong>Activo:</strong> {roleToDelete.isActive ? 'Sí' : 'No'}</p>
                                    <p><strong>Creado el:</strong> {roleToDelete.createdAt}</p>
                                    <p><strong>Creado por:</strong> {roleToDelete.createdBy}</p>
                                </div>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setRoleToDelete(null)}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteRole} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        )}
    </div>
  );
}
