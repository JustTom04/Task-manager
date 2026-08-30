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
            projects: getDefaultProjectsData() as any,
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
      where: { userId: actorId },
      include: {
        labels: true,
        tasks: {
          include: { labels: true },
          orderBy: { createdAt: 'asc' }
        }
      },
    });

    // Format projects and their tasks
    // The frontend expects task.labels to be an array of IDs, not full objects
    const formattedProjects = projects.map((p) => ({
      ...p,
      tasks: p.tasks.map(t => ({
        ...t,
        labels: t.labels.map(l => l.id)
      })),
    }));

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
      throw new Error("Unauthorized to delete this project");
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
