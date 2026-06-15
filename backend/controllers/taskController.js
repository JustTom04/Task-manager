const prisma = require('../prismaClient');

// @desc    Get all tasks
// @route   GET /api/tasks
const getTasks = async (req, res) => {
    try {
        const tasks = await prisma.task.findMany({
            include: { labels: true, projects: true }
        });
        console.log(`[GET] Fetched all tasks. Total count: ${tasks.length}`);
        res.status(200).json(tasks);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch tasks" });
    }
};

// @desc    Create a new task
// @route   POST /api/tasks
const createTask = async (req, res) => {
    try {
        const { id, title, done, priority, labels, projectId, projectIds } = req.body;
        
        // Handle both old frontend (projectIds array) and new frontend (projectId string)
        const activeProjectId = projectId || (projectIds && projectIds.length > 0 ? projectIds[0] : null);

        if (!activeProjectId) {
            return res.status(400).json({ error: "Task must belong to a project" });
        }
            
        const connectLabels = labels && Array.isArray(labels) 
            ? labels.map(lid => ({ id: lid })) 
            : [];

        const newTask = await prisma.task.create({
            data: {
                id: id || undefined,
                title,
                done,
                priority,
                projectId: activeProjectId,
                labels: { connect: connectLabels }
            }
        });
        
        console.log(`[POST] Created new task: "${newTask.title}" (Prisma)`);
        res.status(201).json(newTask);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to create task" });
    }
};

// @desc    Update an existing task
// @route   PUT /api/tasks/:id
const updateTask = async (req, res) => {
    try {
        const taskId = req.params.id;
        const updatedTaskData = req.body;
        
        // Prisma expects relation updates via connect/set/disconnect
        let prismaUpdateData = { ...updatedTaskData };
        
        if (updatedTaskData.labels) {
            prismaUpdateData.labels = { 
                set: updatedTaskData.labels.map(lid => ({ id: lid })) 
            };
        }
        
        // Clean up projectIds if it was sent by frontend (we don't allow changing projects via PUT easily, but if so, it's projectId)
        if (updatedTaskData.projectIds) {
            delete prismaUpdateData.projectIds;
        }

        const updatedTask = await prisma.task.update({
            where: { id: taskId },
            data: prismaUpdateData
        });
        
        console.log(`[PUT] Updated task ID: ${taskId} (Prisma)`);
        res.status(200).json(updatedTask);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to update task" });
    }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
const deleteTask = async (req, res) => {
    try {
        const taskId = req.params.id;
        
        await prisma.task.delete({
            where: { id: taskId }
        });
        
        console.log(`[DELETE] Removed task ID: ${taskId} (Prisma)`);
        res.status(200).json({ message: "Task removed successfully", id: taskId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to delete task" });
    }
};

// @desc    Delete ALL tasks
// @route   DELETE /api/tasks
const deleteAllTasks = async (req, res) => {
    try {
        const projectId = req.query.projectId;
        if (!projectId) {
            return res.status(400).json({ error: "projectId is required to delete all tasks" });
        }
        await prisma.task.deleteMany({
            where: { projectId: projectId }
        });
        console.log(`[DELETE] Removed ALL tasks for project ${projectId} (Prisma).`);
        res.status(200).json({ message: "All tasks removed successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to delete all tasks" });
    }
};

module.exports = {
    getTasks,
    createTask,
    updateTask,
    deleteTask,
    deleteAllTasks
};
