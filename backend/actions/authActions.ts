"use server";

import prisma from "@/backend/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { getEmptyGeneralProjectData } from "@/backend/utils/defaultData";
import { AUTH_LIMITS } from "@/shared/constants";
import { sendVerificationEmail } from "@/backend/lib/email";

/**
 * Creates or refreshes a verification token for an email address.
 * Tokens expire in 24 hours.
 */
export async function createVerificationToken(email: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Remove any previous unused verification tokens for this email
  await prisma.verificationToken.deleteMany({
    where: { email }
  });

  const created = await prisma.verificationToken.create({
    data: {
      token,
      email,
      expiresAt,
    }
  });

  return created.token;
}

/**
 * Verifies an email token, marks User.emailVerified = true, and deletes the token.
 */
export async function verifyEmailToken(token: string) {
  try {
    if (!token) {
      return { error: "Verification token is missing." };
    }

    const verificationRecord = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationRecord) {
      return { error: "Invalid or already used verification link." };
    }

    const hasExpired = new Date() > new Date(verificationRecord.expiresAt);
    if (hasExpired) {
      // Clean up expired token
      await prisma.verificationToken.delete({ where: { token } });
      return { error: "This verification link has expired. Please request a new one." };
    }

    // Mark user as verified and delete used token atomically
    await prisma.$transaction([
      prisma.user.update({
        where: { email: verificationRecord.email },
        data: { emailVerified: true },
      }),
      prisma.verificationToken.delete({
        where: { token },
      }),
    ]);

    return { success: true };
  } catch (error) {
    console.error("[AUTH] verifyEmailToken error:", error);
    return { error: "Failed to verify email. Please try again." };
  }
}

/**
 * Resends a new verification email to a user if their account is unverified.
 */
export async function resendVerificationEmail(email: string) {
  try {
    const trimmedEmail = email?.trim().toLowerCase();
    if (!trimmedEmail) {
      return { error: "Email is required." };
    }

    const user = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (!user) {
      return { error: "No account found with this email." };
    }

    if (user.emailVerified) {
      return { error: "This email is already verified. You can log in." };
    }

    const token = await createVerificationToken(trimmedEmail);
    await sendVerificationEmail(trimmedEmail, token);

    return { success: true };
  } catch (error) {
    console.error("[AUTH] resendVerificationEmail error:", error);
    return { error: "Failed to resend verification email." };
  }
}


export async function registerUser(email: string, password: string) {
  try {
    const trimmedEmail = email?.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      return { error: "Please enter a valid email address." };
    }

    if (!password || password.length < AUTH_LIMITS.PASSWORD_MIN_LENGTH) {
      return { error: `Password must be at least ${AUTH_LIMITS.PASSWORD_MIN_LENGTH} characters long.` };
    }

    if (password.length > AUTH_LIMITS.PASSWORD_MAX_LENGTH) {
      return { error: `Password cannot exceed ${AUTH_LIMITS.PASSWORD_MAX_LENGTH} characters.` };
    }

    // Prevent duplicate registrations by verifying email uniqueness
    const existingUser = await prisma.user.findUnique({ where: { email: trimmedEmail } });
    if (existingUser) {
      return { error: "User with this email already exists." };
    }

    // Securely hash credentials before persistence
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUserId = crypto.randomUUID();

    // Create user with default empty general project
    // Data migration from guest user is deferred until first verified login
    await prisma.user.create({
      data: {
        id: newUserId,
        email: trimmedEmail,
        password: hashedPassword,
        emailVerified: false,
        ownedProjects: getEmptyGeneralProjectData(),
      },
    });

    // Generate verification token and send verification email
    const verificationToken = await createVerificationToken(trimmedEmail);
    sendVerificationEmail(trimmedEmail, verificationToken).catch((err) => {
      console.error("[AUTH] Background verification email dispatch failed:", err);
    });

    return { success: true, userId: newUserId, requiresVerification: true };
  } catch (error) {
    console.error("[AUTH] Registration error:", error);
    return { error: "Failed to register user. Please try again." };
  }
}

/**
 * Migrates projects from an anonymous guest user to a verified logged-in user.
 * Prevents duplicate "General" projects by removing the empty placeholder default project
 * or merging tasks cleanly.
 */
export async function migrateGuestProjects(guestUserId: string, targetUserId: string) {
  try {
    if (!guestUserId || !targetUserId || guestUserId === targetUserId) {
      return { success: false, error: "Invalid user identifiers for migration." };
    }

    // Check if guest user has any projects to migrate
    const guestProjects = await prisma.project.findMany({
      where: { userId: guestUserId },
      include: { tasks: true, labels: true },
    });

    if (guestProjects.length === 0) {
      return { success: true, count: 0 };
    }

    // Find the target user's existing projects
    const targetProjects = await prisma.project.findMany({
      where: { userId: targetUserId },
      include: { tasks: true },
    });

    await prisma.$transaction(async (tx: any) => {
      // Find default empty "General" project created during initial signup
      const emptyGeneral = targetProjects.find(
        (p: any) => p.name.toLowerCase() === "general" && p.tasks.length === 0
      );

      const guestGeneral = guestProjects.find(
        (p: any) => p.name.toLowerCase() === "general"
      );

      // If the target user has an untouched empty General project and guest has a General project,
      // delete the empty placeholder so the guest's General cleanly replaces it without duplicates
      if (emptyGeneral && guestGeneral) {
        await tx.project.delete({
          where: { id: emptyGeneral.id },
        });
      }

      // Reassign ownership of all guest projects to the verified target user
      await tx.project.updateMany({
        where: { userId: guestUserId },
        data: { userId: targetUserId },
      });
    });

    return { success: true, count: guestProjects.length };
  } catch (error) {
    console.error("[AUTH] migrateGuestProjects error:", error);
    return { success: false, error: "Failed to migrate guest projects." };
  }
}
