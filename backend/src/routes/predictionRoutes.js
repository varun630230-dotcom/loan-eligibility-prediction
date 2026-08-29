const express = require('express');
const router = express.Router();
const predictionController = require('../controllers/predictionController');
const { applicantSchema } = require('../validators/applicantValidator');
const validator = require('../middleware/validator');
const auth = require('../middleware/auth');

router.use(auth);
router.post('/', validator(applicantSchema), predictionController.create);
router.get('/history', predictionController.getHistory);
router.get('/:id', predictionController.getById);

module.exports = router;
