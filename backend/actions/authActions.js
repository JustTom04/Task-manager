"use server";

import prisma from "@/backend/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { getEmptyGeneralProjectData } from "@/backend/utils/defaultData";

export async function registerUser(email, password, guestUserId, saveProjects) {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error("User with this email already exists.");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUserId = crypto.randomUUID();

    // Determine what projects to create initially
    // If we are NOT saving guest projects, we must seed the default projects 
    // so the frontend doesn't crash from having 0 projects.
    const createData = {
      id: newUserId,
      email,
      password: hashedPassword,
    };

    if (!saveProjects) {
      createData.projects = getEmptyGeneralProjectData();
    }

    // Start ACID Transaction
    await prisma.$transaction(async (tx) => {
      // Create new user
      const newUser = await tx.user.create({
        data: createData,
      });

      // If user wants to save unlogin projects, we duplicate them
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

          // Map old label IDs to new label IDs
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
            const newLabels = oldTask.labels.map(l => ({
              id: labelMap.get(l.id)
            })).filter(l => l.id !== undefined);

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
    });

    return { success: true, userId: newUserId };
  } catch (error) {
    console.error("[AUTH] Registration error:", error);
    throw new Error(error.message || "Failed to register user");
  }
}
