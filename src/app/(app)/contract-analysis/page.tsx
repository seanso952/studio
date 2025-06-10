'use client';

import * as React from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { analyzeContractTime, type ContractTimeAnalysisInput, type ContractTimeAnalysisOutput } from '@/ai/flows/contract-time-analysis';
import { PageHeader } from '@/components/shared/PageHeader';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  contractStartDate: z.string().min(1, "Start date is required").regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  contractEndDate: z.string().min(1, "End date is required").regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  tenantName: z.string().min(1, "Tenant name is required"),
  propertyAddress: z.string().min(1, "Property address is required"),
});

type ContractAnalysisFormValues = z.infer<typeof formSchema>;

export default function ContractAnalysisPage() {
  const [analysisResult, setAnalysisResult] = React.useState<ContractTimeAnalysisOutput | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<ContractAnalysisFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contractStartDate: '',
      contractEndDate: '',
      tenantName: '',
      propertyAddress: '',
    },
  });

  const onSubmit: SubmitHandler<ContractAnalysisFormValues> = async (data) => {
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    try {
      const result = await analyzeContractTime(data);
      setAnalysisResult(result);
      toast({
        title: "Analysis Complete",
        description: "Contract time analysis successful.",
      });
    } catch (e) {
      console.error("Error analyzing contract time:", e);
      const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred.";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contract Time Analysis"
        description="Leverage AI to analyze contract durations, remaining time, and expiry alerts."
      />

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Analyze Contract</CardTitle>
          <CardDescription>Enter contract details below to get an AI-powered analysis.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contractStartDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contract Start Date (YYYY-MM-DD)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 2023-01-15" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contractEndDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contract End Date (YYYY-MM-DD)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 2024-01-14" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="tenantName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tenant Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="propertyAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property Address</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 123 Main St, Anytown" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'Analyze Contract'
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {analysisResult && (
        <Card className="shadow-lg mt-6">
          <CardHeader>
            <CardTitle className="font-headline">Analysis Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Time Spent</Label>
              <p className="text-lg font-semibold">{analysisResult.timeSpent}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Time Remaining</Label>
              <p className="text-lg font-semibold">{analysisResult.timeRemaining}</p>
            </div>
            {analysisResult.nearExpiryAlert && (
              <Alert variant={analysisResult.timeRemaining === "Expired" ? "destructive" : "default"} className={analysisResult.timeRemaining !== "Expired" ? "bg-yellow-50 border-yellow-300 text-yellow-700 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-300" : ""}>
                 {analysisResult.timeRemaining === "Expired" ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
                <AlertTitle className="font-semibold">{analysisResult.timeRemaining === "Expired" ? "Contract Expired" : "Near Expiry Alert"}</AlertTitle>
                <AlertDescription>{analysisResult.alertMessage}</AlertDescription>
              </Alert>
            )}
             {!analysisResult.nearExpiryAlert && analysisResult.alertMessage && (
                <Alert variant="default" className="bg-green-50 border-green-300 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-300">
                    <CheckCircle2 className="h-5 w-5" />
                    <AlertTitle className="font-semibold">Contract Status</AlertTitle>
                    <AlertDescription>{analysisResult.alertMessage || "Contract is not near expiry."}</AlertDescription>
                </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
