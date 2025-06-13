
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// V2 Imports
import {HttpsError, onCall, CallableRequest} from "firebase-functions/v2/https";
import {onUserCreated, AuthEvent} from "firebase-functions/v2/auth";

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
    const {uid, role} = request.data;

    // Log incoming data and caller identity for debugging bootstrap
    functions.logger.info("setUserRole: Received data:", JSON.stringify(request.data));
    functions.logger.info("setUserRole: Caller auth object:", JSON.stringify(request.auth));
    if (request.auth?.token) {
      functions.logger.info("setUserRole: Caller email from token:", request.auth.token.email);
      functions.logger.info("setUserRole: Caller UID from token:", request.auth.token.uid);
      functions.logger.info("setUserRole: Caller admin claim from token:", request.auth.token.admin);
    }


    // Special condition for bootstrapping the first admin.
    // This allows admin@example.com to set THEIR OWN role to 'admin'
    // REGARDLESS of their current claims.
    const isBootstrappingAdminAccount =
      request.auth?.token?.email === 'admin@example.com' &&
      uid === request.auth?.uid && // Crucially, they are setting their OWN UID
      role === 'admin';             // And the role they are setting is 'admin'

    if (isBootstrappingAdminAccount) {
      functions.logger.info(`setUserRole: Bootstrapping admin role for ${uid}. Proceeding without admin claim check.`);
      // If this condition is met, we bypass the admin check below.
    } else {
      // For ALL OTHER cases (not bootstrapping admin@example.com OR any other user modification),
      // enforce that the caller must be an admin.
      if (request.auth?.token?.admin !== true) {
        functions.logger.warn(`setUserRole: Permission denied. User ${request.auth?.uid} (email: ${request.auth?.token?.email}) attempted to set role for ${uid} but is not an admin and not bootstrapping self.`);
        throw new HttpsError(
          "permission-denied",
          "Only admins can assign roles."
        );
      }
      functions.logger.info(`setUserRole: Admin ${request.auth?.uid} is setting role for ${uid}.`);
    }

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
      await admin.auth().setCustomUserClaims(uid, {role});
      functions.logger.info(
        `Role '${role}' set for user ${uid} by ${isBootstrappingAdminAccount ? 'bootstrap process' : `admin ${request.auth?.uid}`}`
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

// Automatically assign a 'tenant' role to every new user - v2
export const assignDefaultRole = onUserCreated(async (event: AuthEvent) => {
  const user = event.data; // user is of type admin.auth.UserRecord
  try {
    await admin.auth().setCustomUserClaims(user.uid, {role: "tenant"});
    functions.logger.info(
      `Assigned default 'tenant' role to new user: ${user.uid}`
    );
  } catch (error) {
    functions.logger.error(
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
      users: ListedUser[] = []
    ): Promise<ListedUser[]> => {
      const result = await admin.auth().listUsers(1000, nextPageToken);
      const mappedUsers: ListedUser[] = result.users.map(
        (userRecord: admin.auth.UserRecord) => ({
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: userRecord.displayName,
          role: userRecord.customClaims?.role || "none",
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
      functions.logger.error("Error listing users:", error);
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
