const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const controller = require('../controllers/shiftmanagementController');

// Shift Type Routes
router.get('/shift-types', controller.getAllShiftTypes);
router.post('/shift-types', [
  check('shiftname')
    .notEmpty()
    .withMessage('Shift name is required')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Shift name must be between 1 and 100 characters'),
  check('defaultduration')
    .isInt({ min: 1 })
    .withMessage('Default duration must be a positive integer')
    .toInt(),
  check('shiftcategory')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Shift category must not exceed 50 characters')
], controller.createShiftType);
router.put('/shift-types/:id', [
  check('id')
    .isUUID()
    .withMessage('Invalid shift type ID format'),
  check('shiftname')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Shift name must be between 1 and 100 characters'),
  check('defaultduration')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Default duration must be a positive integer')
    .toInt(),
  check('shiftcategory')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Shift category must not exceed 50 characters')
], controller.updateShiftType);
router.delete('/shift-types/:id', [
  check('id')
    .isUUID()
    .withMessage('Invalid shift type ID format')
], controller.deleteShiftType);

// User Shifts Routes
router.get('/users/:userId/shifts', controller.getUserShifts);
router.post('/users/:userId/shifts', [
  check('shifttypeid').isUUID().withMessage('Shift Type ID must be a valid UUID'),
  check('shiftstarttime').isISO8601().withMessage('Shift start time must be a valid ISO 8601 date'),
  check('shiftendtime').isISO8601().withMessage('Shift end time must be a valid ISO 8601 date'),
  check('shiftlocation').notEmpty().withMessage('Shift location is required'),
  check('assignedby').isUUID().withMessage('Assigned By ID must be a valid UUID')
], controller.createShift);

// General Shift Routes
router.put('/shifts/:id', [
  check('shifttypeid').optional().isUUID().withMessage('Shift Type ID must be a valid UUID'),
  check('shiftstarttime').optional().isISO8601().withMessage('Shift start time must be a valid ISO 8601 date'),
  check('shiftendtime').optional().isISO8601().withMessage('Shift end time must be a valid ISO 8601 date'),
  check('shiftlocation').optional().notEmpty().withMessage('Shift location is required'),
  check('userid').optional().isUUID().withMessage('User ID must be a valid UUID'),
  check('assignedby').optional().isUUID().withMessage('Assigned By ID must be a valid UUID')
], controller.updateShift);
router.delete('/shifts/:id', controller.deleteShift);

module.exports = router;