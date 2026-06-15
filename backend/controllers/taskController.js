// In-memory array to store tasks (Database simulation)
let tasks = [
    {
        id: "test-id-1",
        title: "Learn Express Routes",
        done: false,
        priority: "high",
        labels: []
    }
];

// @desc    Get all tasks
// @route   GET /api/tasks
const getTasks = (req, res) => {
    console.log(`[GET] Fetched all tasks. Total count: ${tasks.length}`);
    res.status(200).json(tasks);
};

// @desc    Create a new task
// @route   POST /api/tasks
const createTask = (req, res) => {
    const newTask = req.body;
    
    // In a real DB, ID is generated automatically. 
    // Here we use the one sent from frontend or generate a fallback.
    if (!newTask.id) {
        newTask.id = Date.now().toString();
    }
    
    tasks.push(newTask);
    console.log(`[POST] Created new task: "${newTask.title}"`);
    res.status(201).json(newTask);
};

// @desc    Update an existing task
// @route   PUT /api/tasks/:id
const updateTask = (req, res) => {
    const taskId = req.params.id;
    const updatedTaskData = req.body;
    
    // Find the index of the task we want to update
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    
    if (taskIndex === -1) {
        return res.status(404).json({ message: "Task not found" });
    }
    
    // Update the task by merging existing data with new data
    tasks[taskIndex] = { ...tasks[taskIndex], ...updatedTaskData };
    
    console.log(`[PUT] Updated task ID: ${taskId}`);
    res.status(200).json(tasks[taskIndex]);
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
const deleteTask = (req, res) => {
    const taskId = req.params.id;
    
    const taskExists = tasks.some(task => task.id === taskId);
    if (!taskExists) {
        return res.status(404).json({ message: "Task not found" });
    }
    
    // Filter out the deleted task
    tasks = tasks.filter(task => task.id !== taskId);
    
    console.log(`[DELETE] Removed task ID: ${taskId}`);
    res.status(200).json({ message: "Task removed successfully", id: taskId });
};

// @desc    Delete ALL tasks
// @route   DELETE /api/tasks
const deleteAllTasks = (req, res) => {
    tasks = [];
    console.log(`[DELETE] Removed ALL tasks.`);
    res.status(200).json({ message: "All tasks removed successfully" });
};

module.exports = {
    getTasks,
    createTask,
    updateTask,
    deleteTask,
    deleteAllTasks
};
