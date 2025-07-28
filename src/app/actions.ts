
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

async function fetchHanaMaterials(): Promise<{ materials: HanaMaterial[], rawResponse: string }> {
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
        
        const responseText = await response.text();
        
        if (!response.ok) {
            // Include status and raw text in the error message for better client-side debugging
            throw new Error(`Failed to fetch data from S4/HANA: ${response.status} ${response.statusText}. Raw Response: ${responseText}`);
        }
        
        const data = JSON.parse(responseText);

        // The actual results are in the 'd.results' property
        if (data && data.d && Array.isArray(data.d.results)) {
            return { materials: data.d.results, rawResponse: responseText };
        } else {
            throw new Error(`Unexpected JSON structure from S4/HANA. 'd.results' not found. Raw Response: ${responseText}`);
        }
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
        const { materials, rawResponse } = await fetchHanaMaterials();
        
        if (materials && materials.length > 0) {
            const result = await storeMaterialsInFirestore(materials);
            return { success: true, message: result, debugInfo: `Raw S4/HANA Response (first 500 chars): ${rawResponse.substring(0, 500)}` };
        } else {
            return { success: true, message: "No materials found to load.", debugInfo: `Raw S4/HANA Response: ${rawResponse}` };
        }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { success: false, message: 'An error occurred during the material loading process.', debugInfo: errorMessage };
    }
}

