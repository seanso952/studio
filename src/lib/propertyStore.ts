
import type { Building } from './types';
import { mockBuildings as initialMockBuildingsData } from './mockData';

// Make a mutable copy for our store, initialized with data from mockData.ts
let currentBuildingsStore: Building[] = [...initialMockBuildingsData];
const listeners: Set<() => void> = new Set();

export const getBuildings = (): Building[] => {
  return [...currentBuildingsStore]; // Return a copy to prevent direct mutation from outside
};

export const addBuildingToStore = (newBuildingData: Omit<Building, 'id' | 'occupiedUnits' | 'totalIncome'>): Building => {
  const newBuilding: Building = {
    id: `building-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, // Generate a somewhat unique ID
    name: newBuildingData.name,
    address: newBuildingData.address,
    numberOfUnits: newBuildingData.numberOfUnits,
    imageUrl: newBuildingData.imageUrl,
    occupiedUnits: 0, // New properties start with 0 occupied units
    totalIncome: 0,   // New properties start with 0 income
  };
  currentBuildingsStore = [newBuilding, ...currentBuildingsStore]; // Add to the beginning of the list
  listeners.forEach(listener => listener()); // Notify all subscribers
  return newBuilding; // Return the fully formed new building
};

export const subscribeToBuildings = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => { // Return an unsubscribe function
    listeners.delete(listener);
  };
};
