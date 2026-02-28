const express = require('express');
const router = express.Router();
const roadmapController = require('../controllers/roadmap.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

// Apply auth middleware to all roadmap routes
router.use(authenticateToken);

// GET /api/roadmaps/history — Fetch user's previous roadmaps
router.get('/history', roadmapController.getHistory);

// POST /api/roadmaps/generate — Generate a new roadmap using Gemini
router.post('/generate', roadmapController.generateRoadmap);

// DELETE /api/roadmaps/:id — Delete a roadmap from history
router.delete('/:id', roadmapController.deleteRoadmap);

module.exports = router;
