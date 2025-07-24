
import { db } from './firebase';
import { collection, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';
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

  // Create a query to find existing documents for the same center, warehouse and date
  const q = query(
    requestsRef,
    where('center', '==', center),
    where('warehouseCode', '==', warehouseCode),
    where('requestDate', '==', requestDate)
  );

  const batch = writeBatch(db);

  try {
    // Get all documents that match the query to delete them
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Add new documents for products with quantity > 0
    if (products.length > 0) {
      const validProducts = products.filter(p => p.quantity > 0);
      validProducts.forEach((product) => {
        const newRequestRef = doc(requestsRef);
        batch.set(newRequestRef, {
          center,
          warehouseCode,
          requestDate,
          catalog: requestData.catalog,
          productCode: product.materialCode,
          quantity: product.quantity,
          notes: product.notes,
        });
      });
    }
    
    // Commit the batch
    await batch.commit();
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
