
import type { Building, Unit, Tenant, Repair, BillPayment, BouncedCheck } from './types';

export const mockRepairs: Repair[] = [
  { id: 'repair1', unitId: 'unit1a', date: '2023-05-15', description: 'Leaky faucet in kitchen fixed', cost: 75, unitNumber: '1A', buildingName: 'Sunset Apartments' },
  { id: 'repair2', unitId: 'unit2b', date: '2023-06-20', description: 'Air conditioner maintenance', cost: 120, unitNumber: '2B', buildingName: 'Ocean View Condos' },
];

export const mockTenants: Tenant[] = [
  {
    id: 'tenant1',
    name: 'Alice Wonderland',
    email: 'alice@example.com',
    phone: '555-1234',
    unitId: 'unit1a',
    unitNumber: '1A', buildingName: 'Sunset Apartments',
    contractStartDate: '2023-01-01',
    contractEndDate: '2024-12-31',
    rentAmount: 1200,
    tenantType: 'receipted',
    documents2307: [{id: 'doc1', name: '2307_Q1_2023.pdf', url: '#', submissionDate: '2023-04-15'}],
    outstandingBalance: 0,
    lastPaymentDate: '2023-11-05',
  },
  {
    id: 'tenant2',
    name: 'Bob The Builder',
    email: 'bob@example.com',
    phone: '555-5678',
    unitId: 'unit2b',
    unitNumber: '2B', buildingName: 'Ocean View Condos',
    contractStartDate: '2022-07-15',
    contractEndDate: '2024-07-14',
    rentAmount: 2500,
    tenantType: 'non-receipted',
    documents2307: [],
    outstandingBalance: 2500,
    lastPaymentDate: '2023-10-15',
  },
];

export const mockUnits: Unit[] = [
  {
    id: 'unit1a',
    unitNumber: '1A',
    buildingId: 'building1',
    tenant: mockTenants.find(t => t.unitId === 'unit1a'),
    repairs: mockRepairs.filter(r => r.unitId === 'unit1a'),
    size: '75 sqm',
    bedrooms: 2,
    bathrooms: 1,
    status: 'occupied',
    monthlyRent: 1200,
  },
  {
    id: 'unit1b',
    unitNumber: '1B',
    buildingId: 'building1',
    repairs: [],
    size: '70 sqm',
    bedrooms: 1,
    bathrooms: 1,
    status: 'vacant',
    monthlyRent: 1150,
  },
  {
    id: 'unit2b',
    unitNumber: '2B',
    buildingId: 'building2',
    tenant: mockTenants.find(t => t.unitId === 'unit2b'),
    repairs: mockRepairs.filter(r => r.unitId === 'unit2b'),
    size: '110 sqm',
    bedrooms: 2,
    bathrooms: 2,
    status: 'occupied',
    monthlyRent: 2500,
  },
];

export const mockBuildings: Building[] = [
  {
    id: 'building1',
    name: 'Sunset Apartments',
    address: '123 Main St, Anytown, USA',
    imageUrl: 'https://placehold.co/600x400.png',
    numberOfUnits: 2,
    occupiedUnits: 1,
    totalIncome: mockUnits.filter(u => u.buildingId === 'building1' && u.status === 'occupied').reduce((sum, unit) => sum + unit.monthlyRent, 0),
  },
  {
    id: 'building2',
    name: 'Ocean View Condos',
    address: '456 Ocean Ave, Anytown, USA',
    imageUrl: 'https://placehold.co/600x400.png',
    numberOfUnits: 1,
    occupiedUnits: 1,
    totalIncome: mockUnits.filter(u => u.buildingId === 'building2' && u.status === 'occupied').reduce((sum, unit) => sum + unit.monthlyRent, 0),
  },
];

export const mockBillPayments: BillPayment[] = [
    { id: 'bill1', tenantId: 'tenant1', tenantName: 'Alice Wonderland', billType: 'rent', amount: 1200, dueDate: '2023-12-01', status: 'paid', paymentDate: '2023-12-01' },
    { id: 'bill2', tenantId: 'tenant2', tenantName: 'Bob The Builder', billType: 'rent', amount: 2500, dueDate: '2023-12-01', status: 'pending' },
];

export const mockBouncedChecks: BouncedCheck[] = [
    { id: 'bc1', tenantId: 'tenant2', tenantName: 'Bob The Builder', checkNumber: '12345', amount: 2500, bounceDate: '2023-11-05', reason: 'Insufficient Funds', status: 'pending_collection' },
];
