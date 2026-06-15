const prisma = require('../prismaClient');

// @desc    Get all labels
// @route   GET /api/labels
const getLabels = async (req, res) => {
    try {
        const labels = await prisma.label.findMany({
            include: { projects: true }
        });
        console.log(`[GET] Fetched all labels. Total count: ${labels.length}`);
        res.status(200).json(labels);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch labels" });
    }
};

// @desc    Create a new label
// @route   POST /api/labels
const createLabel = async (req, res) => {
    try {
        const { id, name, color, projectIds } = req.body;
        
        // Frontend sends projectIds: [activeProjectId]. For One-to-Many, we take the first one.
        const projectId = projectIds && projectIds.length > 0 ? projectIds[0] : null;

        if (!projectId) {
            return res.status(400).json({ error: "Label must belong to a project" });
        }

        const newLabel = await prisma.label.create({
            data: {
                id: id || undefined,
                name,
                color,
                projectId: projectId
            }
        });
        
        console.log(`[POST] Created new label: "${newLabel.name}" (Prisma)`);
        res.status(201).json(newLabel);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to create label" });
    }
};

// @desc    Delete a label
// @route   DELETE /api/labels/:id
const deleteLabel = async (req, res) => {
    try {
        const labelId = req.params.id;
        
        await prisma.label.delete({
            where: { id: labelId }
        });
        
        console.log(`[DELETE] Removed label ID: ${labelId} (Prisma)`);
        res.status(200).json({ message: "Label removed successfully", id: labelId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to delete label" });
    }
};

// @desc    Delete ALL labels
// @route   DELETE /api/labels
const deleteAllLabels = async (req, res) => {
    try {
        const projectId = req.query.projectId;
        if (!projectId) {
            return res.status(400).json({ error: "projectId is required to delete labels" });
        }
        
        await prisma.label.deleteMany({
            where: { projectId: projectId }
        });
        console.log(`[DELETE] Removed ALL labels for project ${projectId} (Prisma).`);
        res.status(200).json({ message: "All labels removed successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to delete all labels" });
    }
};

module.exports = {
    getLabels,
    createLabel,
    deleteLabel,
    deleteAllLabels
};
