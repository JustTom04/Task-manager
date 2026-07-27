"use server";

import prisma from "@/backend/lib/prisma";

/**
 * Get all tasks for a given user
 */
export async function getTasks(userId) {
  try {
    const tasks = await prisma.task.findMany({
      where: {
        project: { userId },
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
 * Create a new task and link any attached labels
 */
export async function createTask({ id, title, done = false, priority, labels = [], projectId, projectIds }) {
  try {
    const activeProjectId = projectId || (projectIds && projectIds.length > 0 ? projectIds[0] : null);
    if (!activeProjectId) {
      throw new Error("Task must belong to a project");
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
export async function updateTask(taskId, updatedData) {
  try {
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
export async function deleteTask(taskId) {
  try {
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
export async function deleteAllTasks(projectId) {
  if (!projectId) throw new Error("projectId is required to delete all tasks");

  try {
    await prisma.task.deleteMany({ where: { projectId } });
    console.log(`[SERVER ACTION] Removed ALL tasks for project: ${projectId}`);
    return { success: true };
  } catch (error) {
    console.error("[SERVER ACTION ERROR: deleteAllTasks]", error);
    throw new Error("Failed to delete all tasks");
  }
}
