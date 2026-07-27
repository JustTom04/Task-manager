"use server";

import prisma from "@/backend/lib/prisma";

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
export async function createLabel({ id, name, color, projectIds }) {
  try {
    const projectId = projectIds && projectIds.length > 0 ? projectIds[0] : null;
    if (!projectId) {
      throw new Error("Label must belong to a project");
    }

    const newLabel = await prisma.label.create({
      data: {
        id: id || undefined,
        name,
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
export async function deleteLabel(labelId) {
  try {
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
export async function deleteAllLabels(projectId) {
  if (!projectId) throw new Error("projectId is required to delete labels");

  try {
    await prisma.label.deleteMany({ where: { projectId } });
    console.log(`[SERVER ACTION] Removed ALL labels for project: ${projectId}`);
    return { success: true };
  } catch (error) {
    console.error("[SERVER ACTION ERROR: deleteAllLabels]", error);
    throw new Error("Failed to delete all labels");
  }
}
