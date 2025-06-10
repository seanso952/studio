
'use client';

import type { Tenant } from './types';
import { mockTenants as initialMockTenantsData } from './mockData';

let currentTenantsStore: Tenant[] = [...initialMockTenantsData];
const listeners: Set<() => void> = new Set();

const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

export const getTenants = (): Tenant[] => {
  return [...currentTenantsStore];
};

export const getTenantById = (tenantId: string): Tenant | undefined => {
  return currentTenantsStore.find(tenant => tenant.id === tenantId);
};

export const addTenantToStore = (newTenantData: Omit<Tenant, 'id' | 'unitId' | 'unitNumber' | 'buildingName' | 'documents2307' | 'outstandingBalance' | 'lastPaymentDate'>): Tenant => {
  const newTenant: Tenant = {
    id: `tenant-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    ...newTenantData,
    unitId: '', // Initially unassigned
    unitNumber: '',
    buildingName: '',
    documents2307: [],
    outstandingBalance: 0,
    lastPaymentDate: undefined,
  };
  currentTenantsStore = [newTenant, ...currentTenantsStore];
  notifyListeners();
  return newTenant;
};

export const updateTenantInStore = (updatedTenantData: Partial<Tenant> & { id: string }): Tenant | undefined => {
  let foundTenant: Tenant | undefined;
  currentTenantsStore = currentTenantsStore.map(tenant => {
    if (tenant.id === updatedTenantData.id) {
      foundTenant = { ...tenant, ...updatedTenantData };
      return foundTenant;
    }
    return tenant;
  });
  if (foundTenant) {
    notifyListeners();
  }
  return foundTenant;
};


export const subscribeToTenants = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
