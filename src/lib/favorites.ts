
import { db } from './firebase';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';

export const getFavorites = async (userId: string): Promise<string[]> => {
    if (!userId) return [];
    
    const favoritesRef = collection(db, 'favorites');
    // Note: This query requires a composite index on userId and materialCode.
    // Firestore should prompt to create it in the console error logs.
    const q = query(favoritesRef, where('userId', '==', userId));

    try {
        const querySnapshot = await getDocs(q);
        const favorites: string[] = [];
        querySnapshot.forEach((doc) => {
            favorites.push(doc.data().materialCode);
        });
        return favorites;
    } catch (error) {
        console.error("Error fetching favorites: ", error);
        return [];
    }
}

export const addFavorite = async (userId: string, materialCode: string) => {
    if (!userId || !materialCode) return;
    
    // We use a composite key for the document ID to ensure uniqueness and prevent duplicates.
    const favoriteId = `${userId}_${materialCode}`;
    const favoriteRef = doc(db, 'favorites', favoriteId);

    try {
        await setDoc(favoriteRef, {
            userId: userId,
            materialCode: materialCode,
        });
    } catch (error) {
        console.error("Error adding favorite: ", error);
        throw error;
    }
}

export const removeFavorite = async (userId: string, materialCode: string) => {
    if (!userId || !materialCode) return;
    
    const favoriteId = `${userId}_${materialCode}`;
    const favoriteRef = doc(db, 'favorites', favoriteId);

    try {
        await deleteDoc(favoriteRef);
    } catch (error) {
        console.error("Error removing favorite: ", error);
        throw error;
    }
}
