const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const controller = require('../controllers/shiftSwapRequestController');

// Get all shift swap requests
router.get('/', controller.getShiftSwapRequests);

// Get all shift swap requests for a specific user
router.get('/user/:userId', controller.getUserShiftSwapRequests);

// Create a new shift swap request
router.post('/', [
    check('requestingUserId').isUUID().withMessage('Requesting user ID must be a valid UUID'),
    check('requestedShiftId').isUUID().withMessage('Requested shift ID must be a valid UUID'),
    check('colleagueId').isUUID().withMessage('Colleague ID must be a valid UUID'),
    check('colleagueShiftId').isUUID().withMessage('Colleague shift ID must be a valid UUID'),
    check('reason').notEmpty().withMessage('Reason is required'),
    check('status').optional().isIn(['Pending', 'Approved', 'Rejected']).withMessage('Invalid status')
], controller.createNewShiftSwapRequest);

// Update shift swap request status
router.put('/:id', [
    check('status').isIn(['Pending', 'Approved', 'Rejected']).withMessage('Invalid status')
], controller.updateShiftSwapRequest);

module.exports = router;
