import { auth } from "@/auth";
import prisma from "@/backend/lib/prisma";

/**
 * Verifies if the requester has permission to act as the provided user ID.
 * 
 * @param {string} providedUserId - The ID passed from the frontend (guest ID or user ID)
 * @returns {Promise<string>} - The securely verified actor ID (either session ID or safe guest ID)
 * @throws {Error} - If unauthorized
 */
export async function verifyUserAccess(providedUserId: string): Promise<string> {
  const session = await auth();

  if (session?.user?.id) {
    return session.user.id;
  }

  if (!providedUserId) {
    throw new Error("Unauthorized: No user ID provided and no active session found.");
  }

  // Prevent guests from bypassing auth by passing a registered user's ID
  const user = await prisma.user.findUnique({ 
    where: { id: providedUserId },
    select: { password: true }
  });

  if (user && user.password) {
    throw new Error("Unauthorized: Cannot access a registered account without logging in.");
  }

  return providedUserId;
}
