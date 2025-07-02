
import * as admin from "firebase-admin";
import * as functionsV1 from "firebase-functions/v1";
import * as logger from "firebase-functions/logger";
import { HttpsError, onCall, CallableRequest } from "firebase-functions/v2/https";

admin.initializeApp();

// --- Shared Types ---
type UserRole = "admin" | "manager" | "tenant" | "none" | null;

interface DisplayUser {
  uid: string;
  email?: string;
  displayName?: string;
  role: UserRole;
  disabled: boolean;
  creationTime: string;
  lastSignInTime: string;
}

// Type guard to ensure a value is a UserRole
function isValidRole(role: unknown): role is UserRole {
  return ["admin", "manager", "tenant", "none", null].includes(role as UserRole);
}

// --- Callable Data Interfaces ---
interface SetUserRoleData {
  uid: string;
  role: Exclude<UserRole, null>;
}

interface UserListUserData {
  filter?: string;
}

// --- setUserRole Callable (v2) ---
export const setUserRole = onCall(
  async (request: CallableRequest<SetUserRoleData>) => {
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "The function must be called while authenticated."
      );
    }

    const { uid, role } = request.data;
    if (!uid || !role) {
      throw new HttpsError("invalid-argument", "Both uid and role must be provided.");
    }

    const isRequesterAdmin = request.auth.token.admin === true;
    if (!isRequesterAdmin) {
      const userToModify = await admin.auth().getUser(uid);
      const isBootstrapSelfPromotion =
        userToModify.email === "admin@example.com" &&
        role === "admin" &&
        request.auth.uid === uid;

      if (!isBootstrapSelfPromotion) {
        throw new HttpsError("permission-denied", "Only admins can assign roles.");
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
      await admin.auth().setCustomUserClaims(uid, {
        role,
        admin: role === "admin",
      });
      logger.info(`Role '${role}' set for user ${uid} by ${request.auth.uid}`);
      return { message: `Role '${role}' has been set for user ${uid}` };
    } catch (error) {
      logger.error(`Error setting role for user ${uid}:`, error);
      const msg = error instanceof Error ? error.message : "unknown error";
      throw new HttpsError("internal", `Failed to set user role: ${msg}`);
    }
  }
);

// --- assignDefaultRole Trigger (v1) ---
export const assignDefaultRole = functionsV1.auth.user().onCreate(async (user) => {
  try {
    await admin.auth().setCustomUserClaims(user.uid, {
      role: "tenant",
      admin: false,
    });
    logger.info(`Assigned default 'tenant' role to new user: ${user.uid}`);
  } catch (error) {
    logger.error(`Error assigning default role to user ${user.uid}:`, error);
  }
});

// --- listUsersWithRoles Callable (v2) ---
export const listUsersWithRoles = onCall(
  async (request: CallableRequest<UserListUserData>) => {
    if (request.auth?.token.admin !== true) {
      throw new HttpsError("permission-denied", "Only admins can list users.");
    }

    const listAllUsers = async (
      nextPageToken?: string,
      users: DisplayUser[] = []
    ): Promise<DisplayUser[]> => {
      const result = await admin.auth().listUsers(1000, nextPageToken);
      const batch = result.users.map((u) => {
        const roleClaim = u.customClaims?.role;
        return {
          uid: u.uid,
          email: u.email,
          displayName: u.displayName,
          role: isValidRole(roleClaim) ? roleClaim : "none",
          disabled: u.disabled,
          creationTime: u.metadata.creationTime,
          lastSignInTime: u.metadata.lastSignInTime,
        };
      });
      users.push(...batch);
      return result.pageToken
        ? listAllUsers(result.pageToken, users)
        : users;
    };

    try {
      const allUsers = await listAllUsers();
      return { users: allUsers };
    } catch (error) {
      logger.error("Error listing users:", error);
      const msg = error instanceof Error ? error.message : "unknown error";
      throw new HttpsError("internal", `Failed to list users: ${msg}`);
    }
  }
);
