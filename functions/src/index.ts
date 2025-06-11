
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as functionsV2 from "firebase-functions/v2"; // Import the main V2 module

admin.initializeApp();

// Define interfaces for callable function data
interface SetUserRoleData {
  uid: string;
  role: string;
}

interface UserListUserData {
  // No specific data expected from client for listing users
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

// Callable function to set a user's role (e.g., 'admin', 'manager', etc.) - v2 syntax
export const setUserRole = functionsV2.https.onCall(
  async (request: functionsV2.https.CallableRequest<SetUserRoleData>) => {
    // Security: only allow admins to call this
    // The 'admin' property on token is a custom claim you must set for admin users.
    // If you use { role: 'admin' }, change to: request.auth?.token.role !== 'admin'
    if (request.auth?.token.admin !== true) {
      throw new functionsV2.https.HttpsError(
        "permission-denied",
        "Only admins can assign roles."
      );
    }

    const { uid, role } = request.data;

    if (!uid || !role) {
      throw new functionsV2.https.HttpsError(
        "invalid-argument",
        "Both uid and role must be provided."
      );
    }

    const validRoles = ["admin", "manager", "tenant"];
    if (!validRoles.includes(role)) {
      throw new functionsV2.https.HttpsError(
        "invalid-argument",
        `Invalid role: ${role}. Must be one of ${validRoles.join(", ")}.`
      );
    }

    try {
      await admin.auth().setCustomUserClaims(uid, { role });
      functions.logger.info(`Role '${role}' has been set for user ${uid} by admin ${request.auth?.uid}`);
      return { message: `Role '${role}' has been set for user ${uid}` };
    } catch (error) {
      functions.logger.error(`Error setting role for user ${uid}:`, error);
      if (error instanceof Error) {
        throw new functionsV2.https.HttpsError("internal", `Failed to set user role: ${error.message}`);
      }
      throw new functionsV2.https.HttpsError("internal", "Failed to set user role due to an unknown error.");
    }
  }
);

// Automatically assign a 'tenant' role to every new user - v2 syntax
// The event type for onUserCreated is functionsV2.auth.AuthBlockingEvent or specific like functionsV2.auth.UserCreatedEvent
// Let's use functionsV2.auth.UserCreatedEvent if available, or a more generic functionsV2.auth.AuthEvent
export const assignDefaultRole = functionsV2.auth.onUserCreated(async (event: functionsV2.auth.AuthEvent) => {
  const user = event.data; // user is of type admin.auth.UserRecord
  try {
    await admin.auth().setCustomUserClaims(user.uid, { role: "tenant" });
    functions.logger.info(`Assigned default 'tenant' role to new user: ${user.uid}`);
  } catch (error) {
    functions.logger.error(`Error assigning default role to user ${user.uid}:`, error);
    // Depending on your requirements, you might want to handle this error more gracefully
  }
});

// Callable function to list all users with their roles - v2 syntax
export const listUsersWithRoles = functionsV2.https.onCall(
  async (request: functionsV2.https.CallableRequest<UserListUserData>) => {
    // Security: only allow admins
    // if (request.auth?.token.role !== 'admin') {
    if (request.auth?.token.admin !== true) {
      throw new functionsV2.https.HttpsError(
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
          role: userRecord.customClaims?.role || "none", // Default to 'none' if no role claim
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
          throw new functionsV2.https.HttpsError("internal", `Failed to list users: ${error.message}`);
      }
      throw new functionsV2.https.HttpsError("internal", "Failed to list users due to an unknown error.");
    }
  }
);
