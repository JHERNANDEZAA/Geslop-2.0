"use client"

import React, { useState, useMemo } from 'react';
import type { Material, ProductRequest } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from "@/hooks/use-toast"

interface ProductsTableProps {
  materials: Material[];
  requestData: {
    center: string;
    warehouseCode: string;
    catalog: string;
    requestDate: string;
  }
}

const ITEMS_PER_PAGE = 50;

export function ProductsTable({ materials, requestData }: ProductsTableProps) {
  const { toast } = useToast()
  const [filters, setFilters] = useState({
    materialCode: '',
    materialDescription: '',
    familyCode: '',
    familyDescription: '',
  });
  const [productRequests, setProductRequests] = useState<Record<string, ProductRequest>>({});
  const [currentPage, setCurrentPage] = useState(0);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(0);
  };
  
  const handleRequestChange = (materialCode: string, field: 'quantity' | 'notes', value: string | number) => {
    setProductRequests(prev => {
      const currentRequest = prev[materialCode] || { materialCode, quantity: 0, notes: '' };
      if (field === 'quantity') {
        const numValue = Number(value);
        if (numValue < 0) return prev;
        return {
          ...prev,
          [materialCode]: { ...currentRequest, quantity: numValue }
        };
      }
      return {
        ...prev,
        [materialCode]: { ...currentRequest, notes: String(value) }
      };
    });
  };

  const filteredMaterials = useMemo(() => {
    return materials.filter(m => 
      m.materialCode.toLowerCase().includes(filters.materialCode.toLowerCase()) &&
      m.materialDescription.toLowerCase().includes(filters.materialDescription.toLowerCase()) &&
      m.familyCode.toLowerCase().includes(filters.familyCode.toLowerCase()) &&
      m.familyDescription.toLowerCase().includes(filters.familyDescription.toLowerCase())
    );
  }, [materials, filters]);

  const paginatedMaterials = useMemo(() => {
    const start = currentPage * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredMaterials.slice(start, end);
  }, [filteredMaterials, currentPage]);
  
  const totalPages = Math.ceil(filteredMaterials.length / ITEMS_PER_PAGE);

  const handleSubmit = () => {
    const finalRequest = {
      ...requestData,
      products: Object.values(productRequests).filter(p => p.quantity > 0)
    };
    
    // In a real app, this would be an API call.
    console.log("Solicitud enviada:", finalRequest);
    
    toast({
      title: "Solicitud Enviada",
      description: `Se ha procesado su solicitud para el centro ${requestData.center}, almacén ${requestData.warehouseCode} en la fecha ${requestData.requestDate}.`,
      variant: "default",
      className: "bg-accent text-accent-foreground"
    })
  };

  const TrafficLight = ({ color }: { color: 'green' | 'yellow' | 'red' }) => {
    const colorClass = {
        green: 'bg-green-500',
        yellow: 'bg-yellow-500',
        red: 'bg-red-500'
    }[color];
    return <div className={`h-4 w-4 rounded-full ${colorClass}`} />;
  }

  return (
    <Card className="shadow-lg rounded-none border-x-0">
      <CardHeader>
        <CardTitle>Productos SAP</CardTitle>
        <CardDescription>Filtre y seleccione las cantidades de los productos que desea solicitar.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="p-4 border rounded-lg bg-gray-50/50 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <Input name="materialCode" placeholder="Código de producto" onChange={handleFilterChange} value={filters.materialCode} />
            <Input name="materialDescription" placeholder="Descripción de producto" onChange={handleFilterChange} value={filters.materialDescription} />
            <Input name="familyCode" placeholder="Código de familia" onChange={handleFilterChange} value={filters.familyCode}/>
            <Input name="familyDescription" placeholder="Descripción de familia" onChange={handleFilterChange} value={filters.familyDescription}/>
          </div>
          <div className="flex justify-start gap-2">
            <Button variant="outline">Favoritos</Button>
            <Button variant="outline">Última solicitud</Button>
            <Button onClick={handleSubmit} className="bg-accent hover:bg-accent/90">Solicitar</Button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Código material</TableHead>
                        <TableHead>Descripción material</TableHead>
                        <TableHead>Ubicación</TableHead>
                        <TableHead>Redondeo</TableHead>
                        <TableHead>Semáforo</TableHead>
                        <TableHead className="w-28">Cantidad</TableHead>
                        <TableHead>Unidad</TableHead>
                        <TableHead>Precio</TableHead>
                        <TableHead className="w-64">Observaciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {paginatedMaterials.map(material => (
                        <TableRow key={material.materialCode}>
                            <TableCell>{material.materialCode}</TableCell>
                            <TableCell>{material.materialDescription}</TableCell>
                            <TableCell>{material.location}</TableCell>
                            <TableCell>{material.rounding}</TableCell>
                            <TableCell><TrafficLight color={material.trafficLight} /></TableCell>
                            <TableCell>
                                <Input 
                                  type="number" 
                                  min="0"
                                  value={productRequests[material.materialCode]?.quantity || ''}
                                  onChange={(e) => handleRequestChange(material.materialCode, 'quantity', e.target.value)}
                                  className="w-24"
                                />
                            </TableCell>
                            <TableCell>{material.unit}</TableCell>
                            <TableCell>{material.price.toFixed(2)}€</TableCell>
                            <TableCell>
                                <Textarea 
                                  maxLength={300} 
                                  value={productRequests[material.materialCode]?.notes || ''}
                                  onChange={(e) => handleRequestChange(material.materialCode, 'notes', e.target.value)}
                                  className="w-full"
                                />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>

        <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">
                    Página {currentPage + 1} de {totalPages}
                </p>
                <Button variant="outline" onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0}>
                Anterior
                </Button>
                <Button variant="outline" onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))} disabled={currentPage === totalPages - 1}>
                Siguiente
                </Button>
            </div>
            <Button onClick={handleSubmit} className="bg-accent hover:bg-accent/90">Solicitar</Button>
        </div>
      </CardContent>
    </Card>
  );
}
