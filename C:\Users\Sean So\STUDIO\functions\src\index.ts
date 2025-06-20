
import * as functions from "firebase-functions"; // This is the v2 default export
import * as functionsV1 from "firebase-functions/v1"; // Explicitly import v1 for v1 features
import * as admin from "firebase-admin";

// V2 Imports for Callable functions
import {HttpsError, onCall, CallableRequest} from "firebase-functions/v2/https";

admin.initializeApp();

// Define interfaces for callable function data
interface SetUserRoleData {
  uid: string;
  role: string;
}

interface UserListUserData {
  // No specific data expected from client for listing users,
  // but adding an optional field to avoid empty interface lint error.
  filter?: string;
}


interface ListedUser {
  uid: string;
  email?: string;
  displayName?: string;
  role: string;
  disabled: boolean;
  creationTime: string;
  lastSignInTime: string;
}

// Callable function to set a user's role (e.g., 'admin', 'manager', etc.) - v2
export const setUserRole = onCall(
  async (request: CallableRequest<SetUserRoleData>) => {
    functions.logger.info("setUserRole: Received data:", JSON.stringify(request.data));
    functions.logger.info("setUserRole: Caller auth object:", JSON.stringify(request.auth));

    // Security check: only allow admins to call this.
    if (request.auth?.token?.role !== 'admin') {
      functions.logger.warn(`setUserRole: Permission denied. User ${request.auth?.uid} (email: ${request.auth?.token?.email}, role: ${request.auth?.token?.role}) attempted to set role but is not an admin.`);
      throw new HttpsError(
        "permission-denied",
        "Only admins can assign roles."
      );
    }
    functions.logger.info(`setUserRole: Admin ${request.auth?.uid} (role: ${request.auth?.token?.role}) is setting role.`);

    const {uid, role} = request.data;

    if (!uid || !role) {
      throw new HttpsError(
        "invalid-argument",
        "Both uid and role must be provided."
      );
    }

    const validRoles = ["admin", "manager", "tenant", "none"];
    if (!validRoles.includes(role)) {
      throw new HttpsError(
        "invalid-argument",
        `Invalid role: ${role}. Must be one of ${validRoles.join(", ")}.`
      );
    }

    try {
      // Set both 'role' claim and 'admin' specific claim if role is admin for Firebase's auto-mapping
      const claimsToSet: { role: string; admin?: boolean } = { role };
      if (role === 'admin') {
        claimsToSet.admin = true; // For request.auth.token.admin compatibility
      } else {
        // Ensure admin claim is removed if role is not admin
        claimsToSet.admin = false; 
      }
      await admin.auth().setCustomUserClaims(uid, claimsToSet);
      functions.logger.info(
        `Claims ${JSON.stringify(claimsToSet)} set for user ${uid} by admin ${request.auth?.uid}`
      );
      return {message: `Role '${role}' has been set for user ${uid}`};
    } catch (error) {
      functions.logger.error(`Error setting role for user ${uid}:`, error);
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
    await admin.auth().setCustomUserClaims(user.uid, {role: "tenant"});
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
    if (request.auth?.token?.role !== 'admin') {
      functions.logger.warn(`listUsersWithRoles: Permission denied. User ${request.auth?.uid} (email: ${request.auth?.token?.email}, role: ${request.auth?.token?.role}) attempted to list users but is not an admin.`);
      throw new HttpsError(
        "permission-denied",
        "Only admins can list users."
      );
    }

    const listAllUsersRecursively = async (
      nextPageToken?: string,
      users: ListedUser[] = []
    ): Promise<ListedUser[]> => {
      const result = await admin.auth().listUsers(1000, nextPageToken);
      const mappedUsers: ListedUser[] = result.users.map(
        (userRecord: admin.auth.UserRecord) => ({
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: userRecord.displayName,
          role: userRecord.customClaims?.role || "none", // Ensure 'role' from customClaims is read, default to 'none'
          disabled: userRecord.disabled,
          creationTime: userRecord.metadata.creationTime,
          lastSignInTime: userRecord.metadata.lastSignInTime,
        })
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
      functions.logger.error("Error listing users:", error); // Using logger from the v2 'functions' import
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
