"use server";

import prisma from "@/backend/lib/prisma";
import { verifyUserAccess } from "@/backend/lib/authHelper";

/**
 * Get all tasks for a given user
 */
export async function getTasks(userId: string) {
  try {
    const actorId = await verifyUserAccess(userId);

    const tasks = await prisma.task.findMany({
      where: {
        project: { userId: actorId },
      },
      include: { labels: true, project: true },
    });
    console.log(`[SERVER ACTION] Fetched all tasks. Total count: ${tasks.length}`);
    return tasks;
  } catch (error) {
    console.error("[SERVER ACTION ERROR: getTasks]", error);
    throw new Error("Failed to fetch tasks");
  }
}

interface FilterArgs {
  status?: string;
  priority?: string;
  labels?: string[];
}

/**
 * Get filtered tasks for a specific project
 */
export async function getFilteredTasks(projectId: string, filters: FilterArgs, userId: string) {
  try {
    const actorId = await verifyUserAccess(userId);

    // Construct dynamic filter parameters based on frontend selections
    const whereClause: any = {
      projectId: projectId,
      project: { userId: actorId },
    };

    if (filters) {
      if (filters.status === "Finished") {
        whereClause.done = true;
      } else if (filters.status === "On working") {
        whereClause.done = false;
      }

      if (filters.priority && filters.priority !== "ALL") {
        whereClause.priority = filters.priority.toLowerCase();
      }

      if (filters.labels && filters.labels.length > 0) {
        whereClause.labels = {
          some: {
            id: {
              in: filters.labels,
            },
          },
        };
      }
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: { labels: true },
      orderBy: { createdAt: 'asc' }, // Ensure consistent ordering
    });

    console.log(`[SERVER ACTION] Fetched filtered tasks for project ${projectId}. Count: ${tasks.length}`);

    // Flatten label objects into ID arrays for Zustand store compatibility
    return tasks.map((t) => ({
      ...t,
      labels: t.labels.map((l) => l.id),
    }));
  } catch (error) {
    console.error("[SERVER ACTION ERROR: getFilteredTasks]", error);
    throw new Error("Failed to fetch filtered tasks");
  }
}

interface CreateTaskArgs {
  id?: string;
  title: string;
  done?: boolean;
  priority?: string;
  labels?: string[];
  projectId?: string;
  projectIds?: string[];
}

/**
 * Create a new task and link any attached labels
 */
export async function createTask({ id, title, done = false, priority, labels = [], projectId, projectIds }: CreateTaskArgs, userId: string) {
  try {
    const actorId = await verifyUserAccess(userId);

    const activeProjectId = projectId || (projectIds && projectIds.length > 0 ? projectIds[0] : null);
    if (!activeProjectId) {
      throw new Error("Task must belong to a project");
    }

    // Ensure actor has authorization to modify the parent project
    const project = await prisma.project.findUnique({ where: { id: activeProjectId } });
    if (!project || project.userId !== actorId) {
      throw new Error("Unauthorized to add tasks to this project");
    }

    const connectLabels = Array.isArray(labels)
      ? labels.map((lid) => ({ id: lid }))
      : [];

    const newTask = await prisma.task.create({
      data: {
        id: id || undefined,
        title,
        done,
        priority: priority || "low",
        projectId: activeProjectId,
        labels: { connect: connectLabels },
      },
      include: { labels: true },
    });

    console.log(`[SERVER ACTION] Created new task: "${newTask.title}"`);
    return {
      ...newTask,
      labels: newTask.labels ? newTask.labels.map((l) => l.id) : [],
    };
  } catch (error) {
    console.error("[SERVER ACTION ERROR: createTask]", error);
    throw new Error("Failed to create task");
  }
}

/**
 * Update an existing task (title, done status, priority, or attached labels)
 */
export async function updateTask(taskId: string, updatedData: any, userId: string) {
  try {
    const actorId = await verifyUserAccess(userId);

    // Ensure actor has authorization to modify the parent project
    const task = await prisma.task.findUnique({ 
      where: { id: taskId }, 
      include: { project: true } 
    });
    if (!task || task.project.userId !== actorId) {
      throw new Error("Unauthorized to update this task");
    }

    const prismaUpdateData = { ...updatedData };

    // Remove virtual fields from update payload to prevent Prisma schema validation errors
    if (prismaUpdateData.projectIds) {
      delete prismaUpdateData.projectIds;
    }

    // Transform label ID arrays into Prisma relation mutation syntax
    if (updatedData.labels && Array.isArray(updatedData.labels)) {
      prismaUpdateData.labels = {
        set: updatedData.labels.map((lid) => ({ id: lid })),
      };
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: prismaUpdateData,
      include: { labels: true },
    });

    console.log(`[SERVER ACTION] Updated task ID: ${taskId}`);
    return {
      ...updatedTask,
      labels: updatedTask.labels ? updatedTask.labels.map((l) => l.id) : [],
    };
  } catch (error) {
    console.error("[SERVER ACTION ERROR: updateTask]", error);
    throw new Error("Failed to update task");
  }
}

/**
 * Delete a specific task by ID
 */
export async function deleteTask(taskId: string, userId: string) {
  try {
    const actorId = await verifyUserAccess(userId);

    // Verify task ownership via project
    const task = await prisma.task.findUnique({ 
      where: { id: taskId }, 
      include: { project: true } 
    });
    if (!task || task.project.userId !== actorId) {
      throw new Error("Unauthorized to delete this task");
    }

    await prisma.task.delete({ where: { id: taskId } });
    console.log(`[SERVER ACTION] Removed task ID: ${taskId}`);
    return { success: true, id: taskId };
  } catch (error) {
    console.error("[SERVER ACTION ERROR: deleteTask]", error);
    throw new Error("Failed to delete task");
  }
}

/**
 * Delete all tasks inside a project
 */
export async function deleteAllTasks(projectId: string, userId: string) {
  if (!projectId) throw new Error("projectId is required to delete all tasks");

  try {
    const actorId = await verifyUserAccess(userId);

    // Ensure actor has authorization to modify the parent project
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.userId !== actorId) {
      throw new Error("Unauthorized to delete tasks in this project");
    }

    await prisma.task.deleteMany({ where: { projectId } });
    console.log(`[SERVER ACTION] Removed ALL tasks for project: ${projectId}`);
    return { success: true };
  } catch (error) {
    console.error("[SERVER ACTION ERROR: deleteAllTasks]", error);
    throw new Error("Failed to delete all tasks");
  }
}
