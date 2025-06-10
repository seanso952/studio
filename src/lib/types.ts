
export interface Repair {
  id: string;
  date: string;
  description: string;
  cost: number;
  unitId: string;
  unitNumber?: string; // For display
  buildingName?: string; // For display
}

export type TenantType = 'receipted' | 'non-receipted';

export interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  unitId: string;
  unitNumber?: string; // For display
  buildingName?: string; // For display
  contractStartDate: string;
  contractEndDate: string;
  rentAmount: number;
  tenantType: TenantType;
  documents2307: Array<{ id: string, name: string, url: string, submissionDate: string }>;
  outstandingBalance: number;
  lastPaymentDate?: string;
}

export interface Unit {
  id: string;
  unitNumber: string;
  buildingId: string;
  tenant?: Tenant;
  repairs: Repair[];
  size: string; 
  bedrooms: number;
  bathrooms: number;
  status: 'occupied' | 'vacant';
  monthlyRent: number;
}

export interface Building {
  id: string;
  name: string;
  address: string;
  imageUrl?: string;
  numberOfUnits: number;
  occupiedUnits: number;
  totalIncome?: number;
  // assignedManagerId?: string; // For simplicity, manager assignments will be on the mock user for now
}

export type BillStatus = 'pending' | 'approved' | 'rejected' | 'paid';
export type BillType = 'electricity' | 'water' | 'association_dues' | 'rent' | 'other';


export interface BillPayment {
  id: string;
  tenantId: string;
  tenantName?: string; 
  unitNumber?: string; 
  buildingName?: string; 
  billType: BillType;
  amount: number;
  dueDate: string;
  paymentDate?: string;
  proofOfPaymentUrl?: string; 
  status: BillStatus;
  adminNotes?: string;
  isOverdue?: boolean; 
}

export interface BouncedCheck {
  id: string;
  tenantId: string;
  tenantName?: string; 
  unitNumber?: string; 
  buildingName?: string; 
  checkNumber: string;
  amount: number;
  bounceDate: string;
  reason: string;
  status: 'pending_collection' | 'resolved' | 'escalated_to_legal';
  followUpDate?: string;
  notes?: string;
}

export interface DocumentSummary {
  id: string;
  tenantId: string;
  tenantName: string;
  documentType: 'receipt' | '2307';
  documentName: string;
  submissionDate: string;
  url: string;
}

// Added for simulated auth
export type UserRole = 'admin' | 'manager' | 'tenant';

export interface MockAuthUser {
  id: string;
  name: string;
  role: UserRole;
  assignedBuildingIds?: string[]; // For managers
}
