
'use client';

import { auth } from './firebaseConfig'; // Relative import
import { onAuthStateChanged, signOut as firebaseSignOut, type User as FirebaseUser } from 'firebase/auth';
import type { MockAuthUser, UserRole, DisplayUser } from './types';
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
      const alice = getTenantById('tenant1'); // Ensure this tenant ID matches your mock data
      roleDetails = { name: alice?.name || 'Tenant User', role: 'tenant', email: firebaseUser.email };
    }
    // In a real app, roles would come from custom claims or Firestore

    currentUser = {
      id: firebaseUser.uid,
      name: roleDetails.name || firebaseUser.displayName || 'User',
      email: firebaseUser.email,
      role: roleDetails.role as UserRole, // Cast as UserRole, ensure 'null' is handled if role is not found
      assignedBuildingIds: roleDetails.assignedBuildingIds,
      firebaseUser: firebaseUser,
    };
  } else {
    currentUser = null;
  }
  notifyListeners();
};

if (typeof window !== 'undefined' && !authInitialized) {
  if (auth) {
    authListenerUnsubscribe = onAuthStateChanged(auth, (firebaseUserFromListener) => {
      console.log('authStore: onAuthStateChanged triggered. User:', firebaseUserFromListener ? firebaseUserFromListener.email : 'null');
      updateUserState(firebaseUserFromListener);
    });
    authInitialized = true;
    console.log('authStore: Firebase Auth listener attached.');
  } else {
    console.warn("authStore: Firebase Auth was not available. Auth features will be disabled.");
    authInitialized = true;
    updateUserState(null);
  }
}


export const getCurrentUser = (): MockAuthUser | null => {
  return currentUser;
};

export const logoutFirebaseUser = async () => {
  if (!auth) {
    console.warn("authStore: Firebase Auth not available. Cannot log out via Firebase. Simulating local logout.");
    updateUserState(null);
    return;
  }
  try {
    await firebaseSignOut(auth);
    console.log('authStore: User signed out via Firebase.');
  } catch (error) {
    console.error("authStore: Error signing out from Firebase: ", error);
  }
};

export const subscribeToUserChanges = (listener: () => void): (() => void) => {
  listeners.add(listener);
  listener();
  return () => {
    listeners.delete(listener);
  };
};

export const cleanupAuthListener = () => {
  if (authListenerUnsubscribe) {
    authListenerUnsubscribe();
    authInitialized = false;
    console.log('authStore: Firebase Auth listener cleaned up.');
  }
};

// --- Mock User Management Data for UI Demo ---
const MOCK_USERS_FOR_DISPLAY: DisplayUser[] = [
  { id: 'firebase-admin-uid', name: 'Admin User', email: ADMIN_EMAIL, role: 'admin' },
  { id: 'firebase-manager-uid', name: 'Manager Mike', email: MANAGER_EMAIL, role: 'manager', assignedBuildingIds: ['building1'] },
  { id: 'firebase-tenant-alice-uid', name: 'Alice Wonderland', email: TENANT_ALICE_EMAIL, role: 'tenant' },
  { id: 'firebase-user-bob-uid', name: 'Bob The Builder', email: 'bob@example.com', role: 'tenant' }, // Add more mock users if needed
];

export const getMockUsersForDisplay = (): DisplayUser[] => {
  // In a real app, this would fetch from Firebase Auth user list and a roles collection in Firestore.
  return [...MOCK_USERS_FOR_DISPLAY];
};

export const simulateUpdateUserRole = (userId: string, newRole: UserRole): Promise<{ success: boolean, message: string }> => {
  // This is a simulation. In a real app, this would involve:
  // 1. Calling a Firebase Function to set custom claims for the user.
  // 2. Updating a roles collection in Firestore.
  console.log(`SIMULATING ROLE UPDATE: User ID ${userId} to role ${newRole}`);
  
  // For this demo, we'll find the user in our mock list and "update" them.
  // This won't actually persist or affect the real Firebase Auth user.
  const userIndex = MOCK_USERS_FOR_DISPLAY.findIndex(u => u.id === userId);
  if (userIndex > -1) {
    MOCK_USERS_FOR_DISPLAY[userIndex].role = newRole;
    // If the updated user is the currently logged-in user, we could update their local session role.
    // However, this is tricky without real custom claims, as the Firebase ID token won't reflect this change.
    // For now, we'll just update the mock list for display purposes on the /users page.
    // If you refresh or log out/in, this mock change will be lost.
    // A real implementation would force a token refresh or re-login to get new claims.
    
    // Notify listeners to potentially update UI if the /users page is subscribing to this mock list.
    // (Currently, /users page will get a fresh copy, so no explicit notification needed for this mock)
    return Promise.resolve({ success: true, message: `Role for user (ID: ${userId}) simulated to ${newRole}. This is a UI demo and not a persistent change.` });
  }
  return Promise.resolve({ success: false, message: `Mock user with ID ${userId} not found for role update simulation.` });
};

