
import * as functionsV1 from "firebase-functions/v1";
import * as functionsV2 from "firebase-functions/v2";
import * as admin from "firebase-admin";

admin.initializeApp();

/**
 * V1 Auth trigger to automatically assign a role to new users.
 * Checks for a specific email to assign 'admin' role, otherwise defaults to 'tenant'.
 */
export const assignRoleOnCreate = functionsV1.auth.user().onCreate(async (user) => {
  if (user.email === "seanso259@gmail.com") {
    const customClaims = { role: "admin", admin: true };
    try {
      await admin.auth().setCustomUserClaims(user.uid, customClaims);
      functionsV1.logger.info(`Custom claims ${JSON.stringify(customClaims)} set for admin user ${user.uid}`);
    } catch (error) {
      functionsV1.logger.error(`Error setting admin role for ${user.uid}`, error);
    }
  } else {
    const customClaims = { role: "tenant" };
    try {
      await admin.auth().setCustomUserClaims(user.uid, customClaims);
      functionsV1.logger.info(`Custom claims ${JSON.stringify(customClaims)} set for user ${user.uid}`);
    } catch (error) {
      functionsV1.logger.error(`Error setting tenant role for ${user.uid}`, error);
    }
  }
});

interface SetUserRoleData {
  uid: string;
  role: string;
}

/**
 * V2 Callable function to allow an admin to set a role for another user.
 */
export const setUserRole = functionsV2.https.onCall(
  async (request: functionsV2.https.CallableRequest<SetUserRoleData>) => {
    if (request.auth?.token?.role !== 'admin') {
      throw new functionsV2.https.HttpsError(
        "permission-denied",
        "Only admins can assign roles."
      );
    }

    const { uid, role } = request.data;
    const validRoles = ["admin", "manager", "tenant", null];
    if (!uid || !validRoles.includes(role)) {
      throw new functionsV2.https.HttpsError(
        "invalid-argument",
        "Valid uid and role must be provided."
      );
    }

    try {
      const claimsToSet: { role: string; admin?: boolean } = { role };
      if (role === 'admin') {
        claimsToSet.admin = true;
      } else {
        claimsToSet.admin = false;
      }
      await admin.auth().setCustomUserClaims(uid, claimsToSet);
      return { message: `Role '${role}' has been set for user ${uid}` };
    } catch (error: any) {
      throw new functionsV2.https.HttpsError("internal", error.message);
    }
  }
);

/**
 * V2 Callable function to allow an admin to list all users.
 */
export const listUsersWithRoles = functionsV2.https.onCall(
  async (request: functionsV2.https.CallableRequest) => {
    if (request.auth?.token?.role !== 'admin') {
      throw new functionsV2.https.HttpsError(
        "permission-denied",
        "Only admins can list users."
      );
    }

    const listAllUsersRecursively = async (nextPageToken?: string): Promise<admin.auth.UserRecord[]> => {
        const result = await admin.auth().listUsers(1000, nextPageToken);
        const users = result.users;
        if (result.pageToken) {
            users.push(...await listAllUsersRecursively(result.pageToken));
        }
        return users;
    };

    try {
      const allUsers = await listAllUsersRecursively();
      return {
        users: allUsers.map(user => ({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          role: user.customClaims?.role || null,
          disabled: user.disabled,
          creationTime: user.metadata.creationTime,
          lastSignInTime: user.metadata.lastSignInTime,
        })),
      };
    } catch (error: any) {
      throw new functionsV2.https.HttpsError("internal", error.message);
    }
  }
);
