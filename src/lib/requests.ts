
import { db } from './firebase';
import { collection, query, where, getDocs, writeBatch, doc, runTransaction } from 'firebase/firestore';
import type { ProductRequest, StoredRequest, RequestInfo } from './types';

interface RequestData {
  center: string;
  warehouseCode: string;
  catalog: string;
  requestDate: string;
  products: ProductRequest[];
}

export const saveRequest = async (requestData: RequestData) => {
    const { center, warehouseCode, requestDate, products } = requestData;
  
    const requestsRef = collection(db, 'requests');
  
    const q = query(
      requestsRef,
      where('center', '==', center),
      where('warehouseCode', '==', warehouseCode),
      where('requestDate', '==', requestDate)
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
        validProducts.forEach((product) => {
          const newRequestRef = doc(requestsRef);
          transaction.set(newRequestRef, {
            center,
            warehouseCode,
            requestDate,
            catalog: requestData.catalog,
            productCode: product.materialCode,
            quantity: product.quantity,
            notes: product.notes,
            sentToSap: '', // Always save with an empty string
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
  
  const q = query(
    requestsRef,
    where('center', '==', center),
    where('warehouseCode', '==', warehouseCode),
    where('requestDate', '==', requestDate)
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
    const q = query(
        requestsRef,
        where('center', '==', center),
        where('warehouseCode', '==', warehouseCode),
        where('requestDate', '>=', startDate.toISOString().split('T')[0]),
        where('requestDate', '<=', endDate.toISOString().split('T')[0])
    );

    try {
        const querySnapshot = await getDocs(q);
        const requestsByDate: Record<string, { hasRequest: boolean, sentToSap: boolean }> = {};

        querySnapshot.forEach((doc) => {
            const data = doc.data() as StoredRequest;
            if (!requestsByDate[data.requestDate]) {
                requestsByDate[data.requestDate] = { hasRequest: false, sentToSap: false };
            }
            requestsByDate[data.requestDate].hasRequest = true;
            if (data.sentToSap === 'X') {
                requestsByDate[data.requestDate].sentToSap = true;
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
    const q = query(
        requestsRef,
        where('center', '==', center),
        where('warehouseCode', '==', warehouseCode),
        where('requestDate', '==', requestDate)
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
                sentToSap: data.sentToSap || ''
            });
        });
        return requests;
    } catch (error) {
        console.error("Error fetching requests for date: ", error);
        return [];
    }
}

    