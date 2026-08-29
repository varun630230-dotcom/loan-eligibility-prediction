const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

router.use(auth, adminAuth);
router.get('/dashboard', adminController.getDashboard);
router.get('/statistics', adminController.getStatistics);
router.get('/users', adminController.getUsers);

module.exports = router;
