"use client";

import { useAuth, signOutUser } from '@/lib/auth.tsx';
import { Building2, LogOut, ShoppingCart, List, Shield, LayoutDashboard } from 'lucide-react';
import { Button } from './ui/button';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { availableApps } from '@/lib/apps';

export function PageHeader() {
  const { user, isAdministrator } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    await signOutUser();
    router.push('/login');
  };

  const navLinks = availableApps.filter(app => !app.isAdmin);

  return (
    <header className="bg-card border-b shadow-sm sticky top-0 z-10">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <Building2 className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-semibold text-foreground">
              Portal de compras LOPESAN
            </h1>
          </div>
          {user && (
            <div className="flex items-center space-x-4">
                <span className="text-sm text-muted-foreground hidden sm:inline-block">{user.email}</span>
                {isAdministrator && (
                    <Button variant={pathname.startsWith('/admin') ? 'default' : 'ghost'} asChild>
                        <Link href="/admin">
                            <Shield className="mr-2 h-4 w-4" />
                            Panel de Administración
                        </Link>
                    </Button>
                )}
                <Button variant="ghost" size="icon" onClick={handleSignOut}>
                    <LogOut className="h-5 w-5" />
                    <span className="sr-only">Cerrar sesión</span>
                </Button>
            </div>
          )}
        </div>
      </div>
       {user && !pathname.startsWith('/admin') && (
          <div className="border-t">
              <nav className="mx-auto px-4 sm:px-6 lg:px-8 flex items-center space-x-2 h-12 overflow-x-auto">
                 {navLinks.map((link) => (
                    <Button 
                      key={link.id}
                      variant={pathname === link.id ? 'default' : 'ghost'}
                      asChild
                      className="shrink-0"
                    >
                       <Link href={link.id}>
                        <link.icon className="mr-2 h-4 w-4" />
                        {link.name}
                      </Link>
                    </Button>
                  ))}
              </nav>
          </div>
       )}
    </header>
  );
}
