
"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth.tsx';
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
import { getRequestsForPeriod } from '@/lib/requests';
import { addMonths, subMonths, startOfMonth, endOfMonth, parseISO, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [selectedCenter, setSelectedCenter] = useState<string>('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [selectedCatalog, setSelectedCatalog] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [datesWithRequests, setDatesWithRequests] = useState<Date[]>([]);

  const [isDateSelectionActive, setDateSelectionActive] = useState(false);
  const [isProductsVisible, setProductsVisible] = useState(false);
  
  const dateSectionRef = useRef<HTMLDivElement>(null);
  const productsSectionRef = useRef<HTMLDivElement>(null);

  const currentMonth = useMemo(() => startOfMonth(new Date()), []);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

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
    setDatesWithRequests([]);
  }, [selectedCenter]);

  useEffect(() => {
    setSelectedCatalog('');
    setDateSelectionActive(false);
    setProductsVisible(false);
    setSelectedDate(undefined);
    setDatesWithRequests([]);
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
  
  useEffect(() => {
    if (isDateSelectionActive && dateSectionRef.current) {
      dateSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [isDateSelectionActive]);

  useEffect(() => {
    if (isProductsVisible && productsSectionRef.current) {
      productsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [isProductsVisible]);

  useEffect(() => {
    const fetchRequests = async () => {
        if (selectedCenter && selectedWarehouse && isDateSelectionActive) {
            const startDate = subMonths(currentMonth, 1);
            const endDate = addMonths(currentMonth, 1);
            const dates = await getRequestsForPeriod(selectedCenter, selectedWarehouse, startDate, endOfMonth(endDate));
            setDatesWithRequests(dates.map(d => parseISO(d)));
        }
    };
    fetchRequests();
  }, [selectedCenter, selectedWarehouse, isDateSelectionActive, currentMonth]);

  const handleShowCalendar = () => {
    setDateSelectionActive(true);
  };
  
  const handleShowProducts = () => {
    setProductsVisible(true);
  };

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
    // In JS, Sunday is 0, Monday is 1, etc.
    // The rule uses 0 for Sunday, 1 for Monday...
    return !enabledDaysForCatalog.includes(dayOfWeek);
  };

  const requestModifiers = {
    requested: datesWithRequests,
  };

  const requestModifiersClassNames = {
    requested: 'bg-orange-300',
  };

  if (loading || !user) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <PageHeader />
        <main className="flex-grow p-4">
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </main>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PageHeader />
      <main className="flex-grow flex flex-col">
        <Card className="shadow-lg rounded-none border-x-0 border-t-0 border-b-0">
          <CardHeader>
            <CardTitle>Destinatario y Catálogo</CardTitle>
            <CardDescription>
              Seleccione el centro, almacén y catálogo para realizar su solicitud.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-10 gap-6">
              <div className="border p-4 rounded-md md:col-span-7">
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

              <div className="border p-4 rounded-md md:col-span-3">
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
            <Button onClick={handleShowCalendar} disabled={!selectedCatalog}>
              Activar calendario de solicitud
            </Button>
          </CardContent>
        </Card>

        {isDateSelectionActive && (
          <Card ref={dateSectionRef} className="mt-4 shadow-lg rounded-none border-x-0 border-t-0 border-b-0">
            <CardHeader>
              <CardTitle>Fecha de Solicitud</CardTitle>
              <CardDescription>
                Seleccione una fecha para su pedido en el calendario. Los días en naranja indican que ya existe una solicitud.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <div className="w-full flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  numberOfMonths={3}
                  month={currentMonth}
                  disableNavigation
                  disabled={isDayDisabled}
                  className="rounded-md border bg-white"
                  locale={es}
                  weekStartsOn={1}
                  modifiers={requestModifiers}
                  modifiersClassNames={requestModifiersClassNames}
                />
              </div>
              <Button 
                onClick={handleShowProducts} 
                disabled={!selectedDate}
              >
                Añadir Productos
              </Button>
            </CardContent>
          </Card>
        )}

        {isProductsVisible && selectedDate && (
          <div ref={productsSectionRef} className="mt-4">
            <ProductsTable 
              materials={filteredMaterials} 
              requestData={{
                center: selectedCenter,
                warehouseCode: selectedWarehouse,
                catalog: selectedCatalog,
                requestDate: format(selectedDate, 'yyyy-MM-dd')
              }}
            />
          </div>
        )}
      </main>
    </div>
  );
}
