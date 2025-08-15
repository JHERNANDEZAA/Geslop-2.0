"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shield } from "lucide-react";

export default function AdminDashboardPage() {
    return (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
            <div className="flex flex-col items-center gap-2 text-center">
                <Shield className="h-16 w-16 text-muted-foreground" />
                <h3 className="text-2xl font-bold tracking-tight">
                    Panel de Administración
                </h3>
                <p className="text-sm text-muted-foreground">
                    Seleccione una opción del menú de la izquierda para comenzar.
                </p>
            </div>
        </div>
    );
}
