const express = require('express');
const router = express.Router();
const simulatorController = require('../controllers/simulatorController');

router.post('/execute', simulatorController.executeProgram);
router.post('/step', simulatorController.stepExecution);
router.post('/reset', simulatorController.reset);

module.exports = router;