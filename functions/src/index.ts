
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

interface SetUserRoleData {
  uid: string;
  role: string;
}

// Callable function to set a user's role (e.g., 'admin', 'manager', etc.)
export const setUserRole = functions.https.onCall(async (data: SetUserRoleData, context: functions.https.CallableContext) => {
  // Security: only allow admins to call this.
  // This check assumes admin users have a custom claim like `{ admin: true }`.
  // If admin users have `{ role: 'admin' }`, change to: `if (!context.auth || context.auth.token.role !== 'admin')`
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only admins can assign roles"
    );
  }

  const { uid, role } = data; // data is now correctly typed

  if (!uid || !role) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Both uid and role must be provided"
    );
  }

  const validRoles = ['admin', 'manager', 'tenant'];
  if (!validRoles.includes(role)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      `Invalid role: ${role}. Must be one of ${validRoles.join(', ')}.`
    );
  }

  try {
    await admin.auth().setCustomUserClaims(uid, { role });
    return { message: `Role '${role}' has been set for user ${uid}` };
  } catch (error) {
    functions.logger.error(`Error setting role for user ${uid}:`, error);
    throw new functions.https.HttpsError("internal", "Failed to set user role.");
  }
});

// Automatically assign a 'tenant' role to every new user.
// NOTE: This `functions.auth.user().onCreate()` syntax is for Firebase Functions v1.
// If your `firebase-functions` SDK is v4.0.0 or newer, this will likely fail.
// You would need to use the v2 syntax: `import { onUserCreated } from "firebase-functions/v2/auth";`
// and then `export const assignDefaultRole = onUserCreated(async (event) => { ... const user = event.data; ... });`
export const assignDefaultRole = functions.auth.user().onCreate(async (user: admin.auth.UserRecord) => {
  try {
    await admin.auth().setCustomUserClaims(user.uid, { role: "tenant" });
    functions.logger.info(`Assigned default 'tenant' role to new user: ${user.uid}`);
  } catch (error) {
    functions.logger.error(`Error assigning default role to user ${user.uid}:`, error);
    // Depending on your requirements, you might want to handle this error more gracefully
    // or ensure it doesn't block user creation if absolutely critical.
  }
});

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

// Callable function to list all users with their roles
export const listUsersWithRoles = functions.https.onCall(async (data: UserListUserData, context: functions.https.CallableContext) => {
  // Security: only allow admins
  // This check assumes admin users have a custom claim like `{ admin: true }`.
  // If admin users have `{ role: 'admin' }`, change to: `if (!context.auth || context.auth.token.role !== 'admin')`
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only admins can list users"
    );
  }

  const listAllUsersRecursively = async (nextPageToken?: string, users: ListedUser[] = []): Promise<ListedUser[]> => {
    const result = await admin.auth().listUsers(1000, nextPageToken);
    const mappedUsers: ListedUser[] = result.users.map((userRecord: admin.auth.UserRecord) => ({
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      role: userRecord.customClaims?.role || "none", // Default to 'none' if no role claim
      disabled: userRecord.disabled,
      creationTime: userRecord.metadata.creationTime,
      lastSignInTime: userRecord.metadata.lastSignInTime,
    }));
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
        throw new functions.https.HttpsError("internal", `Failed to list users: ${error.message}`);
    }
    throw new functions.https.HttpsError("internal", "Failed to list users due to an unknown error.");
  }
});
