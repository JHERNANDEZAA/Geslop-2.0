
export type Center = {
  id: string;
  name: string;
};

export type Warehouse = {
  centerId: string;
  warehouseCode: string;
  warehouseDescription: string;
};

export type Catalog = {
  centerId: string;
  warehouseCode: string;
  catalogName: string;
};

export type EnabledDays = {
  centerId: string;
  catalogName: string;
  days: number[]; // 0 for Sunday, 1 for Monday, etc.
};

export type Material = {
  materialCode: string;
  materialDescription: string;
  center: string;
  catalog: string;
  location: string;
  rounding: number;
  trafficLight: 'green' | 'yellow' | 'red';
  unit: string;
  price: number;
  familyCode: string;
  familyDescription: string;
};

export type ProductRequest = {
  materialCode: string;
  quantity: number;
  notes: string;
  sentToSap: 'X' | '';
  user?: string;
  creationDate?: string;
};

export type RequestHeader = {
  id: string; // Firestore ID
  center: string;
  warehouseCode: string;
  requestDate: string; // DD-MM-YYYY
  user: string;
  catalog: string;
  sentToSap: 'X' | '';
  costCenter: string; 
  creationDate: string; // DD-MM-YYYY
};

export type RequestPosition = {
  id?: string; // Firestore ID
  requestId: string;
  productCode: string;
  quantity: number;
  notes: string;
  creationDate: string; // ISO String
  user: string;
};


export type RequestInfo = {
  date: string; // YYYY-MM-DD for calendar highlighting
  hasRequest: boolean;
  sentToSap: boolean;
}
