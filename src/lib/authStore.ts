
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

      let determinedRole: UserRole = (claims.role as UserRole) || null;

      currentUser = {
        uid: firebaseUserFromListener.uid,
        name: (claims.name as string) || firebaseUserFromListener.displayName || firebaseUserFromListener.email,
        email: firebaseUserFromListener.email,
        role: (claims.admin === true ? 'admin' : determinedRole) as UserRole,
        assignedBuildingIds: (claims.assignedBuildingIds as string[]) || undefined,
        firebaseUser: firebaseUserFromListener,
      };
      console.log('authStore: User state successfully updated. Role:', currentUser.role, 'Name:', currentUser.name);

    } catch (error) {
      console.error("authStore: Error fetching ID token result or processing claims:", error);
      let fallbackRole: UserRole = null;
      
      currentUser = {
        uid: firebaseUserFromListener.uid,
        name: firebaseUserFromListener.displayName || firebaseUserFromListener.email,
        email: firebaseUserFromListener.email,
        role: fallbackRole,
        assignedBuildingIds: undefined,
        firebaseUser: firebaseUserFromListener,
      };
       console.warn('authStore: User state updated with fallback data. Role set to:', fallbackRole);
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
    authInitialized = true;
    updateUserState(null);
  }
}

export const getCurrentUser = (): AppUser | null => {
  return currentUser;
};

export const logoutFirebaseUser = async () => {
  if (!auth) {
    console.warn("authStore: Firebase Auth not available. Simulating local logout.");
    updateUserState(null);
    return;
  }
  try {
    await firebaseSignOut(auth);
    console.log('authStore: User signed out via Firebase.');
  } catch (error) {
    console.error("authStore: Error signing out from Firebase: ", error);
    updateUserState(null);
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
    // It's good to cast to HttpsError to get more details if available
    const httpsError = error as any; // Or use firebase.functions.HttpsError if you have a direct import
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
    // Force a token refresh *before* the call to ensure the backend receives the latest auth context.
    // This is especially important for the bootstrap admin scenario right after login.
    if (auth?.currentUser) {
        console.log('authStore: Forcing token refresh before making function call...');
        await getIdTokenResult(auth.currentUser, true);
    }

    const setUserRoleFunction: HttpsCallable<SetUserRoleData, SetUserRoleResponse> = httpsCallable(functions, 'setUserRole');
    const result = await setUserRoleFunction({ uid: targetUid, role: newRole });
    console.log('authStore.requestRoleUpdate: setUserRole function call successful:', result.data.message);

    // After a successful role update, if the updated user is the current user,
    // their ID token needs to be refreshed *again* to get the new custom claims client-side.
    if (auth?.currentUser && auth.currentUser.uid === targetUid) {
      console.log('authStore: Re-fetching token to get new custom claims...');
      await getIdTokenResult(auth.currentUser, true); // Force refresh to get new claims
      updateUserState(auth.currentUser); // Re-process claims with the updated token
    }
    return { success: true, message: result.data.message };
  } catch (error) {
    console.error("authStore.requestRoleUpdate: Error calling setUserRole function:", error);
    const httpsError = error as any;
    return { success: false, message: httpsError.message || `Failed to update role for UID ${targetUid}.` };
  }
};
