"use server";

import prisma from "@/backend/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { getEmptyGeneralProjectData } from "@/backend/utils/defaultData";

export async function registerUser(email: string, password: string, guestUserId: string, saveProjects: boolean) {
  try {
    // Prevent duplicate registrations by verifying email uniqueness
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return { error: "User with this email already exists." };
    }

    // Securely hash credentials before persistence
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUserId = crypto.randomUUID();

    // Seed default data for new users to prevent empty UI state crashes if no guest data is being migrated
    const createData: any = {
      id: newUserId,
      email,
      password: hashedPassword,
    };

    if (!saveProjects) {
      createData.ownedProjects = getEmptyGeneralProjectData();
    }

    // Execute complex registration workflow atomically to prevent partial database states
    await prisma.$transaction(async (tx: any) => {
      // Create new user
      const newUser = await tx.user.create({
        data: createData,
      });

      // Migrate guest user data to the new permanent account:
      // Directly reassign ownership of guest projects to the new user.
      // This preserves all tasks, labels, relations, and orderIndex without duplication overhead.
      if (saveProjects && guestUserId) {
        await tx.project.updateMany({
          where: { userId: guestUserId },
          data: { userId: newUserId }
        });
      }
    }, {
      timeout: 15000 
    });

    return { success: true, userId: newUserId };
  } catch (error) {
    console.error("[AUTH] Registration error:", error);
    return { error: "Failed to register user. Please try again." };
  }
}
