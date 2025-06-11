
import type { User as FirebaseUser } from 'firebase/auth';

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

export type UserRole = 'admin' | 'manager' | 'tenant' | null; // null for unauthenticated or undefined role

// Represents the user state in the application, derived from Firebase Auth and Custom Claims
export interface AppUser {
  uid: string; // Firebase UID
  name: string | null; // From custom claim 'name' or FirebaseUser displayName
  email: string | null;
  role: UserRole; // From custom claim 'role'
  assignedBuildingIds?: string[]; // From custom claim 'assignedBuildingIds' (for managers)
  firebaseUser: FirebaseUser; // The raw Firebase user object
}

// For displaying users in user management page (can include more details if needed)
// The 'role' here would ideally match the custom claim for that user.
export interface DisplayUser {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  assignedBuildingIds?: string[];
}
