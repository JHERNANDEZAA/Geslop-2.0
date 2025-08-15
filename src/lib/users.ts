import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import type { UserProfile } from './types';

export const getOrCreateUserProfile = async (uid: string, email: string): Promise<UserProfile> => {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        const userProfile = userSnap.data() as UserProfile;
        return userProfile;
    } else {
        const newUserProfile: UserProfile = {
            uid,
            email,
            roles: [],
        };
        await setDoc(userRef, newUserProfile);
        return newUserProfile;
    }
};

export const createProfileForUser = async (uid: string, email: string, roles: string[]): Promise<void> => {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        throw new Error("El perfil para este usuario ya existe en la base de datos.");
    }

    const newUserProfile: UserProfile = {
        uid,
        email,
        roles,
    };
    await setDoc(userRef, newUserProfile);
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
        const userDoc = querySnapshot.docs[0];
        return {
            uid: userDoc.id,
            ...userDoc.data()
        } as UserProfile;
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

export const getAllUsers = async (): Promise<UserProfile[]> => {
    const usersRef = collection(db, 'users');
    try {
        const querySnapshot = await getDocs(usersRef);
        const users: UserProfile[] = [];
        querySnapshot.forEach((doc) => {
            users.push({
                uid: doc.id,
                ...doc.data()
            } as UserProfile);
        });
        return users;
    } catch (error) {
        console.error("Error getting all users: ", error);
        throw new Error("No se pudo obtener la lista de usuarios.");
    }
}