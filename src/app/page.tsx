"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { ProductsTable } from '@/components/products-table';
import { PageHeader } from '@/components/page-header';
import type { Center, Warehouse, Catalog, EnabledDays, Material } from '@/lib/types';
import { centers, warehouses, catalogs, enabledDays, materials } from '@/lib/data';
import { addMonths, startOfMonth } from 'date-fns';

export default function Home() {
  const [selectedCenter, setSelectedCenter] = useState<string>('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [selectedCatalog, setSelectedCatalog] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const [isDateSelectionActive, setDateSelectionActive] = useState(false);
  const [isProductsVisible, setProductsVisible] = useState(false);

  const availableWarehouses = useMemo(() => {
    return warehouses.filter((w) => w.centerId === selectedCenter);
  }, [selectedCenter]);

  const availableCatalogs = useMemo(() => {
    return catalogs.filter(
      (c) => c.centerId === selectedCenter && c.warehouseCode === selectedWarehouse
    );
  }, [selectedCenter, selectedWarehouse]);
  
  const enabledDaysForCatalog = useMemo(() => {
    if (!selectedCenter || !selectedCatalog) return [];
    const rule = enabledDays.find(
      (r) => r.centerId === selectedCenter && r.catalogName === selectedCatalog
    );
    return rule ? rule.days : [];
  }, [selectedCenter, selectedCatalog]);

  const filteredMaterials = useMemo(() => {
    return materials.filter(m => m.center === selectedCenter && m.catalog === selectedCatalog);
  }, [selectedCenter, selectedCatalog]);

  useEffect(() => {
    setSelectedWarehouse('');
    setSelectedCatalog('');
    setDateSelectionActive(false);
    setProductsVisible(false);
    setSelectedDate(undefined);
  }, [selectedCenter]);

  useEffect(() => {
    setSelectedCatalog('');
    setDateSelectionActive(false);
    setProductsVisible(false);
    setSelectedDate(undefined);
  }, [selectedWarehouse]);

  useEffect(() => {
      setDateSelectionActive(false);
      setProductsVisible(false);
      setSelectedDate(undefined);
      if (selectedCatalog) {
        // When a catalog is selected, we don't automatically show the calendar.
        // The user must click the button.
      }
  }, [selectedCatalog]);


  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const isDayDisabled = (day: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of today for comparison
    // Disable past dates
    if (day < today) return true;
    
    // Disable based on catalog rules
    const dayOfWeek = day.getDay();
    return !enabledDaysForCatalog.includes(dayOfWeek);
  };

  const today = new Date();
  const fromMonth = startOfMonth(today);
  const toMonth = startOfMonth(addMonths(today, 1));
  
  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader />
      <main className="flex-grow container mx-auto p-4 md:p-8 space-y-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Destinatario y Catálogo</CardTitle>
            <CardDescription>
              Seleccione el centro, almacén y catálogo para realizar su solicitud.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border p-4 rounded-md">
                  <h3 className="text-lg font-semibold mb-4">Destinatario</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                          <label htmlFor="center-select" className="text-sm font-medium">Centro</label>
                          <Select value={selectedCenter} onValueChange={setSelectedCenter}>
                          <SelectTrigger id="center-select" className="bg-white">
                              <SelectValue placeholder="Seleccione un centro" />
                          </SelectTrigger>
                          <SelectContent>
                              {centers.map((center) => (
                              <SelectItem key={center.id} value={center.id}>
                                  {center.id} - {center.name}
                              </SelectItem>
                              ))}
                          </SelectContent>
                          </Select>
                      </div>
                      <div className="space-y-2">
                          <label htmlFor="warehouse-select" className="text-sm font-medium">Almacén</label>
                          <Select
                          value={selectedWarehouse}
                          onValueChange={setSelectedWarehouse}
                          disabled={!selectedCenter}
                          >
                          <SelectTrigger id="warehouse-select" className="bg-white">
                              <SelectValue placeholder="Seleccione un almacén" />
                          </SelectTrigger>
                          <SelectContent>
                              {availableWarehouses.map((wh) => (
                              <SelectItem key={wh.warehouseCode} value={wh.warehouseCode}>
                                  {wh.warehouseCode} - {wh.warehouseDescription}
                              </SelectItem>
                              ))}
                          </SelectContent>
                          </Select>
                      </div>
                  </div>
              </div>

              <div className="border p-4 rounded-md">
                  <h3 className="text-lg font-semibold mb-4">Catálogo</h3>
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                        <label htmlFor="catalog-select" className="text-sm font-medium">Catálogo</label>
                        <Select
                        value={selectedCatalog}
                        onValueChange={setSelectedCatalog}
                        disabled={!selectedWarehouse}
                        >
                        <SelectTrigger id="catalog-select" className="bg-white">
                            <SelectValue placeholder="Seleccione un catálogo" />
                        </SelectTrigger>
                        <SelectContent>
                            {availableCatalogs.map((cat) => (
                            <SelectItem key={cat.catalogName} value={cat.catalogName}>
                                {cat.catalogName}
                            </SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                    </div>
                  </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={() => setDateSelectionActive(true)} disabled={!selectedCatalog}>
              Activar calendario de solicitud
            </Button>
          </CardFooter>
        </Card>

        {isDateSelectionActive && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Fecha de Solicitud</CardTitle>
              <CardDescription>
                Seleccione una fecha para su pedido en el calendario.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <div className="w-full flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  numberOfMonths={2}
                  fromMonth={fromMonth}
                  toMonth={toMonth}
                  disabled={isDayDisabled}
                  disableNavigation
                  className="rounded-md border bg-white"
                />
              </div>
            </CardContent>
            <CardFooter className="flex-col items-center gap-4">
              <Button onClick={() => setProductsVisible(true)} disabled={!selectedDate}>
                Añadir Productos
              </Button>
            </CardFooter>
          </Card>
        )}

        {isProductsVisible && selectedDate && (
          <ProductsTable 
            materials={filteredMaterials} 
            requestData={{
              center: selectedCenter,
              warehouseCode: selectedWarehouse,
              catalog: selectedCatalog,
              requestDate: selectedDate.toISOString().split('T')[0]
            }}
          />
        )}
      </main>
    </div>
  );
}
