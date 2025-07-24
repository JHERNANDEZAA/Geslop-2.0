import type { Center, Warehouse, Catalog, EnabledDays, Material } from './types';

export const centers: Center[] = [
  { id: 'CATA', name: 'Catarina' },
  { id: 'GHVC', name: 'Villa del Conde' },
  { id: 'BAOB', name: 'Hotel Baobab' },
];

export const warehouses: Warehouse[] = [
  { centerId: 'CATA', warehouseCode: 'CACG', warehouseDescription: 'Cocina general' },
  { centerId: 'GHVC', warehouseCode: 'VCCF', warehouseDescription: 'Cafetería' },
  { centerId: 'BAOB', warehouseCode: 'BABB', warehouseDescription: 'Bar R.Burton' },
  { centerId: 'BAOB', warehouseCode: 'BACO', warehouseDescription: 'Cocina' },
  { centerId: 'BAOB', warehouseCode: 'BAEC', warehouseDescription: 'Economato' },
  { centerId: 'GHVC', warehouseCode: 'VCCO', warehouseDescription: 'Cocina' },
  { centerId: 'GHVC', warehouseCode: 'VCBA', warehouseDescription: 'Bar Azotea' },
  { centerId: 'CATA', warehouseCode: 'CAMN', warehouseDescription: 'Mantenimiento' },
];

export const catalogs: Catalog[] = [
  { centerId: 'CATA', warehouseCode: 'CACG', catalogName: 'Bebidas' },
  { centerId: 'GHVC', warehouseCode: 'VCCF', catalogName: 'Bollería' },
  { centerId: 'BAOB', warehouseCode: 'BABB', catalogName: 'Comidas' },
  { centerId: 'BAOB', warehouseCode: 'BACO', catalogName: 'Frutas y verduras' },
  { centerId: 'BAOB', warehouseCode: 'BAEC', catalogName: 'Seco' },
  { centerId: 'GHVC', warehouseCode: 'VCCO', catalogName: 'Hortalizas' },
  { centerId: 'GHVC', warehouseCode: 'VCBA', catalogName: 'Zumos' },
  { centerId: 'CATA', warehouseCode: 'CAMN', catalogName: 'Limpieza' },
];

// 0: Domingo, 1: Lunes, 2: Martes, 3: Miércoles, 4: Jueves, 5: Viernes, 6: Sábado
export const enabledDays: EnabledDays[] = [
  { centerId: 'CATA', catalogName: 'Bebidas', days: [1] },
  { centerId: 'GHVC', catalogName: 'Bollería', days: [2] },
  { centerId: 'BAOB', catalogName: 'Comidas', days: [1, 5] },
  { centerId: 'BAOB', catalogName: 'Frutas y verduras', days: [1, 2, 3] },
  { centerId: 'BAOB', catalogName: 'Seco', days: [4, 6] },
  { centerId: 'GHVC', catalogName: 'Hortalizas', days: [0] },
  { centerId: 'GHVC', catalogName: 'Zumos', days: [2, 5, 0] },
  { centerId: 'CATA', catalogName: 'Limpieza', days: [1, 2, 3, 4, 5] },
];

export const materials: Material[] = [
  { materialCode: '3000256', materialDescription: 'Potaje', center: 'BAOB', catalog: 'Comidas', location: 'A1', rounding: 1, trafficLight: 'green', unit: 'KG', price: 5.50, familyCode: 'F01', familyDescription: 'Platos preparados' },
  { materialCode: '3000260', materialDescription: 'Crema zanahoria', center: 'BAOB', catalog: 'Comidas', location: 'A2', rounding: 1, trafficLight: 'green', unit: 'L', price: 3.20, familyCode: 'F01', familyDescription: 'Platos preparados' },
  { materialCode: '8000147', materialDescription: 'Manzana roja', center: 'BAOB', catalog: 'Frutas y verduras', location: 'F1', rounding: 1, trafficLight: 'yellow', unit: 'KG', price: 1.80, familyCode: 'F02', familyDescription: 'Frutas' },
  { materialCode: '8000123', materialDescription: 'Calabacín', center: 'BAOB', catalog: 'Frutas y verduras', location: 'V1', rounding: 1, trafficLight: 'green', unit: 'KG', price: 1.20, familyCode: 'F03', familyDescription: 'Verduras' },
  { materialCode: '5000001', materialDescription: 'Detergente', center: 'CATA', catalog: 'Limpieza', location: 'C1', rounding: 1, trafficLight: 'green', unit: 'Botella', price: 4.00, familyCode: 'F04', familyDescription: 'Productos limpieza' },
  { materialCode: '5000002', materialDescription: 'Lejía', center: 'CATA', catalog: 'Limpieza', location: 'C2', rounding: 1, trafficLight: 'red', unit: 'Botella', price: 1.50, familyCode: 'F04', familyDescription: 'Productos limpieza' },
  { materialCode: '5000003', materialDescription: 'Fregasuelos', center: 'CATA', catalog: 'Limpieza', location: 'C3', rounding: 1, trafficLight: 'green', unit: 'Botella', price: 2.10, familyCode: 'F04', familyDescription: 'Productos limpieza' },
  { materialCode: '8000004', materialDescription: 'Pimiento', center: 'GHVC', catalog: 'Hortalizas', location: 'V2', rounding: 1, trafficLight: 'green', unit: 'KG', price: 2.50, familyCode: 'F03', familyDescription: 'Verduras' },
  { materialCode: '8000005', materialDescription: 'Cebollas', center: 'GHVC', catalog: 'Hortalizas', location: 'V3', rounding: 1, trafficLight: 'green', unit: 'KG', price: 1.10, familyCode: 'F03', familyDescription: 'Verduras' },
  { materialCode: '8000006', materialDescription: 'Ajo', center: 'GHVC', catalog: 'Hortalizas', location: 'V4', rounding: 1, trafficLight: 'yellow', unit: 'Malla', price: 1.90, familyCode: 'F03', familyDescription: 'Verduras' },
  { materialCode: '8000007', materialDescription: 'Puerro', center: 'GHVC', catalog: 'Hortalizas', location: 'V5', rounding: 1, trafficLight: 'green', unit: 'Manojo', price: 1.30, familyCode: 'F03', familyDescription: 'Verduras' },
  { materialCode: '8001415', materialDescription: 'Z. Papaya', center: 'GHVC', catalog: 'Zumos', location: 'B1', rounding: 1, trafficLight: 'green', unit: 'Litro', price: 2.80, familyCode: 'F05', familyDescription: 'Bebidas' },
  { materialCode: '8001416', materialDescription: 'Z. Melocotón', center: 'GHVC', catalog: 'Zumos', location: 'B2', rounding: 1, trafficLight: 'green', unit: 'Litro', price: 2.20, familyCode: 'F05', familyDescription: 'Bebidas' },
  { materialCode: '8001417', materialDescription: 'Z. Pera', center: 'GHVC', catalog: 'Zumos', location: 'B3', rounding: 1, trafficLight: 'red', unit: 'Litro', price: 2.30, familyCode: 'F05', familyDescription: 'Bebidas' },
  { materialCode: '8000100', materialDescription: 'Magdalena', center: 'GHVC', catalog: 'Bollería', location: 'P1', rounding: 12, trafficLight: 'green', unit: 'Caja', price: 8.00, familyCode: 'F06', familyDescription: 'Pastelería' },
  { materialCode: '8000101', materialDescription: 'Herradura', center: 'GHVC', catalog: 'Bollería', location: 'P2', rounding: 6, trafficLight: 'green', unit: 'Caja', price: 9.50, familyCode: 'F06', familyDescription: 'Pastelería' },
  { materialCode: '8000102', materialDescription: 'Azúcar', center: 'GHVC', catalog: 'Bollería', location: 'S1', rounding: 1, trafficLight: 'green', unit: 'KG', price: 1.00, familyCode: 'F07', familyDescription: 'Secos' },
  { materialCode: '8000103', materialDescription: 'Aceite', center: 'GHVC', catalog: 'Bollería', location: 'S2', rounding: 1, trafficLight: 'yellow', unit: 'Litro', price: 3.50, familyCode: 'F07', familyDescription: 'Secos' },
  { materialCode: '8000104', materialDescription: 'Harina', center: 'GHVC', catalog: 'Bollería', location: 'S3', rounding: 1, trafficLight: 'green', unit: 'KG', price: 0.90, familyCode: 'F07', familyDescription: 'Secos' },
];
