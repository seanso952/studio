
'use client';

import { auth, functions } from './firebaseConfig'; // Import functions
import { onAuthStateChanged, signOut as firebaseSignOut, type User as FirebaseUser, getIdTokenResult } from 'firebase/auth';
import { httpsCallable, type HttpsCallable } from 'firebase/functions'; // For calling Firebase Functions
import type { AppUser, UserRole, DisplayUser } from './types';

let currentUser: AppUser | null = null;
const listeners: Set<() => void> = new Set();
let authListenerUnsubscribe: (() => void) | null = null;
let authInitialized = false;

const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

const updateUserState = async (firebaseUserFromListener: FirebaseUser | null) => {
  if (firebaseUserFromListener) {
    console.log(`authStore: Attempting to update state for user: ${firebaseUserFromListener.email}`);
    try {
      const idTokenResult = await getIdTokenResult(firebaseUserFromListener, true);
      const claims = idTokenResult.claims;
      console.log('authStore: Fetched ID token. Claims:', claims);

      const determinedRole: UserRole = (claims.role as UserRole) || null;

      // Removed temporary client-side override for admin@example.com as it should now have the claim from backend.

      currentUser = {
        uid: firebaseUserFromListener.uid,
        name: (claims.name as string) || firebaseUserFromListener.displayName || firebaseUserFromListener.email,
        email: firebaseUserFromListener.email,
        role: determinedRole,
        assignedBuildingIds: (claims.assignedBuildingIds as string[]) || undefined,
        firebaseUser: firebaseUserFromListener,
      };
      console.log('authStore: User state successfully updated. Role:', currentUser.role, 'Name:', currentUser.name);

    } catch (error) {
      console.error("authStore: Error fetching ID token result or processing claims:", error);
      currentUser = { // Fallback to basic info if claims fetch fails
        uid: firebaseUserFromListener.uid,
        name: firebaseUserFromListener.displayName || firebaseUserFromListener.email,
        email: firebaseUserFromListener.email,
        role: null, // No claims, so role is unknown/null
        assignedBuildingIds: undefined,
        firebaseUser: firebaseUserFromListener,
      };
       console.warn('authStore: User state updated with fallback data due to claims processing error. Role set to null.');
    }
  } else {
    currentUser = null;
    console.log('authStore: User state updated to null (logged out or no user).');
  }
  notifyListeners();
};

if (typeof window !== 'undefined' && !authInitialized) {
  if (auth) {
    authListenerUnsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log('authStore: onAuthStateChanged triggered. Firebase User:', firebaseUser ? firebaseUser.email : 'null');
      updateUserState(firebaseUser);
    });
    authInitialized = true;
    console.log('authStore: Firebase Auth listener attached.');
  } else {
    console.warn("authStore: Firebase Auth service is not available (auth object is null/undefined from firebaseConfig). Auth features will be disabled.");
    authInitialized = true; // Mark as initialized to prevent re-attachment attempts
    updateUserState(null); // Ensure state is cleared
  }
}

export const getCurrentUser = (): AppUser | null => {
  return currentUser;
};

export const logoutFirebaseUser = async () => {
  if (!auth) {
    console.warn("authStore: Firebase Auth not available. Simulating local logout.");
    updateUserState(null); // Clear local user state
    return;
  }
  try {
    await firebaseSignOut(auth);
    console.log('authStore: User signed out via Firebase.');
    // onAuthStateChanged will handle setting currentUser to null via updateUserState
  } catch (error) {
    console.error("authStore: Error signing out from Firebase: ", error);
    updateUserState(null); // Ensure local state is cleared even on error
  }
};

export const subscribeToUserChanges = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const cleanupAuthListener = () => {
  if (authListenerUnsubscribe) {
    authListenerUnsubscribe();
    authListenerUnsubscribe = null;
    authInitialized = false;
    console.log('authStore: Firebase Auth listener cleaned up.');
  }
};

// --- Real User Management Functions ---

interface ListUsersResponse {
  users: DisplayUser[];
}
interface SetUserRoleData {
  uid: string;
  role: UserRole;
}
interface SetUserRoleResponse {
  message: string;
}

// Fetches all users with their roles from the backend
export const fetchDisplayUsers = async (): Promise<DisplayUser[]> => {
  if (!functions) {
    console.error("authStore.fetchDisplayUsers: Firebase Functions not initialized.");
    throw new Error("Firebase Functions service is not available.");
  }
  try {
    const listUsersWithRolesFunction: HttpsCallable<unknown, ListUsersResponse> = httpsCallable(functions, 'listUsersWithRoles');
    const result = await listUsersWithRolesFunction();
    console.log("authStore.fetchDisplayUsers: Successfully fetched users:", result.data.users.length);
    return result.data.users;
  } catch (error) {
    console.error("authStore.fetchDisplayUsers: Error calling listUsersWithRoles function:", error);
    const httpsError = error as any;
    const errorMessage = httpsError.message || "Failed to fetch users.";
    throw new Error(errorMessage);
  }
};

// Requests a role update for a user via the backend
export const requestRoleUpdate = async (targetUid: string, newRole: UserRole): Promise<{ success: boolean, message: string }> => {
  if (!functions) {
    console.error("authStore.requestRoleUpdate: Firebase Functions not initialized.");
    return { success: false, message: "Firebase Functions service is not available." };
  }
  try {
    const setUserRoleFunction: HttpsCallable<SetUserRoleData, SetUserRoleResponse> = httpsCallable(functions, 'setUserRole');
    const result = await setUserRoleFunction({ uid: targetUid, role: newRole });
    console.log('authStore.requestRoleUpdate: setUserRole function call successful:', result.data.message);
    if (auth?.currentUser && auth.currentUser.uid === targetUid) {
      await getIdTokenResult(auth.currentUser, true);
      updateUserState(auth.currentUser); 
    }
    return { success: true, message: result.data.message };
  } catch (error) {
    console.error("authStore.requestRoleUpdate: Error calling setUserRole function:", error);
    const httpsError = error as any;
    return { success: false, message: httpsError.message || `Failed to update role for UID ${targetUid}.` };
  }
};
