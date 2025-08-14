"use client";

import { useAuth, signOutUser } from '@/lib/auth.tsx';
import { Building2, LogOut, ShoppingCart, List } from 'lucide-react';
import { Button } from './ui/button';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function PageHeader() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    await signOutUser();
    router.push('/login');
  };

  const navLinks = [
    { href: '/', label: 'Solicitud', icon: List },
    { href: '/adminPurchasing', label: 'Administración de compras', icon: ShoppingCart },
  ]

  return (
    <header className="bg-card border-b shadow-sm sticky top-0 z-10">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <Building2 className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-semibold text-foreground">
              Solicitud de productos
            </h1>
          </div>
          {user && (
            <div className="flex items-center space-x-4">
                <nav className="hidden md:flex items-center space-x-2">
                  {navLinks.map((link) => (
                    <Button 
                      key={link.href}
                      variant={pathname === link.href ? 'default' : 'ghost'}
                      asChild
                    >
                       <Link href={link.href}>
                        <link.icon className="mr-2 h-4 w-4" />
                        {link.label}
                      </Link>
                    </Button>
                  ))}
                </nav>
                <span className="text-sm text-muted-foreground hidden sm:inline-block">{user.email}</span>
                <Button variant="ghost" size="icon" onClick={handleSignOut}>
                    <LogOut className="h-5 w-5" />
                    <span className="sr-only">Cerrar sesión</span>
                </Button>
            </div>
          )}
        </div>
      </div>
       {user && (
          <div className="md:hidden border-t">
              <nav className="flex justify-around p-2">
                 {navLinks.map((link) => (
                    <Button 
                      key={link.href}
                      variant={pathname === link.href ? 'default' : 'ghost'}
                      className="flex-1"
                      asChild
                    >
                       <Link href={link.href}>
                        <link.icon className="mr-2 h-4 w-4" />
                        {link.label}
                      </Link>
                    </Button>
                  ))}
              </nav>
          </div>
       )}
    </header>
  );
}
