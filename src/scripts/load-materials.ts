// To execute this script, run `npm run load-materials` in your terminal.
import 'dotenv/config';
import { db } from '../lib/firebase';
import { collection, writeBatch } from 'firebase/firestore';

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
            const errorText = await response.text();
            throw new Error(`Failed to fetch data from S4/HANA: ${response.status} ${response.statusText}. Details: ${errorText}`);
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
        const docRef = collection(materialsCollection, material.SAP_UUID);
        batch.set(docRef, material);
    });

    try {
        await batch.commit();
        console.log(`Successfully stored ${materials.length} materials in Firestore.`);
    } catch (error) {
        console.error("Error storing materials in Firestore:", error);
        throw error;
    }
}

async function main() {
    try {
        console.log("Fetching materials from S4/HANA...");
        const materials = await fetchHanaMaterials();
        
        if (materials && materials.length > 0) {
            console.log(`Fetched ${materials.length} materials. Storing in Firestore...`);
            await storeMaterialsInFirestore(materials);
            console.log("Data load complete.");
        } else {
            console.log("No materials found to load.");
        }
    } catch (error) {
        console.error("An error occurred during the material loading process:", error);
        process.exit(1);
    }
}

main();
