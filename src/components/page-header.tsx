
"use client";

import { useAuth, signOutUser } from '@/lib/auth.tsx';
import { Building2, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { useRouter } from 'next/navigation';
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "@/components/ui/menubar"


export function PageHeader() {
  const { user } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOutUser();
    router.push('/login');
  };

  return (
    <header className="bg-card border-b shadow-sm sticky top-0 z-10">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <Building2 className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-semibold text-foreground">
              Hotel Supply Hub
            </h1>
          </div>
          {user && (
            <div className="flex items-center space-x-4">
                <span className="text-sm text-muted-foreground hidden sm:inline-block">{user.email}</span>
                <Button variant="ghost" size="icon" onClick={handleSignOut}>
                    <LogOut className="h-5 w-5" />
                    <span className="sr-only">Cerrar sesión</span>
                </Button>
            </div>
          )}
        </div>
        <div className="flex items-center justify-start h-12">
            <Menubar>
                <MenubarMenu>
                    <MenubarTrigger>Logística</MenubarTrigger>
                    <MenubarContent>
                        <MenubarItem>
                            Pedidos
                        </MenubarItem>
                    </MenubarContent>
                </MenubarMenu>
                <MenubarMenu>
                    <MenubarTrigger>Menú</MenubarTrigger>
                     <MenubarContent>
                        <MenubarItem>
                            Catálogo
                        </MenubarItem>
                    </MenubarContent>
                </MenubarMenu>
            </Menubar>
        </div>
      </div>
    </header>
  );
}
