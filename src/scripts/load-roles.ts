// To execute this script, run `npm run load-roles` in your terminal.
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, runTransaction, collection } from 'firebase/firestore';
import { format } from 'date-fns';

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "hotel-supply-hub-ssw5p",
  "appId": "1:491836302462:web:21762b108139554ea2242f",
  "storageBucket": "hotel-supply-hub-ssw5p.firebasestorage.app",
  "apiKey": "AIzaSyDRi881YXJtIG_LnTiKHQtumnA9eKxhGHw",
  "authDomain": "hotel-supply-hub-ssw5p.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "491836302462"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const rolesToLoad = [
    {
        name: 'Administrador de compras',
        description: 'Administrador de las compras y los usuarios de compras',
        isActive: true,
        createdBy: 'system'
    },
];

async function loadRoles() {
    console.log('Starting to load roles...');

    const counterRef = doc(db, 'counters', 'roles_counter');
    const rolesCollectionRef = collection(db, 'roles');

    for (const roleData of rolesToLoad) {
        try {
            const newRoleId = await runTransaction(db, async (transaction) => {
                const counterDoc = await transaction.get(counterRef);
                let nextId = 1;
                if (counterDoc.exists()) {
                    nextId = counterDoc.data().currentId + 1;
                }
                transaction.set(counterRef, { currentId: nextId });
                return nextId.toString();
            });

            const roleRef = doc(rolesCollectionRef, newRoleId);
            const newRole = {
                id: newRoleId,
                ...roleData,
                createdAt: format(new Date(), 'dd-MM-yyyy'),
            };

            await setDoc(roleRef, newRole);
            console.log(`Successfully loaded role: ${roleData.name} with ID: ${newRoleId}`);

        } catch (error) {
            console.error(`Error loading role "${roleData.name}":`, error);
        }
    }

    console.log('Finished loading roles.');
    // The script will exit automatically when the async operations are done.
    // We need to explicitly exit, otherwise it hangs.
    process.exit(0);
}

loadRoles();
