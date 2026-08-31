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
      createData.projects = getEmptyGeneralProjectData();
    }

    // Execute complex registration workflow atomically to prevent partial database states
    await prisma.$transaction(async (tx: any) => {
      // Create new user
      const newUser = await tx.user.create({
        data: createData,
      });

      // Migrate guest user data to the new permanent account
      if (saveProjects && guestUserId) {
        const guestProjects = await tx.project.findMany({
          where: { userId: guestUserId },
          include: {
            labels: true,
            tasks: {
              include: { labels: true }
            }
          }
        });

        for (const oldProject of guestProjects) {
          // Create new project
          const newProject = await tx.project.create({
            data: {
              name: oldProject.name,
              userId: newUserId,
            },
          });

          // Maintain referential integrity during label duplication
          const labelMap = new Map();

          // Duplicate labels
          for (const oldLabel of oldProject.labels) {
            const newLabel = await tx.label.create({
              data: {
                name: oldLabel.name,
                color: oldLabel.color,
                projectId: newProject.id,
              }
            });
            labelMap.set(oldLabel.id, newLabel.id);
          }

          // Duplicate tasks
          for (const oldTask of oldProject.tasks) {
            const newLabels = oldTask.labels.map((l: any) => ({
              id: labelMap.get(l.id)
            })).filter((l: any) => l.id !== undefined);

            await tx.task.create({
              data: {
                title: oldTask.title,
                done: oldTask.done,
                priority: oldTask.priority,
                projectId: newProject.id,
                labels: {
                  connect: newLabels
                }
              }
            });
          }
        }
      }

      // Database Cleanup: Delete the old guest projects.
      // (Because of onDelete: Cascade in schema, this also deletes guest tasks and labels automatically)
      if (saveProjects && guestUserId) {
        await tx.project.deleteMany({
          where: { userId: guestUserId }
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
