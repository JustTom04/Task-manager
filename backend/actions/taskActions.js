"use server";

import prisma from "@/backend/lib/prisma";
import { verifyUserAccess } from "@/backend/lib/authHelper";

/**
 * Get all tasks for a given user
 */
export async function getTasks(userId) {
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

/**
 * Get filtered tasks for a specific project
 */
export async function getFilteredTasks(projectId, filters, userId) {
  try {
    const actorId = await verifyUserAccess(userId);

    // Build the Prisma "where" clause dynamically
    const whereClause = {
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

    // Format tasks so their 'labels' property is just an array of IDs
    return tasks.map((t) => ({
      ...t,
      labels: t.labels.map((l) => l.id),
    }));
  } catch (error) {
    console.error("[SERVER ACTION ERROR: getFilteredTasks]", error);
    throw new Error("Failed to fetch filtered tasks");
  }
}

/**
 * Create a new task and link any attached labels
 */
export async function createTask({ id, title, done = false, priority, labels = [], projectId, projectIds }, userId) {
  try {
    const actorId = await verifyUserAccess(userId);

    const activeProjectId = projectId || (projectIds && projectIds.length > 0 ? projectIds[0] : null);
    if (!activeProjectId) {
      throw new Error("Task must belong to a project");
    }

    // Verify project ownership
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
        priority,
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
export async function updateTask(taskId, updatedData, userId) {
  try {
    const actorId = await verifyUserAccess(userId);

    // Verify task ownership via project
    const task = await prisma.task.findUnique({ 
      where: { id: taskId }, 
      include: { project: true } 
    });
    if (!task || task.project.userId !== actorId) {
      throw new Error("Unauthorized to update this task");
    }

    const prismaUpdateData = { ...updatedData };

    // Delete projectIds if present so Prisma does not complain
    if (prismaUpdateData.projectIds) {
      delete prismaUpdateData.projectIds;
    }

    // Format relation updates cleanly for Prisma
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
export async function deleteTask(taskId, userId) {
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
export async function deleteAllTasks(projectId, userId) {
  if (!projectId) throw new Error("projectId is required to delete all tasks");

  try {
    const actorId = await verifyUserAccess(userId);

    // Verify project ownership
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
