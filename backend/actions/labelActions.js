"use server";

import prisma from "@/backend/lib/prisma";
import { verifyUserAccess } from "@/backend/lib/authHelper";

/**
 * Get all labels across projects
 */
export async function getLabels() {
  try {
    const labels = await prisma.label.findMany({
      include: { projects: true },
    });
    console.log(`[SERVER ACTION] Fetched all labels. Total count: ${labels.length}`);
    return labels;
  } catch (error) {
    console.error("[SERVER ACTION ERROR: getLabels]", error);
    throw new Error("Failed to fetch labels");
  }
}

/**
 * Create a new label tied to a project
 */
export async function createLabel({ id, name, color, projectIds }, userId) {
  try {
    const actorId = await verifyUserAccess(userId);

    const projectId = projectIds && projectIds.length > 0 ? projectIds[0] : null;
    if (!projectId) {
      throw new Error("Label must belong to a project");
    }

    // Verify project ownership
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.userId !== actorId) {
      throw new Error("Unauthorized to add labels to this project");
    }

    const trimmedName = name.trim();

    // Prevent duplicate label names within the same project
    const existingLabel = await prisma.label.findFirst({
      where: {
        projectId,
        name: {
          equals: trimmedName,
          mode: 'insensitive'
        }
      }
    });

    if (existingLabel) {
      throw new Error("A label with this name already exists in the project.");
    }

    const newLabel = await prisma.label.create({
      data: {
        id: id || undefined,
        name: trimmedName,
        color,
        projectId,
      },
    });

    console.log(`[SERVER ACTION] Created new label: "${newLabel.name}"`);
    return newLabel;
  } catch (error) {
    console.error("[SERVER ACTION ERROR: createLabel]", error);
    throw new Error("Failed to create label");
  }
}

/**
 * Delete a specific label by ID
 */
export async function deleteLabel(labelId, userId) {
  try {
    const actorId = await verifyUserAccess(userId);

    // Verify label ownership via project
    const label = await prisma.label.findUnique({ 
      where: { id: labelId }, 
      include: { project: true } 
    });
    if (!label || label.project.userId !== actorId) {
      throw new Error("Unauthorized to delete this label");
    }

    await prisma.label.delete({ where: { id: labelId } });
    console.log(`[SERVER ACTION] Removed label ID: ${labelId}`);
    return { success: true, id: labelId };
  } catch (error) {
    console.error("[SERVER ACTION ERROR: deleteLabel]", error);
    throw new Error("Failed to delete label");
  }
}

/**
 * Delete all labels for a specific project
 */
export async function deleteAllLabels(projectId, userId) {
  if (!projectId) throw new Error("projectId is required to delete labels");

  try {
    const actorId = await verifyUserAccess(userId);

    // Verify project ownership
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.userId !== actorId) {
      throw new Error("Unauthorized to delete labels in this project");
    }

    await prisma.label.deleteMany({ where: { projectId } });
    console.log(`[SERVER ACTION] Removed ALL labels for project: ${projectId}`);
    return { success: true };
  } catch (error) {
    console.error("[SERVER ACTION ERROR: deleteAllLabels]", error);
    throw new Error("Failed to delete all labels");
  }
}
