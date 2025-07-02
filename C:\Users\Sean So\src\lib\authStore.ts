
'use client';

import { auth, functions } from './firebaseConfig';
import { onAuthStateChanged, signOut as firebaseSignOut, type User as FirebaseUser, getIdTokenResult } from 'firebase/auth';
import { httpsCallable, type HttpsCallable } from 'firebase/functions';
import type { AppUser, UserRole, DisplayUser } from './types';

let currentUser: AppUser | null = null;
const listeners: Set<(user: AppUser | null) => void> = new Set();
let authListenerUnsubscribe: (() => void) | null = null;
let authInitialized = false;

const notifyListeners = () => {
  listeners.forEach(listener => listener(currentUser));
};

const updateUserState = async (firebaseUser: FirebaseUser | null) => {
  if (firebaseUser) {
    try {
      const idTokenResult = await getIdTokenResult(firebaseUser, true); 
      const claims = idTokenResult.claims;
      console.log('authStore: Fetched ID token. Claims:', claims);

      const determinedRole: UserRole = (claims.role as UserRole) || null;

      currentUser = {
        uid: firebaseUser.uid,
        name: (claims.name as string) || firebaseUser.displayName || firebaseUser.email,
        email: firebaseUser.email,
        role: determinedRole,
        assignedBuildingIds: (claims.assignedBuildingIds as string[]) || undefined,
        firebaseUser: firebaseUser,
      };
      console.log('authStore: User state updated. Role:', currentUser.role);
    } catch (error) {
      console.error("authStore: Error fetching ID token result:", error);
      currentUser = { 
        uid: firebaseUser.uid,
        name: firebaseUser.displayName || firebaseUser.email,
        email: firebaseUser.email,
        role: null,
        assignedBuildingIds: undefined,
        firebaseUser: firebaseUser,
      };
    }
  } else {
    currentUser = null;
    console.log('authStore: User state updated to null.');
  }
  notifyListeners();
};

if (typeof window !== 'undefined' && !authInitialized) {
  if (auth) {
    authListenerUnsubscribe = onAuthStateChanged(auth, updateUserState);
    authInitialized = true;
    console.log('authStore: Firebase Auth listener attached.');
  } else {
    console.warn("authStore: Firebase Auth service not available.");
  }
}

export const getCurrentUser = (): AppUser | null => {
  return currentUser;
};

export const logoutFirebaseUser = async () => {
  if (!auth) return;
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("authStore: Error signing out:", error);
  }
};

export const subscribeToUserChanges = (listener: (user: AppUser | null) => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

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

export const fetchDisplayUsers = async (): Promise<DisplayUser[]> => {
  if (!functions) throw new Error("Firebase Functions service is not available.");
  try {
    const listUsersWithRolesFunction: HttpsCallable<unknown, ListUsersResponse> = httpsCallable(functions, 'listUsersWithRoles');
    const result = await listUsersWithRolesFunction();
    return result.data.users;
  } catch (error: any) {
    console.error("authStore.fetchDisplayUsers error:", error);
    throw new Error(error.message || "Failed to fetch users.");
  }
};

export const requestRoleUpdate = async (targetUid: string, newRole: UserRole): Promise<{ success: boolean, message: string }> => {
  if (!functions) return { success: false, message: "Firebase Functions service is not available." };
  try {
    const setUserRoleFunction: HttpsCallable<SetUserRoleData, SetUserRoleResponse> = httpsCallable(functions, 'setUserRole');
    const result = await setUserRoleFunction({ uid: targetUid, role: newRole });
    if (auth?.currentUser && auth.currentUser.uid === targetUid) {
      updateUserState(auth.currentUser);
    }
    return { success: true, message: result.data.message };
  } catch (error: any) {
    console.error("authStore.requestRoleUpdate error:", error);
    return { success: false, message: error.message || `Failed to update role for UID ${targetUid}.` };
  }
};
