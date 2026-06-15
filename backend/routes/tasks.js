const express = require('express');
const router = express.Router();
const { getTasks, createTask, updateTask, deleteTask, deleteAllTasks } = require('../controllers/taskController');

// Define routes and attach their corresponding controller functions
router.route('/')
    .get(getTasks)
    .post(createTask)
    .delete(deleteAllTasks);

router.route('/:id')
    .put(updateTask)
    .delete(deleteTask);

module.exports = router;
