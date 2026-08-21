"use server";

import prisma from "@/backend/lib/prisma";
import { getDefaultProjectsData, getEmptyGeneralProjectData } from "@/backend/utils/defaultData";

/**
 * Get all projects with their nested tasks and labels for a specific user.
 * Automatically seeds default data if the user is new!
 */
export async function getProjects(userId) {
  if (!userId) throw new Error("userId is required");

  try {
    // Check if user exists; if not, seed default projects!
    let user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: userId,
          projects: getDefaultProjectsData(),
        },
      });
      console.log(`[AUTH] Created new anonymous user: ${userId} with default data.`);
    }

    let projects = await prisma.project.findMany({
      where: { userId },
      include: {
        tasks: {
          include: { labels: true },
        },
        labels: true,
      },
    });

    // Failsafe: If the user exists but has absolutely 0 projects, seed default projects
    if (projects.length === 0) {
      console.log(`[AUTH] Seeding default projects for existing user with 0 projects: ${userId}`);
      await prisma.user.update({
        where: { id: userId },
        data: {
          projects: getEmptyGeneralProjectData(),
        },
      });

      // Fetch again after seeding
      projects = await prisma.project.findMany({
        where: { userId },
        include: {
          tasks: {
            include: { labels: true },
          },
          labels: true,
        },
      });
    }

    // Format tasks so their 'labels' property is just an array of IDs, exactly as React expects
    const formattedProjects = projects.map((p) => ({
      ...p,
      tasks: p.tasks.map((t) => ({
        ...t,
        labels: t.labels.map((l) => l.id),
      })),
    }));

    console.log(`[SERVER ACTION] Fetched all projects. Total count: ${formattedProjects.length}`);
    return formattedProjects;
  } catch (error) {
    console.error("[SERVER ACTION ERROR: getProjects]", error);
    throw new Error("Failed to fetch projects");
  }
}

/**
 * Create a new project, cloning default labels from General project if none provided
 */
export async function createProject({ id, name, labels, userId }) {
  if (!userId) throw new Error("userId is required");
  if (!name || !name.trim()) throw new Error("Project name is required");

  try {
    let labelsToCreate = labels
      ? labels.map((l) => ({ id: l.id, name: l.name, color: l.color }))
      : [];

    // Fallback: If no labels provided, clone from General project
    if (labelsToCreate.length === 0) {
      const generalProject = await prisma.project.findFirst({
        where: { name: "General", userId },
        include: { labels: true },
      });

      labelsToCreate =
        generalProject?.labels.map((l) => ({ name: l.name, color: l.color })) || [];
    }

    const newProject = await prisma.project.create({
      data: {
        id: id || undefined,
        name: name.trim(),
        userId,
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
export async function deleteProject(projectId) {
  try {
    const projectToDelete = await prisma.project.findUnique({ where: { id: projectId } });
    if (projectToDelete && projectToDelete.name === "General") {
      throw new Error("The General project cannot be deleted.");
    }

    await prisma.project.delete({ where: { id: projectId } });
    console.log(`[SERVER ACTION] Removed project ID: ${projectId}`);
    return { success: true, id: projectId };
  } catch (error) {
    console.error("[SERVER ACTION ERROR: deleteProject]", error);
    throw new Error(error.message || "Failed to delete project");
  }
}

/**
 * Update a project (e.g., renaming)
 */
export async function updateProject({ id, name }) {
  if (!name || typeof name !== "string" || !name.trim()) {
    throw new Error("Project name is required and cannot be empty.");
  }

  try {
    const projectToUpdate = await prisma.project.findUnique({ where: { id } });
    if (projectToUpdate && projectToUpdate.name === "General") {
      throw new Error("The General project cannot be modified.");
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: { name: name.trim() },
    });

    console.log(`[SERVER ACTION] Updated project ID: ${id}`);
    return updatedProject;
  } catch (error) {
    console.error("[SERVER ACTION ERROR: updateProject]", error);
    throw new Error(error.message || "Failed to update project");
  }
}
