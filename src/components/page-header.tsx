import { Building2 } from 'lucide-react';

export function PageHeader() {
  return (
    <header className="bg-card border-b shadow-sm sticky top-0 z-10">
      <div className="container mx-auto">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <Building2 className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-semibold text-foreground">
              Hotel Supply Hub
            </h1>
          </div>
        </div>
      </div>
    </header>
  );
}
