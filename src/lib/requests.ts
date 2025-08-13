
import { db } from './firebase';
import { collection, query, where, getDocs, writeBatch, doc, runTransaction, getDoc, collectionGroup, setDoc } from 'firebase/firestore';
import type { ProductRequest, RequestInfo, RequestHeader, RequestPosition } from './types';
import { format, parse, isWithinInterval, startOfDay } from 'date-fns';

interface RequestData {
  center: string;
  warehouseCode: string;
  catalog: string;
  requestDate: string;
  user: string;
  products: ProductRequest[];
}

export const saveRequest = async (requestData: RequestData) => {
    const { center, warehouseCode, requestDate, products, user, catalog } = requestData;

    const spanishRequestDate = requestDate; // Already in DD-MM-YYYY

    const headersRef = collection(db, 'request_headers');
    const positionsRef = collection(db, 'request_positions');

    const q = query(
        headersRef,
        where('center', '==', center),
        where('warehouseCode', '==', warehouseCode),
        where('requestDate', '==', spanishRequestDate)
    );

    try {
        await runTransaction(db, async (transaction) => {
            const querySnapshot = await getDocs(q);
            let headerId: number;
            let headerDocRef;

            if (!querySnapshot.empty) {
                const existingHeaderDoc = querySnapshot.docs[0];
                headerId = existingHeaderDoc.data().id;
                headerDocRef = existingHeaderDoc.ref;
                
                const oldPositionsQuery = query(positionsRef, where('requestId', '==', headerId));
                const oldPositionsSnapshot = await getDocs(oldPositionsQuery);
                oldPositionsSnapshot.forEach(doc => {
                    transaction.delete(doc.ref);
                });

            } else {
                // Get new incremental ID
                const counterRef = doc(db, 'counters', 'request_header_counter');
                const counterDoc = await transaction.get(counterRef);
                
                let nextId = 1;
                if (counterDoc.exists()) {
                    nextId = counterDoc.data().currentId + 1;
                }
                
                headerId = nextId;
                headerDocRef = doc(headersRef, headerId.toString());

                const newHeader: RequestHeader = {
                    id: headerId,
                    center,
                    warehouseCode,
                    requestDate: spanishRequestDate,
                    user,
                    catalog,
                    sentToSap: '',
                    costCenter: '',
                    creationDate: format(new Date(), 'dd-MM-yyyy'),
                };
                transaction.set(headerDocRef, newHeader);
                transaction.set(counterRef, { currentId: nextId });
            }

            const validProducts = products.filter(p => p.quantity > 0);
            const creationDate = format(new Date(), 'dd-MM-yyyy');

            validProducts.forEach((product) => {
                const newPositionRef = doc(positionsRef);
                const newPosition: RequestPosition = {
                    requestId: headerId,
                    productCode: product.materialCode,
                    quantity: product.quantity,
                    notes: product.notes,
                    creationDate: creationDate,
                    user: user,
                };
                transaction.set(newPositionRef, newPosition);
            });
        });
        console.log('Request saved successfully');
    } catch (error) {
        console.error('Error saving request: ', error);
        throw error;
    }
};

export const deleteRequest = async (center: string, warehouseCode: string, requestDate: string) => {
    const spanishRequestDate = requestDate;
    
    const headersRef = collection(db, 'request_headers');
    const q = query(
        headersRef,
        where('center', '==', center),
        where('warehouseCode', '==', warehouseCode),
        where('requestDate', '==', spanishRequestDate)
    );

    try {
        await runTransaction(db, async (transaction) => {
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) {
                console.log("No request found to delete.");
                return;
            }

            const headerDoc = querySnapshot.docs[0];
            const headerId = headerDoc.data().id;

            const positionsRef = collection(db, 'request_positions');
            const positionsQuery = query(positionsRef, where('requestId', '==', headerId));
            const positionsSnapshot = await getDocs(positionsQuery);
            positionsSnapshot.forEach(doc => {
                transaction.delete(doc.ref);
            });
            
            transaction.delete(headerDoc.ref);
        });
        console.log('Request deleted successfully');
    } catch (error) {
        console.error('Error deleting request: ', error);
        throw error;
    }
};

export const getRequestsForPeriod = async (center: string, warehouseCode: string, startDate: Date, endDate: Date): Promise<RequestInfo[]> => {
    if (!center || !warehouseCode) return [];
    
    const headersRef = collection(db, 'request_headers');
    const q = query(
        headersRef,
        where('center', '==', center),
        where('warehouseCode', '==', warehouseCode)
    );

    try {
        const querySnapshot = await getDocs(q);
        const requestsByDate: Record<string, { hasRequest: boolean, sentToSap: boolean }> = {};

        querySnapshot.forEach((doc) => {
            const data = doc.data() as RequestHeader;
            // Dates are stored as DD-MM-YYYY, parse them to compare
            const requestDate = parse(data.requestDate, 'dd-MM-yyyy', new Date());

            if (isWithinInterval(startOfDay(requestDate), { start: startOfDay(startDate), end: startOfDay(endDate) })) {
                const highlightDate = format(requestDate, 'yyyy-MM-dd');
                
                if (!requestsByDate[highlightDate]) {
                    requestsByDate[highlightDate] = { hasRequest: true, sentToSap: false };
                }
                if (data.sentToSap === 'X') {
                    requestsByDate[highlightDate].sentToSap = true;
                }
            }
        });
        
        return Object.entries(requestsByDate).map(([date, info]) => ({
            date,
            hasRequest: info.hasRequest,
            sentToSap: info.sentToSap,
        }));

    } catch (error) {
        console.error("Error fetching requests for period: ", error);
        return [];
    }
};

export const getRequestsForDate = async (center: string, warehouseCode: string, requestDate: string): Promise<ProductRequest[]> => {
    if (!center || !warehouseCode || !requestDate) return [];
    
    const spanishRequestDate = requestDate;
    
    const headersRef = collection(db, 'request_headers');
    const q = query(
        headersRef,
        where('center', '==', center),
        where('warehouseCode', '==', warehouseCode),
        where('requestDate', '==', spanishRequestDate)
    );

    try {
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            return [];
        }

        const headerDoc = querySnapshot.docs[0];
        const headerId = headerDoc.data().id;
        const headerData = headerDoc.data() as RequestHeader;
        
        const positionsRef = collection(db, 'request_positions');
        const positionsQuery = query(positionsRef, where('requestId', '==', headerId));
        const positionsSnapshot = await getDocs(positionsQuery);

        const requests: ProductRequest[] = [];
        positionsSnapshot.forEach((doc) => {
            const data = doc.data() as RequestPosition;
            requests.push({
                materialCode: data.productCode,
                quantity: data.quantity,
                notes: data.notes,
                sentToSap: headerData.sentToSap,
                user: data.user,
                creationDate: data.creationDate
            });
        });
        return requests;
    } catch (error) {
        console.error("Error fetching requests for date: ", error);
        return [];
    }
}
