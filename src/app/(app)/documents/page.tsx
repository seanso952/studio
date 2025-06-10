
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/shared/PageHeader';
import { mockDocumentSummaries } from '@/lib/mockData';
import type { DocumentSummary } from '@/lib/types';
import { UploadCloud, FileText, Download, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

export default function DocumentsPage() {
  const receipts = mockDocumentSummaries.filter(doc => doc.documentType === 'receipt');
  const forms2307 = mockDocumentSummaries.filter(doc => doc.documentType === '2307');

  const DocumentTable = ({ documents, title }: { documents: DocumentSummary[]; title: string }) => (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="font-headline">{title} ({documents.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {documents.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document Name</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Submission Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map(doc => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                    {doc.documentName}
                  </TableCell>
                  <TableCell>{doc.tenantName}</TableCell>
                  <TableCell>{format(new Date(doc.submissionDate), 'MMM d, yyyy')}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild>
                      <a href={doc.url} target="_blank" rel="noopener noreferrer">
                        <Download className="mr-2 h-3 w-3" /> View/Download
                      </a>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-muted-foreground text-center py-4">No {title.toLowerCase()} found.</p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Document Center" description="Centralized view for all receipts and Form 2307 submissions.">
        <Button asChild>
          <Link href="/documents/upload">
            <UploadCloud className="mr-2 h-4 w-4" /> Upload Document
          </Link>
        </Button>
      </PageHeader>

       <div className="mb-4 flex gap-2">
        <div className="relative flex-grow">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Search documents..." className="pl-8 w-full" />
        </div>
        <Button variant="outline"><Filter className="mr-2 h-4 w-4"/>Filter by Tenant/Date</Button>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="all">All Documents</TabsTrigger>
          <TabsTrigger value="receipts">Receipts</TabsTrigger>
          <TabsTrigger value="forms2307">Form 2307s</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <DocumentTable documents={mockDocumentSummaries} title="All Submitted Documents" />
        </TabsContent>
        <TabsContent value="receipts">
          <DocumentTable documents={receipts} title="Receipts" />
        </TabsContent>
        <TabsContent value="forms2307">
          <DocumentTable documents={forms2307} title="Form 2307 Submissions" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
