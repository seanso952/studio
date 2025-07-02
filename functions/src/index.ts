
import * as functionsV1 from "firebase-functions/v1"; // Explicitly import v1 for v1 features
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger"; // Correct logger import for v2
import {HttpsError, onCall, CallableRequest} from "firebase-functions/v2/https";

admin.initializeApp();

// --- Type definitions, kept in sync with client-side src/lib/types.ts ---
// This avoids a direct dependency on client code, which is good practice for functions.
type UserRole = 'admin' | 'manager' | 'tenant' | 'none' | null;

interface DisplayUser {
  uid: string;
  email?: string;
  displayName?: string;
  role: UserRole;
  disabled: boolean;
  creationTime: string;
  lastSignInTime: string;
}

// Type guard to check if a value is a valid UserRole.
function isValidRole(role: any): role is UserRole {
  return ['admin', 'manager', 'tenant', 'none', null].includes(role);
}


// Define interfaces for callable function data
interface SetUserRoleData {
  uid: string;
  role: Exclude<UserRole, null>; // Role cannot be set to null via this function
}

interface UserListUserData {
  // No specific data expected from client for listing users,
  // but adding an optional field to avoid empty interface lint error.
  filter?: string;
}

// Callable function to set a user's role (e.g., 'admin', 'manager', etc.) - v2
export const setUserRole = onCall(
  async (request: CallableRequest<SetUserRoleData>) => {
    // onCall implicitly checks for authentication. If !request.auth, it throws 'unauthenticated'.
    if (!request.auth) {
        // This is a defensive check; onCall should handle this.
        throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    const {uid, role} = request.data;
    if (!uid || !role) {
      throw new HttpsError(
        "invalid-argument",
        "Both uid and role must be provided."
      );
    }
    
    // --- Refactored Security Check ---
    const isRequesterAdmin = request.auth.token.admin === true;
    
    // If the requester is an admin, they are authorized.
    // If not, we check for the special bootstrap case.
    if (!isRequesterAdmin) {
        const userToModify = await admin.auth().getUser(uid);
        const isBootstrapSelfPromotion = 
            userToModify.email === 'admin@example.com' &&
            role === 'admin' &&
            request.auth.uid === uid;
        
        // If not an admin AND not the valid bootstrap case, deny permission.
        if (!isBootstrapSelfPromotion) {
            throw new HttpsError( "permission-denied", "Only admins can assign roles." );
        }
    }
    
    // --- Main Logic (authorized to proceed) ---
    const validRoles: Exclude<UserRole, null>[] = ["admin", "manager", "tenant", "none"];
    if (!validRoles.includes(role)) {
      throw new HttpsError(
        "invalid-argument",
        `Invalid role: ${role}. Must be one of ${validRoles.join(", ")}.`
      );
    }

    try {
      // Set both 'role' and 'admin' claims for consistency
      await admin.auth().setCustomUserClaims(uid, { role, admin: role === 'admin' });
      logger.info(
        `Role '${role}' set for user ${uid} by requester ${request.auth.uid}`
      );
      return {message: `Role '${role}' has been set for user ${uid}`};
    } catch (error) {
      logger.error(`Error setting role for user ${uid}:`, error);
      if (error instanceof Error) {
        throw new HttpsError(
          "internal", `Failed to set user role: ${error.message}`
        );
      }
      throw new HttpsError(
        "internal", "Failed to set user role due to an unknown error."
      );
    }
  }
);

// Automatically assign a 'tenant' role to every new user - V1 Auth Trigger
export const assignDefaultRole = functionsV1.auth.user().onCreate(async (user: admin.auth.UserRecord) => {
  // 'user' is the UserRecord from firebase-admin/auth
  try {
    await admin.auth().setCustomUserClaims(user.uid, {role: "tenant", admin: false});
    functionsV1.logger.info( // Use logger from the v1 functionsV1 import
      `Assigned default 'tenant' role to new user: ${user.uid}`
    );
  } catch (error) {
    functionsV1.logger.error( // Use logger from the v1 functionsV1 import
      `Error assigning default role to user ${user.uid}:`, error
    );
  }
});

// Callable function to list all users with their roles - v2
export const listUsersWithRoles = onCall(
  async (request: CallableRequest<UserListUserData>) => {
    // Security: only allow admins
    if (request.auth?.token.admin !== true) {
      throw new HttpsError(
        "permission-denied",
        "Only admins can list users."
      );
    }

    const listAllUsersRecursively = async (
      nextPageToken?: string,
      users: DisplayUser[] = []
    ): Promise<DisplayUser[]> => {
      const result = await admin.auth().listUsers(1000, nextPageToken);
      const mappedUsers: DisplayUser[] = result.users.map(
        (userRecord: admin.auth.UserRecord) => {
            const roleFromClaims = userRecord.customClaims?.role;
            return {
                uid: userRecord.uid,
                email: userRecord.email,
                displayName: userRecord.displayName,
                role: isValidRole(roleFromClaims) ? roleFromClaims : "none",
                disabled: userRecord.disabled,
                creationTime: userRecord.metadata.creationTime,
                lastSignInTime: userRecord.metadata.lastSignInTime,
            }
        }
      );
      users.push(...mappedUsers);

      if (result.pageToken) {
        return listAllUsersRecursively(result.pageToken, users);
      }
      return users;
    };

    try {
      const allUsers = await listAllUsersRecursively();
      return {users: allUsers};
    } catch (error) {
      logger.error("Error listing users:", error); // Using logger from the v2 'logger' import
      if (error instanceof Error) {
        throw new HttpsError(
          "internal", `Failed to list users: ${error.message}`
        );
      }
      throw new HttpsError(
        "internal", "Failed to list users due to an unknown error."
      );
    }
  }
);
