'use server';

import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { serviceAccount } from '@/lib/service-account';
import type { UserProfile } from '@/lib/types';

let adminApp: App;
if (!getApps().some(app => app.name === 'admin')) {
  adminApp = initializeApp({
    credential: {
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKey: serviceAccount.private_key,
    },
  }, 'admin');
} else {
  adminApp = getApps().find(app => app.name === 'admin')!;
}

const adminAuth = getAuth(adminApp);
const adminDb = getFirestore(adminApp);

export const createUserAction = async (email: string, password: string,roleIds: string[]): Promise<{ success: boolean; message: string }> => {
  try {
    // 1. Create user in Firebase Authentication
    const userRecord = await adminAuth.createUser({
      email,
      password,
      emailVerified: true,
      disabled: false,
    });
    
    // 2. Create user profile in Firestore
    const userProfileRef = adminDb.collection('users').doc(userRecord.uid);
    const newUserProfile: UserProfile = {
      uid: userRecord.uid,
      email: userRecord.email!,
      roles: roleIds,
    };
    await userProfileRef.set(newUserProfile);
    
    return { success: true, message: `Usuario ${email} creado exitosamente.` };
  } catch (error: any) {
    console.error("Error creating user:", error);
    if (error.code === 'auth/email-already-exists') {
      return { success: false, message: 'El correo electrónico ya está en uso por otro usuario.' };
    }
    return { success: false, message: 'Ocurrió un error al crear el usuario.' };
  }
};
