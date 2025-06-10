
'use client';

import type { MockAuthUser, UserRole } from './types';
import { getTenantById } from './tenantStore'; // To get details for the simulated tenant user

// Hardcoded users for simulation
const mockAdminUser: MockAuthUser = { id: 'admin-user', name: 'Admin User', role: 'admin' };
const mockManagerUser: MockAuthUser = { 
  id: 'manager-mike', 
  name: 'Manager Mike', 
  role: 'manager', 
  assignedBuildingIds: ['building1'] // Manager Mike is assigned to 'Sunset Apartments'
};

// For the tenant portal, we'll continue to use 'tenant1' (Alice Wonderland) as the example.
// We can fetch her details if needed, but the portal pages largely do this already.
const getSimulatedTenantUser = (): MockAuthUser => {
  const alice = getTenantById('tenant1'); // Alice Wonderland
  return { 
    id: alice?.id || 'tenant-default', 
    name: alice?.name || 'Tenant User', 
    role: 'tenant' 
  };
}

let currentUser: MockAuthUser = mockAdminUser; // Default to admin
const listeners: Set<() => void> = new Set();

const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

export const getCurrentUser = (): MockAuthUser => {
  // Ensure the tenant user details are fresh if that's the current role
  if (currentUser.role === 'tenant') {
    return getSimulatedTenantUser();
  }
  return currentUser;
};

export const setCurrentUserRole = (role: UserRole) => {
  if (role === 'admin') {
    currentUser = mockAdminUser;
  } else if (role === 'manager') {
    currentUser = mockManagerUser;
  } else if (role === 'tenant') {
    currentUser = getSimulatedTenantUser();
  } else {
    currentUser = mockAdminUser; // Default fallback
  }
  notifyListeners();
};

export const subscribeToUserChanges = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
