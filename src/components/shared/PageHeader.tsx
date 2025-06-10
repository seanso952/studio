import type React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode; // For action buttons, etc.
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="mb-6 pb-4 border-b">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-semibold text-foreground">{title}</h1>
          {description && <p className="text-muted-foreground mt-1">{description}</p>}
        </div>
        {children && <div className="flex-shrink-0">{children}</div>}
      </div>
    </div>
  );
}
