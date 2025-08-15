"use client";

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
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
} from '@/components/ui/sidebar';
import { availableApps } from '@/lib/apps';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAdministrator, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (!loading && user && !isAdministrator) {
        // If the user is logged in but not an admin, redirect them away
        router.push('/purchaseRequisition'); 
    }
  }, [user, isAdministrator, loading, router]);

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

  const adminNavLinks = availableApps.filter(app => app.isAdmin);

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
                                <Link href={link.id}>
                                    <SidebarMenuButton
                                        isActive={pathname === link.id}
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
