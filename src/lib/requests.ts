
import { db } from './firebase';
import { collection, query, where, getDocs, writeBatch, doc, runTransaction, getDoc, collectionGroup } from 'firebase/firestore';
import type { ProductRequest, RequestInfo, RequestHeader, RequestPosition } from './types';
import { format, parse, isWithinInterval } from 'date-fns';

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

    const requestDateObject = parse(requestDate, 'dd-MM-yyyy', new Date());
    const queryableDate = format(requestDateObject, 'yyyy-MM-dd');

    const headersRef = collection(db, 'request_headers');
    const positionsRef = collection(db, 'request_positions');

    // Find existing header to update or create a new one
    const q = query(
        headersRef,
        where('center', '==', center),
        where('warehouseCode', '==', warehouseCode),
        where('requestDate', '==', queryableDate)
    );

    try {
        await runTransaction(db, async (transaction) => {
            const querySnapshot = await getDocs(q);
            let headerId: string;

            // If header exists, delete its old positions. If not, create a new header.
            if (!querySnapshot.empty) {
                const existingHeaderDoc = querySnapshot.docs[0];
                headerId = existingHeaderDoc.id;

                // Delete old positions associated with this header
                const oldPositionsQuery = query(positionsRef, where('requestId', '==', headerId));
                const oldPositionsSnapshot = await getDocs(oldPositionsQuery);
                oldPositionsSnapshot.forEach(doc => {
                    transaction.delete(doc.ref);
                });

            } else {
                // Create new header
                const newHeaderRef = doc(headersRef);
                headerId = newHeaderRef.id;
                const newHeader: RequestHeader = {
                    center,
                    warehouseCode,
                    requestDate: queryableDate,
                    user,
                    catalog,
                    sentToSap: '',
                    costCenter: '', // Set default cost center
                    creationDate: new Date().toISOString(),
                };
                transaction.set(newHeaderRef, newHeader);
            }

            // Add new positions for products with quantity > 0
            const validProducts = products.filter(p => p.quantity > 0);
            const creationDate = new Date().toISOString();

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
    const requestDateObject = parse(requestDate, 'dd-MM-yyyy', new Date());
    const queryableDate = format(requestDateObject, 'yyyy-MM-dd');
    
    const headersRef = collection(db, 'request_headers');
    const q = query(
        headersRef,
        where('center', '==', center),
        where('warehouseCode', '==', warehouseCode),
        where('requestDate', '==', queryableDate)
    );

    try {
        await runTransaction(db, async (transaction) => {
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) {
                console.log("No request found to delete.");
                return;
            }

            const headerDoc = querySnapshot.docs[0];
            const headerId = headerDoc.id;

            // Delete positions
            const positionsRef = collection(db, 'request_positions');
            const positionsQuery = query(positionsRef, where('requestId', '==', headerId));
            const positionsSnapshot = await getDocs(positionsQuery);
            positionsSnapshot.forEach(doc => {
                transaction.delete(doc.ref);
            });
            
            // Delete header
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
            const requestDate = parse(data.requestDate, 'yyyy-MM-dd', new Date());

            if (isWithinInterval(requestDate, { start: startDate, end: endDate })) {
                const highlightDate = data.requestDate;
                
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
    
    const requestDateObject = parse(requestDate, 'dd-MM-yyyy', new Date());
    const queryableDate = format(requestDateObject, 'yyyy-MM-dd');
    
    const headersRef = collection(db, 'request_headers');
    const q = query(
        headersRef,
        where('center', '==', center),
        where('warehouseCode', '==', warehouseCode),
        where('requestDate', '==', queryableDate)
    );

    try {
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            return [];
        }

        const headerDoc = querySnapshot.docs[0];
        const headerId = headerDoc.id;
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
