import { auth } from "@/auth";
import prisma from "@/backend/lib/prisma";

/**
 * Verifies if the requester has permission to act as the provided user ID.
 * 
 * @param {string} providedUserId - The ID passed from the frontend (guest ID or user ID)
 * @returns {Promise<string>} - The securely verified actor ID (either session ID or safe guest ID)
 * @throws {Error} - If unauthorized
 */
export async function verifyUserAccess(providedUserId) {
  // 1. Check if the user is authenticated via NextAuth
  const session = await auth();

  if (session?.user?.id) {
    // STRICT MODE: Overwrite whatever the frontend passed with the secure session ID
    return session.user.id;
  }

  // 2. If not logged in, ensure the frontend provided a guest ID
  if (!providedUserId) {
    throw new Error("Unauthorized: No user ID provided and no active session found.");
  }

  // 3. GUEST MODE: Ensure the provided guest ID doesn't belong to a registered account
  // If a guest tries to pass the ID of a registered user, block the request!
  const user = await prisma.user.findUnique({ 
    where: { id: providedUserId },
    select: { password: true } // Only fetch what we need
  });

  if (user && user.password) {
    throw new Error("Unauthorized: Cannot access a registered account without logging in.");
  }

  // Safe to use as a guest ID
  return providedUserId;
}
