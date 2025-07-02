
import * as functionsV1 from "firebase-functions/v1";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import {HttpsError, onCall, CallableRequest} from "firebase-functions/v2/https";

admin.initializeApp();

// --- Type definitions, kept in sync with client-side src/lib/types.ts ---
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
function isValidRole(role: unknown): role is UserRole {
  return ['admin', 'manager', 'tenant', 'none', null].includes(role as UserRole);
}

// Define interfaces for callable function data
interface SetUserRoleData {
  uid: string;
  role: Exclude<UserRole, null>;
}

interface UserListUserData {
  filter?: string;
}

// Callable function to set a user's role - v2
export const setUserRole = onCall(
  async (request: CallableRequest<SetUserRoleData>) => {
    if (!request.auth) {
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
    
    if (!isRequesterAdmin) {
        const userToModify = await admin.auth().getUser(uid);
        const isBootstrapSelfPromotion = 
            userToModify.email === 'admin@example.com' &&
            role === 'admin' &&
            request.auth.uid === uid;
        
        if (!isBootstrapSelfPromotion) {
            throw new HttpsError( "permission-denied", "Only admins can assign roles." );
        }
    }
    
    const validRoles: Exclude<UserRole, null>[] = ["admin", "manager", "tenant", "none"];
    if (!validRoles.includes(role)) {
      throw new HttpsError(
        "invalid-argument",
        `Invalid role: ${role}. Must be one of ${validRoles.join(", ")}.`
      );
    }

    try {
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
  try {
    await admin.auth().setCustomUserClaims(user.uid, {role: "tenant", admin: false});
    logger.info(
      `Assigned default 'tenant' role to new user: ${user.uid}`
    );
  } catch (error) {
    logger.error(
      `Error assigning default role to user ${user.uid}:`, error
    );
  }
});

// Callable function to list all users with their roles - v2
export const listUsersWithRoles = onCall(
  async (request: CallableRequest<UserListUserData>) => {
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
      logger.error("Error listing users:", error);
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
