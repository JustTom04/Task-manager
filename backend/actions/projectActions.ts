"use server";

import prisma from "@/backend/lib/prisma";
import { getDefaultProjectsData, getEmptyGeneralProjectData } from "@/backend/utils/defaultData";
import { verifyUserAccess } from "@/backend/lib/authHelper";

/**
 * Get all projects with their nested tasks and labels for a specific user.
 * Automatically seeds default data if the user is new
 */
export async function getProjects(userId: string) {
  try {
    const actorId = await verifyUserAccess(userId);

    // Seed default data for first-time users
    let user = await prisma.user.findUnique({ where: { id: actorId } });
    if (!user) {
      try {
        user = await prisma.user.create({
          data: {
            id: actorId,
            ownedProjects: getDefaultProjectsData() as any,
          },
        });
        console.log(`[AUTH] Created new anonymous user: ${actorId} with default data.`);
      } catch (e: any) {
        // P2002: Unique constraint failed. This means another concurrent request 
        // (e.g. from React StrictMode) already created the user just milliseconds ago.
        if (e.code === 'P2002') {
          console.log(`[AUTH] Concurrent user creation detected for ${actorId}, ignoring.`);
          user = await prisma.user.findUnique({ where: { id: actorId } });
        } else {
          throw e;
        }
      }
    }

    let projects = await prisma.project.findMany({
      where: {
        OR: [
          { userId: actorId },
          { collaborators: { some: { userId: actorId } } }
        ]
      },
      include: {
        labels: true,
        collaborators: {
          where: { userId: actorId },
          select: { joinedAt: true }
        },
        tasks: {
          include: { labels: true },
          orderBy: { orderIndex: 'asc' }
        }
      }
    });

    // Self-healing safety net: Ensure all tasks have valid, distinct orderIndex values.
    // If any tasks have missing, zero, or duplicate orderIndex, re-index them in one batch transaction.
    const reindexUpdates: any[] = [];
    for (const project of projects) {
      let needsFix = false;
      const seenOrders = new Set<number>();
      for (const t of project.tasks) {
        if (!t.orderIndex || t.orderIndex === 0 || seenOrders.has(t.orderIndex)) {
          needsFix = true;
          break;
        }
        seenOrders.add(t.orderIndex);
      }

      if (needsFix && project.tasks.length > 0) {
        project.tasks.forEach((t, index) => {
          const newOrder = index + 1;
          t.orderIndex = newOrder;
          reindexUpdates.push(
            prisma.task.update({
              where: { id: t.id },
              data: { orderIndex: newOrder }
            })
          );
        });
      }
    }

    if (reindexUpdates.length > 0) {
      console.log(`[SERVER] Auto-healing orderIndex for ${reindexUpdates.length} tasks in a single transaction.`);
      await prisma.$transaction(reindexUpdates);
    }

    // Format projects and their tasks
    // The frontend expects task.labels to be an array of IDs, not full objects
    const formattedProjects = projects.map((p) => {
      const { collaborators, ...projectData } = p; // Remove collaborators from frontend response
      return {
        ...projectData,
        tasks: projectData.tasks.map(t => ({
          ...t,
          labels: t.labels.map(l => l.id)
        })),
      };
    });

    console.log(`[SERVER ACTION] Fetched all projects. Total count: ${formattedProjects.length}`);
    return formattedProjects;
  } catch (error) {
    console.error("[SERVER ACTION ERROR: getProjects]", error);
    throw new Error("Failed to fetch projects");
  }
}

interface CreateProjectArgs {
  id?: string;
  name: string;
  labels?: { id?: string; name: string; color: string }[];
  userId: string;
}

/**
 * Create a new project, cloning default labels from General project if none provided
 */
export async function createProject({ id, name, labels, userId }: CreateProjectArgs) {
  if (!name || !name.trim()) throw new Error("Project name is required");

  try {
    const actorId = await verifyUserAccess(userId);
    const trimmedName = name.trim();

    // Prevent duplicate project names for this user
    const existingProject = await prisma.project.findFirst({
      where: {
        userId: actorId,
        name: {
          equals: trimmedName,
          mode: 'insensitive'
        }
      }
    });

    if (existingProject) {
      throw new Error("A project with this name already exists.");
    }

    let labelsToCreate: { id?: string; name: string; color: string }[] = labels
      ? labels.map((l) => ({ id: l.id, name: l.name, color: l.color }))
      : [];

    // Fallback: If no labels provided, clone from General project
    if (labelsToCreate.length === 0) {
      const generalProject = await prisma.project.findFirst({
        where: { name: "General", userId: actorId },
        include: { labels: true },
      });

      labelsToCreate =
        generalProject?.labels.map((l) => ({ name: l.name, color: l.color })) || [];
    }

    const newProject = await prisma.project.create({
      data: {
        id: id || undefined,
        name: name.trim(),
        userId: actorId,
        labels: { create: labelsToCreate },
      },
      include: {
        tasks: true,
        labels: true,
      },
    });

    console.log(`[SERVER ACTION] Created new project: "${newProject.name}"`);
    return newProject;
  } catch (error) {
    console.error("[SERVER ACTION ERROR: createProject]", error);
    throw new Error("Failed to create project");
  }
}

/**
 * Delete a project (protecting General from deletion)
 */
export async function deleteProject(projectId: string, userId: string) {
  try {
    const actorId = await verifyUserAccess(userId);

    const projectToDelete = await prisma.project.findUnique({ where: { id: projectId } });

    if (!projectToDelete) {
      throw new Error("Project not found");
    }

    if (projectToDelete.userId !== actorId) {
      // Check if they are a collaborator
      const collab = await prisma.projectCollaborator.findUnique({
        where: { projectId_userId: { projectId, userId: actorId } }
      });
      if (collab) {
        await prisma.projectCollaborator.delete({
          where: { projectId_userId: { projectId, userId: actorId } }
        });
        console.log(`[SERVER ACTION] User ${actorId} left project ID: ${projectId}`);
        return { success: true, id: projectId };
      }
      throw new Error("Unauthorized to delete or leave this project");
    }

    if (projectToDelete.name === "General") {
      throw new Error("The General project cannot be deleted.");
    }

    await prisma.project.delete({ where: { id: projectId } });
    console.log(`[SERVER ACTION] Removed project ID: ${projectId}`);
    return { success: true, id: projectId };
  } catch (error: any) {
    console.error("[SERVER ACTION ERROR: deleteProject]", error);
    throw new Error(error.message || "Failed to delete project");
  }
}

interface UpdateProjectArgs {
  id: string;
  name: string;
  userId: string;
}

/**
 * Update a project (e.g., renaming)
 */
export async function updateProject({ id, name, userId }: UpdateProjectArgs) {
  if (!name || typeof name !== "string" || !name.trim()) {
    throw new Error("Project name is required and cannot be empty.");
  }

  try {
    const actorId = await verifyUserAccess(userId);

    const projectToUpdate = await prisma.project.findUnique({ where: { id } });

    if (!projectToUpdate) {
      throw new Error("Project not found");
    }

    if (projectToUpdate.userId !== actorId) {
      throw new Error("Unauthorized to modify this project");
    }

    if (projectToUpdate.name === "General") {
      throw new Error("The General project cannot be modified.");
    }

    const trimmedName = name.trim();

    // Prevent duplicate project names for this user (excluding itself)
    const existingProject = await prisma.project.findFirst({
      where: {
        userId: actorId,
        id: { not: id },
        name: {
          equals: trimmedName,
          mode: 'insensitive'
        }
      }
    });

    if (existingProject) {
      throw new Error("A project with this name already exists.");
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: { name: trimmedName },
    });

    console.log(`[SERVER ACTION] Updated project ID: ${id}`);
    return updatedProject;
  } catch (error: any) {
    console.error("[SERVER ACTION ERROR: updateProject]", error);
    throw new Error(error.message || "Failed to update project");
  }
}

/**
 * Generate a new share code for a project. Only the owner can do this.
 */
export async function generateShareCode(projectId: string, userId: string) {
  try {
    const actorId = await verifyUserAccess(userId);

    const project = await prisma.project.findUnique({ 
      where: { id: projectId },
      include: { collaborators: true }
    });
    if (!project) throw new Error("Project not found");
    
    const isOwner = project.userId === actorId;
    const isCollaborator = project.collaborators.some(c => c.userId === actorId);
    if (!isOwner && !isCollaborator) throw new Error("Unauthorized to access share code.");

    // If a code already exists, simply return it instead of generating a new one
    if (project.shareCode) {
      return project.shareCode;
    }

    // Generate a unique 6-character random alphanumeric code with collision checking
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      const existing = await prisma.project.findUnique({
        where: { shareCode: code },
        select: { id: true }
      });

      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      throw new Error("Failed to generate a unique share code. Please try again.");
    }

    // Update the project with the new code
    const updated = await prisma.project.update({
      where: { id: projectId },
      data: { shareCode: code }
    });

    return updated.shareCode;
  } catch (error: any) {
    console.error("[SERVER ACTION ERROR: generateShareCode]", error);
    throw new Error(error.message || "Failed to generate share code");
  }
}

/**
 * Join a project using a share code.
 */
export async function joinProjectByCode(code: string, userId: string) {
  if (!code || !code.trim()) throw new Error("Share code is required");
  
  try {
    const actorId = await verifyUserAccess(userId);
    const trimmedCode = code.trim().toUpperCase();

    const project = await prisma.project.findUnique({ where: { shareCode: trimmedCode } });
    
    if (!project) {
      throw new Error("Invalid share code. Project not found.");
    }

    if (project.userId === actorId) {
      throw new Error("You are already the owner of this project.");
    }

    // Add to ProjectCollaborators
    await prisma.projectCollaborator.upsert({
      where: {
        projectId_userId: {
          projectId: project.id,
          userId: actorId
        }
      },
      update: {}, // Do nothing if it already exists
      create: {
        projectId: project.id,
        userId: actorId
      }
    });

    console.log(`[SERVER ACTION] User ${actorId} joined project ${project.id} via code ${trimmedCode}`);
    return { success: true, projectId: project.id };
  } catch (error: any) {
    console.error("[SERVER ACTION ERROR: joinProjectByCode]", error);
    throw new Error(error.message || "Failed to join project");
  }
}
