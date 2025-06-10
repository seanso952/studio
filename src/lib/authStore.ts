
'use client';

import { auth } from './firebaseConfig'; // Changed to relative import
import { onAuthStateChanged, signOut as firebaseSignOut, type User as FirebaseUser } from 'firebase/auth';
import type { MockAuthUser, UserRole } from './types';
import { getTenantById } from './tenantStore';

// Mock user data for role simulation after Firebase login
const mockAdminDetails: Omit<MockAuthUser, 'id' | 'firebaseUser' | 'email'> = { name: 'Admin User', role: 'admin' };
const mockManagerDetails: Omit<MockAuthUser, 'id' | 'firebaseUser' | 'email'> = { 
  name: 'Manager Mike', 
  role: 'manager', 
  assignedBuildingIds: ['building1'] 
};

// Known emails for role assignment (temporary solution)
const ADMIN_EMAIL = 'admin@example.com';
const MANAGER_EMAIL = 'manager@example.com';
const TENANT_ALICE_EMAIL = 'alice@example.com'; // tenant1 from mockData

let currentUser: MockAuthUser | null = null;
const listeners: Set<() => void> = new Set();
let authListenerUnsubscribe: (() => void) | null = null;
let authInitialized = false;

const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

const updateUserState = (firebaseUser: FirebaseUser | null) => {
  if (firebaseUser) {
    let roleDetails: Partial<MockAuthUser> = { name: firebaseUser.displayName || 'User', role: null, email: firebaseUser.email }; 

    if (firebaseUser.email === ADMIN_EMAIL) {
      roleDetails = { ...mockAdminDetails, email: firebaseUser.email };
    } else if (firebaseUser.email === MANAGER_EMAIL) {
      roleDetails = { ...mockManagerDetails, email: firebaseUser.email };
    } else if (firebaseUser.email === TENANT_ALICE_EMAIL) {
      const alice = getTenantById('tenant1'); // Assuming tenant1 is Alice
      roleDetails = { name: alice?.name || 'Tenant User', role: 'tenant', email: firebaseUser.email };
    }
    // In a real app, roles would come from custom claims or Firestore

    currentUser = {
      id: firebaseUser.uid,
      name: roleDetails.name || firebaseUser.displayName || 'User',
      email: firebaseUser.email,
      role: roleDetails.role as UserRole,
      assignedBuildingIds: roleDetails.assignedBuildingIds,
      firebaseUser: firebaseUser,
    };
  } else {
    currentUser = null;
  }
  notifyListeners();
};

// Initialize Firebase Auth listener
if (typeof window !== 'undefined' && !authInitialized) {
  authListenerUnsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
    updateUserState(firebaseUser);
    authInitialized = true; // Mark as initialized once the first callback fires
  });
}


export const getCurrentUser = (): MockAuthUser | null => {
  return currentUser;
};

export const logoutFirebaseUser = async () => {
  try {
    await firebaseSignOut(auth);
    // onAuthStateChanged will handle setting currentUser to null and notifying listeners
  } catch (error) {
    console.error("Error signing out: ", error);
  }
};

export const subscribeToUserChanges = (listener: () => void): (() => void) => {
  listeners.add(listener);
  // Immediately call listener with current state
  // This helps components get the initial auth state correctly, especially if authInitialized is already true.
  listener(); 
  return () => {
    listeners.delete(listener);
  };
};

// Optional: function to clean up the auth listener if the app were to be "unmounted"
// though for a root store this is less common.
export const cleanupAuthListener = () => {
  if (authListenerUnsubscribe) {
    authListenerUnsubscribe();
    authInitialized = false;
  }
};
