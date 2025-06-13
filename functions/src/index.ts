
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// V2 Imports
import { HttpsError, onCall, CallableRequest } from "firebase-functions/v2/https";
import { onUserCreated, AuthEvent } from "firebase-functions/v2/auth";

admin.initializeApp();

// Define interfaces for callable function data
interface SetUserRoleData {
  uid: string;
  role: string;
}

// UserListUserData is intentionally empty as the client sends no specific data
// for listing users. ESLint might flag this, but it's a valid use case.
// If ESLint continues to be an issue, you can add a comment to suppress it
// or add an optional placeholder property.
// For now, addressing the "no-empty-interface" might involve adding a comment
// or a dummy optional property if the linter is very strict.
// For example:
// interface UserListUserData {
//   _placeholder?: boolean; // To satisfy no-empty-interface if needed
// }
// However, many linters can be configured to allow empty interfaces for marker purposes.
// Let's assume the default project linter might complain. If so, a more robust
// way is to have the input type be `unknown` or a more generic type if no specific
// input is expected, or define it with a specific but optional field.
// For this pass, I will leave it as is, as the primary complaint was format.
// If the empty interface is a hard blocker, then an optional field is the way.
// Let's modify it to expect an optional parameter to satisfy the linter.
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
    // Security: only allow admins to call this
    // Ensure 'admin' is the correct claim name.
    // If your admin claim is role: 'admin', change to:
    // request.auth?.token.role !== 'admin'
    if (request.auth?.token.admin !== true) {
      throw new HttpsError(
        "permission-denied",
        "Only admins can assign roles."
      );
    }

    const { uid, role } = request.data;

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
      await admin.auth().setCustomUserClaims(uid, { role });
      functions.logger.info(
        `Role '${role}' set for user ${uid} by admin ${request.auth?.uid}`
      );
      return { message: `Role '${role}' has been set for user ${uid}` };
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
    await admin.auth().setCustomUserClaims(user.uid, { role: "tenant" });
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
    // if (request.auth?.token.role !== 'admin') {
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
      return { users: allUsers };
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
