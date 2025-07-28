
'use server';

import { db } from '@/lib/firebase';
import { collection, doc, writeBatch } from 'firebase/firestore';


// --- Server Action for Data Loading ---
interface HanaMaterial {
    SAP_UUID: string;
    Product: string;
    ProductGroup: string;
    ProductGroupText_SP: string;
    BaseUnit: string;
    YY1_FAMILIADESC_PPR: string;
    YY1_UBICACION_PPR: string;
    YY1_REDONDEO_PPR: string;
    YY1_SEMAFORO_PPR: string;
    Plant: string;
    YY1_CATALOGO_PPR: string;
}

async function fetchHanaMaterials(): Promise<HanaMaterial[]> {
    const url = process.env.S4_HANA_URL;
    const user = process.env.S4_HANA_USER;
    const password = process.env.S4_HANA_PASSWORD;

    if (!url || !user || !password) {
        throw new Error("S4/HANA environment variables are not set. Please check your .env file.");
    }

    const headers = new Headers();
    headers.append("Authorization", "Basic " + btoa(user + ":" + password));
    headers.append("Accept", "application/json");

    try {
        const response = await fetch(url, { headers });

        if (!response.ok) {
            throw new Error(`Failed to fetch data from S4/HANA: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();

        return data.d.results;
    } catch (error) {
        console.error("Error connecting to S4/HANA:", error);
        throw error;
    }
}

async function storeMaterialsInFirestore(materials: HanaMaterial[]) {
    const batch = writeBatch(db);
    const materialsCollection = collection(db, 'hana_materials');

    materials.forEach(material => {
        const docRef = doc(materialsCollection, material.SAP_UUID);
        batch.set(docRef, material);
    });

    try {
        await batch.commit();
        return `Successfully stored ${materials.length} materials in Firestore.`;
    } catch (error) {
        console.error("Error storing materials in Firestore:", error);
        throw error;
    }
}

export async function loadHanaData() {
    try {
        const materials = await fetchHanaMaterials();
        
        if (materials && materials.length > 0) {
            const result = await storeMaterialsInFirestore(materials);
            return { success: true, message: result };
        } else {
            return { success: true, message: "No materials found to load." };
        }
    } catch (error: any) {
        console.error("An error occurred during the material loading process:", error);
        return { success: false, message: error };
    }
}
