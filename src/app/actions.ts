
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
        const response = await fetch(url, { headers, cache: 'no-store' });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`S4/HANA API Error: ${errorText}`);
            throw new Error(`Failed to fetch data from S4/HANA: ${response.status} ${response.statusText}.`);
        }
        
        const data = await response.json();
        // The actual results are in the 'd.results' property
        return data.d.results;
    } catch (error) {
        console.error("Error connecting to S4/HANA:", error);
        // Re-throw the error to be caught by the action handler
        throw error;
    }
}

async function storeMaterialsInFirestore(materials: HanaMaterial[]) {
    const batch = writeBatch(db);
    const materialsCollection = collection(db, 'hana_materials');
    let processedCount = 0;

    materials.forEach(material => {
        // FIX: Ensure SAP_UUID exists and is not an empty string before processing
        if (material.SAP_UUID && material.SAP_UUID.trim() !== '') {
            const docRef = doc(materialsCollection, material.SAP_UUID);
            batch.set(docRef, material);
            processedCount++;
        } else {
            console.warn("Skipping material with empty SAP_UUID:", material);
        }
    });

    if (processedCount === 0) {
        console.log("No valid materials with SAP_UUID found to store.");
        return "No valid materials with SAP_UUID found to store.";
    }

    try {
        await batch.commit();
        return `Successfully stored ${processedCount} of ${materials.length} fetched materials in Firestore.`;
    } catch (error) {
        console.error("Error storing materials in Firestore:", error);
        throw error;
    }
}

export async function loadHanaData() {
    try {
        console.log("Fetching materials from S4/HANA...");
        const materials = await fetchHanaMaterials();
        
        if (materials && materials.length > 0) {
            console.log(`Fetched ${materials.length} materials. Storing in Firestore...`);
            const result = await storeMaterialsInFirestore(materials);
            console.log("Data load complete.");
            return { success: true, message: result };
        } else {
            console.log("No materials found to load.");
            return { success: true, message: "No materials found to load." };
        }
    } catch (error: any) {
        console.error("An error occurred during the material loading process:", error);
        // Ensure the message is a string for the toast component
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { success: false, message: errorMessage || 'An unknown error occurred' };
    }
}
