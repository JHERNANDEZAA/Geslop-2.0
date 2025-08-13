
import { db } from './firebase';
import { collection, query, where, getDocs, writeBatch, doc, runTransaction } from 'firebase/firestore';
import type { ProductRequest, StoredRequest, RequestInfo } from './types';
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
    const { center, warehouseCode, requestDate, products, user } = requestData;
  
    const requestsRef = collection(db, 'requests');
  
    // Firestore queries work best with a consistent format, like yyyy-MM-dd
    // We store a separate field for this.
    const requestDateObject = parse(requestDate, 'dd-MM-yyyy', new Date());
    const queryableDate = format(requestDateObject, 'yyyy-MM-dd');

    const q = query(
      requestsRef,
      where('center', '==', center),
      where('warehouseCode', '==', warehouseCode),
      where('queryableDate', '==', queryableDate)
    );
  
    try {
      await runTransaction(db, async (transaction) => {
        const querySnapshot = await getDocs(q);
  
        // Delete existing documents for this request
        querySnapshot.forEach((doc) => {
          transaction.delete(doc.ref);
        });
  
        // Add new documents for products with quantity > 0
        const validProducts = products.filter(p => p.quantity > 0);
        const creationDate = new Date().toISOString();
        validProducts.forEach((product) => {
          const newRequestRef = doc(requestsRef);
          transaction.set(newRequestRef, {
            center,
            warehouseCode,
            requestDate, // DD-MM-YYYY format
            queryableDate, // YYYY-MM-DD format for querying
            catalog: requestData.catalog,
            productCode: product.materialCode,
            quantity: product.quantity,
            notes: product.notes,
            sentToSap: '', // Always save with an empty string
            user: user,
            creationDate: creationDate,
          });
        });
      });
      console.log('Request saved successfully');
    } catch (error) {
      console.error('Error saving request: ', error);
      throw error;
    }
};

export const deleteRequest = async (center: string, warehouseCode: string, requestDate: string) => {
  const requestsRef = collection(db, 'requests');

  const requestDateObject = parse(requestDate, 'dd-MM-yyyy', new Date());
  const queryableDate = format(requestDateObject, 'yyyy-MM-dd');
  
  const q = query(
    requestsRef,
    where('center', '==', center),
    where('warehouseCode', '==', warehouseCode),
    where('queryableDate', '==', queryableDate)
  );

  try {
      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);
      querySnapshot.forEach((doc) => {
          batch.delete(doc.ref);
      });
      await batch.commit();
      console.log('Request deleted successfully');
  } catch (error) {
      console.error('Error deleting request: ', error);
      throw error;
  }
};

export const getRequestsForPeriod = async (center: string, warehouseCode: string, startDate: Date, endDate: Date): Promise<RequestInfo[]> => {
    if (!center || !warehouseCode) return [];
    
    const requestsRef = collection(db, 'requests');
    // Simplified query to avoid complex index requirements.
    // We fetch all requests for the center/warehouse and filter by date in the application.
    const q = query(
        requestsRef,
        where('center', '==', center),
        where('warehouseCode', '==', warehouseCode)
    );

    try {
        const querySnapshot = await getDocs(q);
        const requestsByDate: Record<string, { hasRequest: boolean, sentToSap: boolean }> = {};

        querySnapshot.forEach((doc) => {
            const data = doc.data() as StoredRequest;
            const requestDate = parse(data.queryableDate, 'yyyy-MM-dd', new Date());

            // Filter by date range on the client side
            if (isWithinInterval(requestDate, { start: startDate, end: endDate })) {
                const highlightDate = data.queryableDate;
                
                if (!requestsByDate[highlightDate]) {
                    requestsByDate[highlightDate] = { hasRequest: false, sentToSap: false };
                }
                requestsByDate[highlightDate].hasRequest = true;
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
    
    const requestsRef = collection(db, 'requests');
    
    const requestDateObject = parse(requestDate, 'dd-MM-yyyy', new Date());
    const queryableDate = format(requestDateObject, 'yyyy-MM-dd');
    
    const q = query(
        requestsRef,
        where('center', '==', center),
        where('warehouseCode', '==', warehouseCode),
        where('queryableDate', '==', queryableDate) // Query using the YYYY-MM-DD format
    );

    try {
        const querySnapshot = await getDocs(q);
        const requests: ProductRequest[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data() as StoredRequest;
            requests.push({
                materialCode: data.productCode,
                quantity: data.quantity,
                notes: data.notes,
                sentToSap: data.sentToSap || '',
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
