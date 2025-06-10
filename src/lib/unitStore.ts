
'use client';

import type { Unit, Tenant } from './types';
import { mockUnits as initialMockUnitsData } from './mockData';

// Make a mutable copy for our store, initialized with data from mockData.ts
let currentUnitsStore: Unit[] = [...initialMockUnitsData];
const listeners: Set<() => void> = new Set();

const notifyListeners = () => {
  listeners.forEach(listener => listener());
}

export const getUnits = (): Unit[] => {
  return [...currentUnitsStore]; // Return a copy
};

export const getUnitsByBuildingId = (buildingId: string): Unit[] => {
  return currentUnitsStore.filter(unit => unit.buildingId === buildingId);
};

export const addUnitToStore = (newUnitData: Omit<Unit, 'id' | 'buildingId' | 'tenant' | 'repairs' | 'status'>, buildingId: string): Unit => {
  const newUnit: Unit = {
    id: `unit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, // Generate a unique ID
    buildingId: buildingId,
    unitNumber: newUnitData.unitNumber,
    size: newUnitData.size,
    bedrooms: newUnitData.bedrooms,
    bathrooms: newUnitData.bathrooms,
    monthlyRent: newUnitData.monthlyRent,
    status: 'vacant', // New units are vacant by default
    repairs: [],      // New units have no repair history initially
    tenant: undefined, // New units have no tenant initially
  };
  currentUnitsStore = [newUnit, ...currentUnitsStore]; // Add to the beginning of the list
  notifyListeners();
  return newUnit;
};

export const assignTenantToUnit = (unitId: string, tenant: Tenant): Unit | undefined => {
  let updatedUnit: Unit | undefined;
  currentUnitsStore = currentUnitsStore.map(unit => {
    if (unit.id === unitId) {
      updatedUnit = {
        ...unit,
        tenant: tenant,
        status: 'occupied',
      };
      return updatedUnit;
    }
    return unit;
  });
  if (updatedUnit) {
    notifyListeners();
  }
  return updatedUnit;
};

export const unassignTenantFromUnit = (unitId: string): Unit | undefined => {
  let updatedUnit: Unit | undefined;
  let unassignedTenantId: string | undefined;

  currentUnitsStore = currentUnitsStore.map(unit => {
    if (unit.id === unitId && unit.tenant) {
      unassignedTenantId = unit.tenant.id;
      updatedUnit = {
        ...unit,
        tenant: undefined,
        status: 'vacant',
      };
      return updatedUnit;
    }
    return unit;
  });

  if (updatedUnit) {
    notifyListeners();
  }
  return updatedUnit; // Return the unit that was modified, and its tenantId if needed elsewhere
};


export const subscribeToUnits = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => { // Return an unsubscribe function
    listeners.delete(listener);
  };
};
