const express = require('express');
const router = express.Router();
const applicantController = require('../controllers/applicantController');
const { applicantSchema } = require('../validators/applicantValidator');
const validator = require('../middleware/validator');
const auth = require('../middleware/auth');

router.use(auth);
router.post('/', validator(applicantSchema), applicantController.create);
router.get('/', applicantController.getAll);
router.get('/:id', applicantController.getById);

module.exports = router;
