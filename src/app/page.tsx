"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { getAppsForUser } from '@/lib/apps';

export default function HomePage() {
  const router = useRouter();
  const { user, userProfile, loading } = useAuth();

  useEffect(() => {
    if (loading) {
      return; // Wait until user auth state is loaded
    }

    if (!user) {
      router.replace('/login');
    } else {
        getAppsForUser(userProfile).then(allowedApps => {
            if (allowedApps.length > 0) {
                router.replace(allowedApps[0].id);
            } else if (userProfile?.isAdministrator) {
                router.replace('/admin');
            } else {
                // Handle case where user is logged in but has no apps.
                // For now, redirect to login. Could be a "no access" page.
                router.replace('/login');
            }
        });
    }
  }, [user, userProfile, loading, router]);

  return null; // Or a loading spinner
}