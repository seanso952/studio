
'use client';

import { auth } from './firebaseConfig'; // Relative import
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
      const alice = getTenantById('tenant1');
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
  if (auth) { // Only attempt to listen if auth was successfully initialized in firebaseConfig.ts
    authListenerUnsubscribe = onAuthStateChanged(auth, (firebaseUserFromListener) => {
      console.log('authStore: onAuthStateChanged triggered. User:', firebaseUserFromListener ? firebaseUserFromListener.email : 'null');
      updateUserState(firebaseUserFromListener);
    });
    authInitialized = true; 
    console.log('authStore: Firebase Auth listener attached.');
  } else {
    console.warn("authStore: Firebase Auth was not available (likely due to missing API key or init error). Auth features will be disabled.");
    authInitialized = true; // Still mark as initialized to prevent re-attempts
    updateUserState(null); // Ensure currentUser is null and listeners are notified
  }
}


export const getCurrentUser = (): MockAuthUser | null => {
  return currentUser;
};

export const logoutFirebaseUser = async () => {
  if (!auth) {
    console.warn("authStore: Firebase Auth not available. Cannot log out via Firebase. Simulating local logout.");
    updateUserState(null); // Simulate local logout
    return;
  }
  try {
    await firebaseSignOut(auth);
    console.log('authStore: User signed out via Firebase.');
    // onAuthStateChanged will handle setting currentUser to null and notifying listeners
  } catch (error) {
    console.error("authStore: Error signing out from Firebase: ", error);
  }
};

export const subscribeToUserChanges = (listener: () => void): (() => void) => {
  listeners.add(listener);
  // Immediately call listener with current state after subscribing
  // This ensures components get the latest state upon mounting and subscribing.
  listener(); 
  return () => {
    listeners.delete(listener);
  };
};

export const cleanupAuthListener = () => {
  if (authListenerUnsubscribe) {
    authListenerUnsubscribe();
    authInitialized = false; // Reset for potential re-initialization if needed
    console.log('authStore: Firebase Auth listener cleaned up.');
  }
};
