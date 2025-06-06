const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const controller = require('../controllers/overtimeController');

// Get all overtime requests (admin only)
router.get('/', controller.getAllOvertimeRequests);

// Get overtime requests for a specific user
router.get('/user/:userId', controller.getUserOvertimeRequests);

// Create a new overtime request
router.post('/', [
  check('userid')
    .isUUID()
    .withMessage('User ID must be a valid UUID'),
  check('shiftid')
    .isUUID()
    .withMessage('Shift ID must be a valid UUID')
], controller.createOvertimeRequest);

// Update overtime request status (admin only)
router.put('/:requestid/status', [
  check('requestid')
    .isUUID()
    .withMessage('Request ID must be a valid UUID'),
  check('status')
    .isIn(['approved', 'rejected'])
    .withMessage('Status must be either "approved" or "rejected"')
], controller.updateOvertimeRequestStatus);

// Delete overtime request
router.delete('/:requestid', [
  check('requestid')
    .isUUID()
    .withMessage('Request ID must be a valid UUID')
], controller.deleteOvertimeRequest);

module.exports = router;