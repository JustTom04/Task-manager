const express = require('express');
const router = express.Router();
const { getProjects, createProject, deleteProject, updateProject } = require('../controllers/projectController');

router.route('/')
    .get(getProjects)
    .post(createProject);

router.route('/:id')
    .patch(updateProject)
    .delete(deleteProject);

module.exports = router;
