'use server';

import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { serviceAccount } from '@/lib/service-account';
import { getOrCreateUserProfile } from '@/lib/users';

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

export const createUserAction = async (email: string, password: string,roleIds: string[]): Promise<{ success: boolean; message: string }> => {
  try {
    const userRecord = await adminAuth.createUser({
      email,
      password,
      emailVerified: true,
      disabled: false,
    });
    
    await getOrCreateUserProfile(userRecord.uid, userRecord.email!);
    
    // Asignar roles
    const userProfileRef = adminApp.firestore().collection('users').doc(userRecord.uid);
    await userProfileRef.update({ roles: roleIds });
    
    return { success: true, message: `Usuario ${email} creado exitosamente.` };
  } catch (error: any) {
    console.error("Error creating user:", error);
    if (error.code === 'auth/email-already-exists') {
      return { success: false, message: 'El correo electrónico ya está en uso por otro usuario.' };
    }
    return { success: false, message: 'Ocurrió un error al crear el usuario.' };
  }
};
