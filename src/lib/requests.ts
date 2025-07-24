
import { db } from './firebase';
import { collection, query, where, getDocs, writeBatch, doc, runTransaction } from 'firebase/firestore';
import type { ProductRequest, StoredRequest } from './types';

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

export const getRequestsForPeriod = async (center: string, warehouseCode: string, startDate: Date, endDate: Date): Promise<string[]> => {
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
        const datesWithRequests: Set<string> = new Set();
        querySnapshot.forEach((doc) => {
            const data = doc.data() as StoredRequest;
            datesWithRequests.add(data.requestDate);
        });
        return Array.from(datesWithRequests);
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
