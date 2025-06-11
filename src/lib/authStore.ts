
'use client';

import { auth } from './firebaseConfig';
import { onAuthStateChanged, signOut as firebaseSignOut, type User as FirebaseUser, getIdTokenResult } from 'firebase/auth';
import type { AppUser, UserRole, DisplayUser } from './types';
// For calling Firebase Functions (user will need to set up 'firebase/functions' and initialize it)
// import { getFunctions, httpsCallable } from 'firebase/functions';

let currentUser: AppUser | null = null;
const listeners: Set<() => void> = new Set();
let authListenerUnsubscribe: (() => void) | null = null;
let authInitialized = false;

// const functions = auth ? getFunctions(auth.app) : undefined; // Initialize Firebase Functions

const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

const updateUserState = async (firebaseUserFromListener: FirebaseUser | null) => {
  if (firebaseUserFromListener) {
    try {
      // Force refresh the token to get the latest custom claims
      const idTokenResult = await getIdTokenResult(firebaseUserFromListener, true);
      const claims = idTokenResult.claims;

      currentUser = {
        uid: firebaseUserFromListener.uid,
        name: (claims.name as string) || firebaseUserFromListener.displayName,
        email: firebaseUserFromListener.email,
        role: (claims.role as UserRole) || null, // Default to null if no role claim
        assignedBuildingIds: (claims.assignedBuildingIds as string[]) || undefined,
        firebaseUser: firebaseUserFromListener,
      };
      console.log('authStore: User state updated with custom claims. Role:', currentUser.role);

    } catch (error) {
      console.error("authStore: Error fetching ID token result or processing claims:", error);
      // Fallback to basic info if claims fetching fails
      currentUser = {
        uid: firebaseUserFromListener.uid,
        name: firebaseUserFromListener.displayName,
        email: firebaseUserFromListener.email,
        role: null, // Could not determine role
        firebaseUser: firebaseUserFromListener,
      };
    }
  } else {
    currentUser = null;
    console.log('authStore: User state updated to null (logged out).');
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
    console.warn("authStore: Firebase Auth service is not available. Auth features will be disabled.");
    authInitialized = true; // Prevent re-attachment attempts
    updateUserState(null); // Ensure currentUser is null
  }
}


export const getCurrentUser = (): AppUser | null => {
  return currentUser;
};

export const logoutFirebaseUser = async () => {
  if (!auth) {
    console.warn("authStore: Firebase Auth not available. Simulating local logout.");
    updateUserState(null); // Ensure local state is cleared
    return;
  }
  try {
    await firebaseSignOut(auth);
    // onAuthStateChanged will handle setting currentUser to null
    console.log('authStore: User signed out via Firebase.');
  } catch (error) {
    console.error("authStore: Error signing out from Firebase: ", error);
    // Still clear local state as a fallback
    updateUserState(null);
  }
};

export const subscribeToUserChanges = (listener: () => void): (() => void) => {
  listeners.add(listener);
  // listener(); // Call listener immediately with current state
  return () => {
    listeners.delete(listener);
  };
};

export const cleanupAuthListener = () => {
  if (authListenerUnsubscribe) {
    authListenerUnsubscribe();
    authListenerUnsubscribe = null; // Prevent multiple calls
    authInitialized = false; // Allow re-initialization if needed (e.g., in tests)
    console.log('authStore: Firebase Auth listener cleaned up.');
  }
};

// --- Mock User Management Data for UI Demo (to be replaced by backend calls) ---
// These UIDs should match UIDs of users you create in Firebase Auth for testing.
// The roles here are what you *expect* their custom claims to be.
const MOCK_USERS_FOR_DISPLAY: DisplayUser[] = [
  { uid: 'admin_user_uid_placeholder', name: 'Admin User (Demo)', email: 'admin@example.com', role: 'admin' },
  { uid: 'manager_user_uid_placeholder', name: 'Manager Mike (Demo)', email: 'manager@example.com', role: 'manager', assignedBuildingIds: ['building1'] },
  { uid: 'tenant_alice_uid_placeholder', name: 'Alice Wonderland (Demo)', email: 'alice@example.com', role: 'tenant' },
  { uid: 'tenant_bob_uid_placeholder', name: 'Bob The Builder (Demo)', email: 'bob@example.com', role: 'tenant' },
];

export const getDisplayUsers = (): DisplayUser[] => {
  // In a real app, this would fetch from a Firebase Function that lists users and their claims.
  console.warn("getDisplayUsers: Using mock data. Implement a Firebase Function to fetch real user data with roles.");
  return [...MOCK_USERS_FOR_DISPLAY];
};

// Placeholder for calling your Firebase Function to update a user's role claim.
export const requestRoleUpdate = async (targetUid: string, newRole: UserRole): Promise<{ success: boolean, message: string }> => {
  console.log(`authStore: Requesting role update for UID ${targetUid} to role ${newRole}. This should call a Firebase Function.`);

  // Example of how you might call a Firebase Function (uncomment and configure when ready)
  /*
  if (!functions) {
    return { success: false, message: "Firebase Functions not initialized." };
  }
  try {
    const setUserRoleFunction = httpsCallable<{ targetUid: string; newRole: UserRole }, { success: boolean; message: string }>(functions, 'setUserRole');
    const result = await setUserRoleFunction({ targetUid, newRole });
    console.log('Firebase Function call result:', result.data);

    // IMPORTANT: After a successful role update via custom claims,
    // the user needs a new ID token for the changes to reflect client-side.
    // This can happen on next login, or you can try to force a token refresh for the *current* user if they are the one being updated.
    // For other users, they'll see the change on their next login/token refresh.
    // If the admin is updating their OWN role, they might need to re-login or have their token refreshed.
    
    // To update the local mock list for immediate UI feedback (for demo purposes only):
    const userIndex = MOCK_USERS_FOR_DISPLAY.findIndex(u => u.uid === targetUid);
    if (userIndex > -1) {
      MOCK_USERS_FOR_DISPLAY[userIndex].role = newRole;
      notifyListeners(); // If any component directly uses MOCK_USERS_FOR_DISPLAY
    }
    // Consider re-fetching the display users list if it were from a backend.

    return { success: result.data.success, message: result.data.message };
  } catch (error) {
    console.error("Error calling setUserRole Firebase Function:", error);
    const httpsError = error as any; // Type assertion for HttpsError
    return { success: false, message: httpsError.message || "Failed to update role via Firebase Function." };
  }
  */

  // Simulated success for demo purposes:
  // In a real app, this success/message would come from your Firebase Function.
  // Also, you'd likely re-fetch the user list or update the specific user in the local state.
  const userIndex = MOCK_USERS_FOR_DISPLAY.findIndex(u => u.uid === targetUid);
  if (userIndex > -1) {
    MOCK_USERS_FOR_DISPLAY[userIndex].role = newRole;
    // Note: `notifyListeners()` here would only work if components are subscribing to changes in MOCK_USERS_FOR_DISPLAY directly.
    // Typically, the `/users` page would re-fetch or manage its own state.
  }

  return Promise.resolve({
    success: true,
    message: `(Simulated) Role for user (UID: ${targetUid}) requested to be ${newRole}. Implement and call your 'setUserRole' Firebase Function. User may need to re-login to see changes reflected in their session.`
  });
};
