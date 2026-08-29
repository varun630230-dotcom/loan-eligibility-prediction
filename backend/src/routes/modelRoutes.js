const express = require('express');
const router = express.Router();
const modelController = require('../controllers/modelController');
const auth = require('../middleware/auth');

router.use(auth);
router.get('/info', modelController.getInfo);
router.get('/metrics', modelController.getMetrics);
router.get('/features', modelController.getFeatures);

module.exports = router;
