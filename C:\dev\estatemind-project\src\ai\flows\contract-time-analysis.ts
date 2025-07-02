
'use server';

/**
 * @fileOverview AI-powered contract time analysis flow.
 *
 * - analyzeContractTime - Analyzes contract durations, providing time remaining, time spent, and near-expiry alerts.
 * - ContractTimeAnalysisInput - The input type for the analyzeContractTime function.
 * - ContractTimeAnalysisOutput - The return type for the analyzeContractTime function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ContractTimeAnalysisInputSchema = z.object({
  contractStartDate: z
    .string()
    .describe('The start date of the contract (YYYY-MM-DD).'),
  contractEndDate: z.string().describe('The end date of the contract (YYYY-MM-DD).'),
  tenantName: z.string().describe('The name of the tenant.'),
  propertyAddress: z.string().describe('The address of the property.'),
});
export type ContractTimeAnalysisInput = z.infer<typeof ContractTimeAnalysisInputSchema>;

const ContractTimeAnalysisOutputSchema = z.object({
  timeSpent: z.string().describe('The time spent in the contract (e.g., X months, Y days).'),
  timeRemaining: z
    .string()
    .describe('The time remaining in the contract (e.g., X months, Y days).'),
  nearExpiryAlert: z
    .boolean()
    .describe('True if the contract is near expiry, false otherwise.'),
  alertMessage: z.string().describe('Alert message if the contract is near expiry.'),
});
export type ContractTimeAnalysisOutput = z.infer<typeof ContractTimeAnalysisOutputSchema>;

export async function analyzeContractTime(
  input: ContractTimeAnalysisInput
): Promise<ContractTimeAnalysisOutput> {
  return analyzeContractTimeFlow(input);
}

const analyzeContractTimePrompt = ai.definePrompt({
  name: 'analyzeContractTimePrompt',
  input: {schema: ContractTimeAnalysisInputSchema},
  output: {schema: ContractTimeAnalysisOutputSchema},
  prompt: `You are a real estate contract analysis expert.

  Analyze the contract duration and provide the time spent, time remaining, and a near-expiry alert if the contract is expiring within 3 months.

  Contract Start Date: {{{contractStartDate}}}
  Contract End Date: {{{contractEndDate}}}
  Tenant Name: {{{tenantName}}}
  Property Address: {{{propertyAddress}}}

  Consider today's date when calculating the time remaining. If the contract has already expired, set timeRemaining to "Expired" and nearExpiryAlert to true.
  If the current date is past the end date, consider the contract expired. Provide an appropriate alert message.
  If the contract is expiring within 3 months, nearExpiryAlert should be set to true and provide a relevant alert message. Otherwise, nearExpiryAlert should be false and alertMessage should be an encouraging but neutral message like "Contract is not near expiry."
`,
});

const analyzeContractTimeFlow = ai.defineFlow(
  {
    name: 'analyzeContractTimeFlow',
    inputSchema: ContractTimeAnalysisInputSchema,
    outputSchema: ContractTimeAnalysisOutputSchema,
  },
  async input => {
    const {output} = await analyzeContractTimePrompt(input);
    return output!;
  }
);
