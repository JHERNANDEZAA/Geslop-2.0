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

export type CatalogAdmin = {
  id: string; // Catalog ID
  description: string;
  validFrom: string; // DD-MM-YYYY
  validTo: string; // DD-MM-YYYY
  status: 'locked' | 'unlocked';
  type: 'C' | 'T'; // C: Compras, T: Traspaso
  numDays: number;
  salesOrg: string;
  purchaseGroup: string;
  maxAnticipationDays: number;
  minAnticipationDays: number;
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
  id: number; // Firestore ID
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
  requestId: number;
  productCode: string;
  quantity: number;
  notes: string;
  creationDate: string; // DD-MM-YYYY
  user: string;
};


export type RequestInfo = {
  date: string; // YYYY-MM-DD for calendar highlighting
  hasRequest: boolean;
  sentToSap: boolean;
}

export type Role = {
    id: string;
    name: string;
    description: string;
    createdAt: string; // DD-MM-YYYY
    createdBy: string;
    isActive: boolean;
    isAdministrator?: boolean;
    apps?: string[];
};

export type AppDefinition = {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  isAdmin?: boolean;
  route: string;
};

export type AppDefinitionDB = Omit<AppDefinition, 'icon'> & {
    iconName: string;
};

export type UserProfile = {
  uid: string;
  email: string;
  fullName: string;
  roles: string[]; // Array of role IDs
  isAdministrator?: boolean;
};

export interface ServiceAccount {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
  universe_domain: string;
}
