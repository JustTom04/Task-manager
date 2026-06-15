const { getTasksByProjectId } = require('./taskController');
const { getLabelsByProjectId, addProjectToLabel } = require('./labelController');

let projects = [
    { id: "default-project", name: "General" }
];

// @desc    Get all projects with their nested tasks and labels
// @route   GET /api/projects
const getProjects = (req, res) => {
    const aggregatedProjects = projects.map(project => {
        return {
            ...project,
            tasks: getTasksByProjectId(project.id),
            labels: getLabelsByProjectId(project.id)
        };
    });
    
    console.log(`[GET] Fetched all projects (Aggregated tree). Total count: ${projects.length}`);
    res.status(200).json(aggregatedProjects);
};

// @desc    Create a new project
// @route   POST /api/projects
const createProject = (req, res) => {
    const newProject = req.body;
    
    if (!newProject.id) {
        newProject.id = Date.now().toString();
    }
    
    projects.push({
        id: newProject.id,
        name: newProject.name
    });

    // If the frontend sent default copied labels, add this new project to those labels
    if (newProject.labels && Array.isArray(newProject.labels)) {
        newProject.labels.forEach(label => {
            addProjectToLabel(label.id, newProject.id);
        });
    }
    
    console.log(`[POST] Created new project: "${newProject.name}"`);
    res.status(201).json(newProject);
};

// @desc    Delete a project
// @route   DELETE /api/projects/:id
const deleteProject = (req, res) => {
    const projectId = req.params.id;
    projects = projects.filter(p => p.id.toString() !== projectId.toString());
    
    console.log(`[DELETE] Removed project ID: ${projectId}`);
    res.status(200).json({ message: "Project removed successfully", id: projectId });
};

module.exports = {
    getProjects,
    createProject,
    deleteProject
};
