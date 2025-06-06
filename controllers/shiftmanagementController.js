const User = require('../models/userModel');
const { ShiftType, Shift } = require('../models/shiftmanagementModels');
const { ShiftSwapRequest } = require('../models/shiftSwapRequest');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const sequelize = require('../config/db');

// Verifying if th models are loaded
if (!User || !ShiftType || !Shift || !ShiftSwapRequest) {
  console.error('Models not properly loaded:', {
    User: !!User,
    ShiftType: !!ShiftType,
    Shift: !!Shift,
    ShiftSwapRequest: !!ShiftSwapRequest
  });
  throw new Error('Required models not properly initialized');
}

// Debug logging to verify models
console.log('Models loaded:', {
  ShiftType: !!ShiftType,
  Shift: !!Shift,
  User: !!User,
  ShiftSwapRequest: !!ShiftSwapRequest
});

// Shift Type Operations
async function getAllShiftTypes(req, res) {
  try {
    console.log('Fetching all shift types...');
    const shiftTypes = await ShiftType.findAll({
      attributes: ['shifttypeid', 'shiftname', 'defaultduration', 'shiftcategory']
    });
    console.log(`Found ${shiftTypes.length} shift types`);
    res.status(200).json(shiftTypes);
  } catch (error) {
    console.error('Error in getAllShiftTypes:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve shift types',
      error: error.message 
    });
  }
}

async function createShiftType(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    console.log('Creating shift type with data:', req.body);
    
    // Validate required fields
    if (!req.body.shiftname || !req.body.defaultduration) {
      return res.status(400).json({
        message: 'Missing required fields',
        required: ['shiftname', 'defaultduration']
      });
    }

    // Validate default duration
    const duration = parseInt(req.body.defaultduration);
    if (isNaN(duration) || duration <= 0) {
      return res.status(400).json({
        message: 'Default duration must be a positive number'
      });
    }

    const shiftType = await ShiftType.create({
      shiftname: req.body.shiftname,
      defaultduration: duration,
      shiftcategory: req.body.shiftcategory
    });
    
    console.log('Shift type created successfully:', shiftType);
    
    res.status(201).json({
      shifttypeid: shiftType.shifttypeid,
      shiftname: shiftType.shiftname,
      defaultduration: shiftType.defaultduration,
      shiftcategory: shiftType.shiftcategory
    });
  } catch (error) {
    console.error('Error in createShiftType:', error);
    res.status(500).json({
      message: 'Error creating shift type',
      error: error.message
    });
  }
}

async function updateShiftType(req, res) {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        message: 'Shift type ID is required'
      });
    }

    console.log('Updating shift type:', id);
    
    const shiftType = await ShiftType.findByPk(id);
    if (!shiftType) {
      return res.status(404).json({ 
        message: 'Shift type not found',
        id: id
      });
    }

    // Validate default duration if provided
    if (req.body.defaultduration) {
      const duration = parseInt(req.body.defaultduration);
      if (isNaN(duration) || duration <= 0) {
        return res.status(400).json({
          message: 'Default duration must be a positive number'
        });
      }
      req.body.defaultduration = duration;
    }

    const updated = await shiftType.update({
      shiftname: req.body.shiftname || shiftType.shiftname,
      defaultduration: req.body.defaultduration || shiftType.defaultduration,
      shiftcategory: req.body.shiftcategory || shiftType.shiftcategory
    });

    console.log('Shift type updated successfully:', updated);

    res.status(200).json({
      shifttypeid: updated.shifttypeid,
      shiftname: updated.shiftname,
      defaultduration: updated.defaultduration,
      shiftcategory: updated.shiftcategory
    });
  } catch (error) {
    console.error('Error in updateShiftType:', error);
    res.status(500).json({
      message: 'Error updating shift type',
      error: error.message
    });
  }
}

async function deleteShiftType(req, res) {
  try {
    const { id } = req.params;
    
    // Validate ID exists
    if (!id) {
      console.error('Delete shift type error: No ID provided');
      return res.status(400).json({
        message: 'Shift type ID is required'
      });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      console.error('Delete shift type error: Invalid UUID format', { id });
      return res.status(400).json({
        message: 'Invalid shift type ID format',
        providedId: id
      });
    }

    console.log('Attempting to delete shift type:', id);
    
    // Find the shift type
    const shiftType = await ShiftType.findByPk(id);
    if (!shiftType) {
      console.error('Delete shift type error: Shift type not found', { id });
      return res.status(404).json({ 
        message: 'Shift type not found',
        id: id
      });
    }

    // Check if shift type is being used
    const associatedShifts = await Shift.count({
      where: { shifttypeid: id }
    });

    if (associatedShifts > 0) {
      console.error('Delete shift type error: Shift type is in use', { id });
      return res.status(400).json({
        message: 'Cannot delete shift type that is being used by shifts'
      });
    }

    // Delete the shift type
    await shiftType.destroy();
    console.log('Shift type deleted successfully:', id);
    
    res.status(200).json({ 
      message: 'Shift type deleted successfully',
      deletedId: id
    });
  } catch (error) {
    console.error('Error in deleteShiftType:', error);
    res.status(500).json({
      message: 'Error deleting shift type',
      error: error.message
    });
  }
}

// Shift Operations
async function getUserShifts(req, res) {
  try {
    const { userId } = req.params;

    // Validate userId is a valid UUID
    if (!userId || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId)) {
      return res.status(400).json({
        message: 'Invalid user ID format'
      });
    }

    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    const shifts = await Shift.findAll({
      where: { userid: userId },
      include: [
        {
          model: ShiftType,
          as: 'shifttype',
          attributes: ['shiftname', 'shiftcategory', 'defaultduration']
        }
      ],
      order: [['shiftstarttime', 'DESC']]
    });

    res.status(200).json(shifts);
  } catch (error) {
    console.error('Error fetching user shifts:', error);
    res.status(500).json({
      message: 'Error fetching user shifts',
      error: error.message
    });
  }
}

async function createShift(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    console.log('Received shift creation request:', req.body);

    // Validate all required fields
    const requiredFields = [
      'shifttypeid', 'userid', 'shiftstarttime', 
      'shiftendtime', 'shiftlocation', 'assignedby'
    ];
    
    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
      console.log('Missing required fields:', missingFields);
      return res.status(400).json({
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Parse and validate dates
    const start = new Date(req.body.shiftstarttime);
    const end = new Date(req.body.shiftendtime);

    // Validate date parsing
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.log('Invalid date format:', {
        start: req.body.shiftstarttime,
        end: req.body.shiftendtime
      });
      return res.status(400).json({
        message: 'Invalid date format. Please use ISO 8601 format (YYYY-MM-DDTHH:mm:ss.SSSZ)'
      });
    }

    // Validate time order
    if (start >= end) {
      return res.status(400).json({
        message: 'End time must be after start time'
      });
    }

    // Calculate duration in minutes
    const duration = Math.round((end - start) / (1000 * 60));

    // Validate users and shift type
    console.log('Validating users and shift type...');
    const [user, assignedBy, shiftType] = await Promise.all([
      User.findByPk(req.body.userid),
      User.findByPk(req.body.assignedby),
      ShiftType.findByPk(req.body.shifttypeid)
    ]);

    console.log('Validation results:', {
      user: user ? 'Found' : 'Not found',
      assignedBy: assignedBy ? 'Found' : 'Not found',
      shiftType: shiftType ? 'Found' : 'Not found'
    });

    if (!user || !assignedBy) {
      return res.status(400).json({ message: 'Invalid user references' });
    }
    if (!shiftType) {
      return res.status(400).json({ message: 'Invalid shift type reference' });
    }

    console.log('Creating shift with data:', {
      shifttypeid: req.body.shifttypeid,
      userid: req.body.userid,
      shiftstarttime: start.toISOString(),
      shiftendtime: end.toISOString(),
      shiftduration: duration,
      shiftlocation: req.body.shiftlocation,
      assignedby: req.body.assignedby
    });

    const shift = await Shift.create({
      shifttypeid: req.body.shifttypeid,
      userid: req.body.userid,
      shiftstarttime: start,
      shiftendtime: end,
      shiftduration: duration,
      shiftlocation: req.body.shiftlocation,
      assignedby: req.body.assignedby
    });

    console.log('Shift created successfully:', shift);

    res.status(201).json({
      ...shift.get({ plain: true }),
      shiftstarttime: shift.shiftstarttime.toISOString(),
      shiftendtime: shift.shiftendtime.toISOString(),
      shifttype: shiftType.get({ plain: true })
    });
  } catch (error) {
    console.error('Detailed error in createShift:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      errors: error.errors
    });
    
    const status = error.name === 'SequelizeValidationError' ? 400 : 500;
    res.status(status).json({
      message: 'Error creating shift',
      error: error.message,
      ...(error.errors && { details: error.errors })
    });
  }
}

async function updateShift(req, res) {
  try {
    const { id } = req.params;
    
    // Validate ID exists
    if (!id) {
      console.error('Update shift error: No ID provided');
      return res.status(400).json({
        message: 'Shift ID is required'
      });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      console.error('Update shift error: Invalid UUID format', { id });
      return res.status(400).json({
        message: 'Invalid shift ID format',
        providedId: id
      });
    }

    console.log('Attempting to update shift:', id);
    
    const shift = await Shift.findByPk(id);
    if (!shift) {
      console.error('Update shift error: Shift not found', { id });
      return res.status(404).json({ 
        message: 'Shift not found',
        id: id
      });
    }

    // Validate users if provided
    if (req.body.userid) {
      const user = await User.findByPk(req.body.userid);
      if (!user) {
        console.error('Update shift error: Invalid user reference', { userid: req.body.userid });
        return res.status(400).json({ message: 'Invalid user reference' });
      }
    }

    if (req.body.assignedby) {
      const assignedBy = await User.findByPk(req.body.assignedby);
      if (!assignedBy) {
        console.error('Update shift error: Invalid assigned by reference', { assignedby: req.body.assignedby });
        return res.status(400).json({ message: 'Invalid assigned by reference' });
      }
    }

    // Calculate duration if times are updated
    let duration = shift.shiftduration;
    if (req.body.shiftstarttime || req.body.shiftendtime) {
      const start = req.body.shiftstarttime ? new Date(req.body.shiftstarttime) : shift.shiftstarttime;
      const end = req.body.shiftendtime ? new Date(req.body.shiftendtime) : shift.shiftendtime;
      
      // Validate date parsing
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        console.error('Update shift error: Invalid date format', {
          start: req.body.shiftstarttime,
          end: req.body.shiftendtime
        });
        return res.status(400).json({
          message: 'Invalid date format. Please use ISO 8601 format (YYYY-MM-DDTHH:mm:ss.SSSZ)'
        });
      }

      duration = Math.round((end - start) / (1000 * 60));
      
      if (duration <= 0) {
        console.error('Update shift error: Invalid duration', { duration });
        return res.status(400).json({
          message: 'End time must be after start time'
        });
      }
    }

    const updateData = {
      shifttypeid: req.body.shifttypeid || shift.shifttypeid,
      userid: req.body.userid || shift.userid,
      shiftstarttime: req.body.shiftstarttime ? new Date(req.body.shiftstarttime) : shift.shiftstarttime,
      shiftendtime: req.body.shiftendtime ? new Date(req.body.shiftendtime) : shift.shiftendtime,
      shiftduration: duration,
      shiftlocation: req.body.shiftlocation || shift.shiftlocation,
      assignedby: req.body.assignedby || shift.assignedby
    };

    console.log('Updating shift with data:', updateData);

    const updated = await shift.update(updateData);
    console.log('Shift updated successfully:', updated);

    res.status(200).json({
      shiftid: updated.shiftid,
      ...updated.get({ plain: true }),
      shiftstarttime: updated.shiftstarttime.toISOString(),
      shiftendtime: updated.shiftendtime.toISOString()
    });
  } catch (error) {
    console.error('Error in updateShift:', error);
    const status = error.name === 'SequelizeValidationError' ? 400 : 500;
    res.status(status).json({
      message: 'Error updating shift',
      error: error.message,
      ...(error.errors && { details: error.errors })
    });
  }
}

async function deleteShift(req, res) {
  const { id } = req.params;
  
  // Validate ID
  if (!id) {
    console.error('Delete shift error: No ID provided');
    return res.status(400).json({ message: 'Shift ID is required' });
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    console.error('Delete shift error: Invalid UUID format', { id });
    return res.status(400).json({ message: 'Invalid shift ID format' });
  }

  try {
    console.log('Attempting to delete shift:', id);
    
    // Find the shift first
    const shift = await Shift.findByPk(id);
    if (!shift) {
      console.error('Delete shift error: Shift not found', { id });
      return res.status(404).json({ message: 'Shift not found' });
    }

    // Start a transaction to ensure data consistency
    const result = await sequelize.transaction(async (t) => {
      // Delete associated swap requests first
      await ShiftSwapRequest.destroy({
        where: {
          [Op.or]: [
            { requested_shift_id: id },
            { colleague_shift_id: id }
          ]
        },
        transaction: t
      });

      // Then delete the shift
      await shift.destroy({ transaction: t });
    });

    console.log('Shift and associated swap requests deleted successfully:', id);
    
    res.status(200).json({ 
      message: 'Shift and associated swap requests deleted successfully',
      deletedId: id
    });
  } catch (error) {
    console.error('Error in deleteShift:', error);
    res.status(500).json({
      message: 'Error deleting shift',
      error: error.message
    });
  }
}

module.exports = {
  // Shift Type
  getAllShiftTypes,
  createShiftType,
  updateShiftType,
  deleteShiftType,
  
  // Shifts
  getUserShifts,
  createShift,
  updateShift,
  deleteShift
};