const express = require('express');
const router = express.Router();
const { getLabels, createLabel, deleteLabel, deleteAllLabels } = require('../controllers/labelController');

// Define routes and attach their corresponding controller functions
router.route('/')
    .get(getLabels)
    .post(createLabel)
    .delete(deleteAllLabels);

router.route('/:id')
    .delete(deleteLabel);

module.exports = router;
