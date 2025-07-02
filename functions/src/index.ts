
import * as admin from "firebase-admin";
import { onCall, HttpsError, type CallableRequest } from "firebase-functions/v2/https";
import { onUserCreated, type AuthEvent } from "firebase-functions/v2/auth";
import * as logger from "firebase-functions/logger";

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

// Type guard
function isValidRole(r: unknown): r is UserRole {
  return ["admin", "manager", "tenant", "none", null].includes(r as UserRole);
}

// --- Callable Data Interfaces ---
interface SetUserRoleData {
  uid: string;
  role: Exclude<UserRole, null>;
}
interface UserListUserData {
  filter?: string;
}

// --- setUserRole (v2 callable) ---
export const setUserRole = onCall<SetUserRoleData>(
  async (request: CallableRequest<SetUserRoleData>) => {
    // must be logged in
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be logged in.");
    }
    const { uid, role } = request.data;
    if (!uid || !role) {
      throw new HttpsError("invalid-argument", "Both uid and role are required.");
    }

    const isAdmin = request.auth.token.admin === true;
    if (!isAdmin) {
      // bootstrap case: user setting themselves admin
      const userToMod = await admin.auth().getUser(uid);
      const isBootstrap =
        userToMod.email === "admin@example.com" &&
        role === "admin" &&
        request.auth.uid === uid;
      if (!isBootstrap) {
        throw new HttpsError("permission-denied", "Only admins can assign roles.");
      }
    }

    const validRoles: Exclude<UserRole, null>[] = ["admin", "manager", "tenant", "none"];
    if (!validRoles.includes(role)) {
      throw new HttpsError(
        "invalid-argument",
        `Role must be one of ${validRoles.join(", ")}.`
      );
    }

    try {
      await admin
        .auth()
        .setCustomUserClaims(uid, { role, admin: role === "admin" });
      logger.info(`Role '${role}' set for ${uid} by ${request.auth.uid}`);
      return { message: `Role '${role}' set for user ${uid}` };
    } catch (e) {
      logger.error(`Failed to set role for ${uid}:`, e);
      const msg = e instanceof Error ? e.message : "unknown";
      throw new HttpsError("internal", `Could not set role: ${msg}`);
    }
  }
);

// --- assignDefaultRole (v2 auth trigger) ---
export const assignDefaultRole = onUserCreated(async (event: AuthEvent) => {
  const user = event.data;
  try {
    await admin
      .auth()
      .setCustomUserClaims(user.uid, { role: "tenant", admin: false });
    logger.info(`Default 'tenant' claim set for new user ${user.uid}`);
  } catch(e) {
    logger.error(`Could not set default role for user ${user.uid}:`, e);
  }
});

// --- listUsersWithRoles (v2 callable) ---
export const listUsersWithRoles = onCall<UserListUserData>(
  async (request: CallableRequest<UserListUserData>) => {
    if (request.auth?.token.admin !== true) {
      throw new HttpsError("permission-denied", "Only admins may list users.");
    }

    const recurse = async (
      nextPage?: string,
      acc: DisplayUser[] = []
    ): Promise<DisplayUser[]> => {
      const res = await admin.auth().listUsers(1000, nextPage);
      const batch = res.users.map((u: admin.auth.UserRecord) => ({
        uid: u.uid,
        email: u.email,
        displayName: u.displayName,
        role: isValidRole(u.customClaims?.role) ? u.customClaims?.role : "none",
        disabled: u.disabled,
        creationTime: u.metadata.creationTime,
        lastSignInTime: u.metadata.lastSignInTime,
      }));
      acc.push(...batch);
      return res.pageToken ? recurse(res.pageToken, acc) : acc;
    };

    try {
      const users = await recurse();
      return { users };
    } catch (e) {
      logger.error("Error listing users:", e);
      const msg = e instanceof Error ? e.message : "unknown";
      throw new HttpsError("internal", `Could not list users: ${msg}`);
    }
  }
);
