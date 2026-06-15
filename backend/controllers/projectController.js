const prisma = require('../prismaClient');

// @desc    Get all projects with their nested tasks and labels
// @route   GET /api/projects
const getProjects = async (req, res) => {
    try {
        let projects = await prisma.project.findMany({
            include: {
                tasks: {
                    include: {
                        labels: true
                    }
                },
                labels: true
            }
        });
        
        // Ha teljesen üres az adatbázis, hozzunk létre egy alapértelmezett projektet
        if (projects.length === 0) {
            const defaultProject = await prisma.project.create({
                data: {
                    name: "General",
                    labels: {
                        create: [
                            { name: "Work", color: "#f28b82" },
                            { name: "Personal", color: "#fbbc04" },
                            { name: "Urgent", color: "#34a853" }
                        ]
                    }
                },
                include: {
                    tasks: {
                        include: {
                            labels: true
                        }
                    },
                    labels: true
                }
            });
            projects.push(defaultProject);
        }
        
        // React expects 'labels' inside tasks to only contain an array of IDs,
        // while the 'labels' inside projects should be full objects.
        const formattedProjects = projects.map(p => ({
            ...p,
            tasks: p.tasks.map(t => ({
                ...t,
                labels: t.labels.map(l => l.id)
            }))
        }));

        console.log(`[GET] Fetched all projects (Prisma). Total count: ${formattedProjects.length}`);
        res.status(200).json(formattedProjects);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch projects", details: error.message, stack: error.stack });
    }
};

// @desc    Create a new project
// @route   POST /api/projects
const createProject = async (req, res) => {
    try {
        const { id, name } = req.body;
        
        // Fetch 'General' project to clone its labels for the new project
        const generalProject = await prisma.project.findFirst({
            where: { name: "General" },
            include: { labels: true }
        });
        
        const cloneLabels = generalProject?.labels.map(l => ({
            name: l.name,
            color: l.color
        })) || [];

        const newProject = await prisma.project.create({
            data: {
                id: id || undefined,
                name: name,
                labels: {
                    create: cloneLabels // Create new specific labels for this project
                }
            },
            include: {
                tasks: true,
                labels: true
            }
        });
        
        console.log(`[POST] Created new project: "${newProject.name}" (Prisma, Cloned Labels)`);
        res.status(201).json(newProject);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to create project" });
    }
};

// @desc    Delete a project
// @route   DELETE /api/projects/:id
const deleteProject = async (req, res) => {
    try {
        const projectId = req.params.id;
        
        // Prevent deleting the General project
        const projectToDelete = await prisma.project.findUnique({ where: { id: projectId } });
        if (projectToDelete && projectToDelete.name === "General") {
            return res.status(403).json({ error: "The General project cannot be deleted." });
        }

        await prisma.project.delete({
            where: { id: projectId }
        });
        
        console.log(`[DELETE] Removed project ID: ${projectId} (Prisma)`);
        res.status(200).json({ message: "Project removed successfully", id: projectId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to delete project" });
    }
};

module.exports = {
    getProjects,
    createProject,
    deleteProject
};
