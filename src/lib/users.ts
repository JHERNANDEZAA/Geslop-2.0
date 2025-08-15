import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import type { UserProfile } from './types';

export const getOrCreateUserProfile = async (uid: string, email: string): Promise<UserProfile> => {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        const userProfile = userSnap.data() as UserProfile;
        
        // TEMPORARY: Assign admin role to specific user for bootstrap
        if (email === 'jhernandeza@lopesan.com') {
          if (!userProfile.roles || !userProfile.roles.includes('1')) {
            const updatedRoles = userProfile.roles ? [...userProfile.roles, '1'] : ['1'];
            await updateDoc(userRef, { roles: updatedRoles });
            return { ...userProfile, roles: updatedRoles };
          }
        }
        
        return userProfile;
    } else {
        const newUserProfile: UserProfile = {
            uid,
            email,
            roles: [],
        };
        // TEMPORARY: Assign admin role to specific user for bootstrap
        if (email === 'jhernandeza@lopesan.com') {
            newUserProfile.roles.push('1');
        }
        await setDoc(userRef, newUserProfile);
        return newUserProfile;
    }
};

export const findUserByEmail = async (email: string): Promise<UserProfile | null> => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where("email", "==", email));
    
    try {
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            return null;
        }
        // Assuming email is unique, return the first found user
        return querySnapshot.docs[0].data() as UserProfile;
    } catch (error) {
        console.error("Error finding user by email: ", error);
        throw new Error("No se pudo buscar el usuario.");
    }
};

export const getUserRoles = async (uid: string): Promise<string[]> => {
    const userRef = doc(db, 'users', uid);
    try {
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            return (userSnap.data() as UserProfile).roles || [];
        }
        return [];
    } catch (error) {
        console.error("Error getting user roles: ", error);
        throw new Error("No se pudieron obtener los roles del usuario.");
    }
};

export const updateUserRoles = async (uid: string, roles: string[]): Promise<void> => {
    const userRef = doc(db, 'users', uid);
    try {
        await updateDoc(userRef, {
            roles: roles
        });
    } catch (error) {
        console.error("Error updating user roles: ", error);
        throw new Error("No se pudieron actualizar los roles del usuario.");
    }
};
