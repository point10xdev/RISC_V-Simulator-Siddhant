const express = require('express');
const router = express.Router();
const simulatorController = require('../controllers/simulatorController');

router.post('/execute', simulatorController.executeProgram);
router.post('/step', simulatorController.stepExecution);
router.post('/reset', simulatorController.reset);
router.post('/generate-assembly', simulatorController.generateAssembly); // <--- NEW ROUTE

module.exports = router;