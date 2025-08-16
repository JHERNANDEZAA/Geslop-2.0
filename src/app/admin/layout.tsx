
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth, signOutUser } from '@/lib/auth';
import { Skeleton } from '@/components/ui/skeleton';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { getAllAdminApps, AppDefinition } from '@/lib/apps';
import { LogOut } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAdministrator, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [adminNavLinks, setAdminNavLinks] = useState<AppDefinition[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (!loading && user && !isAdministrator) {
        // If the user is logged in but not an admin, redirect them away
        router.push('/'); 
    }
  }, [user, isAdministrator, loading, router]);
  
  useEffect(() => {
    setAdminNavLinks(getAllAdminApps());
  }, []);

  const handleSignOut = async () => {
    await signOutUser();
    router.push('/login');
  };

  if (loading || !isAdministrator) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="w-full max-w-md space-y-4 p-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
        <div className="flex min-h-screen">
            <Sidebar variant="inset" collapsible="icon">
                <SidebarHeader>
                    <h2 className="text-lg font-semibold">Admin Panel</h2>
                </SidebarHeader>
                <SidebarContent>
                    <SidebarMenu>
                        {adminNavLinks.map(link => (
                            <SidebarMenuItem key={link.id}>
                                <Link href={link.route}>
                                    <SidebarMenuButton
                                        isActive={pathname === link.route}
                                        tooltip={{
                                            children: link.name,
                                            side: 'right',
                                        }}
                                    >
                                        <link.icon />
                                        <span>{link.name}</span>
                                    </SidebarMenuButton>
                                </Link>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarContent>
                <SidebarFooter>
                    <SidebarMenu>
                       <SidebarMenuItem>
                            <SidebarMenuButton
                                onClick={handleSignOut}
                                tooltip={{
                                    children: 'Salir',
                                    side: 'right',
                                }}
                            >
                                <LogOut />
                                <span>Salir</span>
                            </SidebarMenuButton>
                       </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarFooter>
            </Sidebar>
            <SidebarInset>
                <main className="flex-1 p-4 md:p-6">
                    {children}
                </main>
            </SidebarInset>
        </div>
    </SidebarProvider>
  );
}
