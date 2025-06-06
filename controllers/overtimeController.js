const OvertimeRequest = require('../models/overtimeRequest');
const { Shift } = require('../models/shiftmanagementModels');
const { ShiftType } = require('../models/shiftmanagementModels');
const User = require('../models/userModel');
const { Op } = require('sequelize');
const { validationResult } = require('express-validator');

// Get all overtime requests (admin only)
async function getAllOvertimeRequests(req, res) {
  try {
    const requests = await OvertimeRequest.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['firstname', 'lastname', 'emailaddress']
        },
        {
          model: Shift,
          as: 'shift',
          include: [{
            model: ShiftType,
            as: 'shifttype',
            attributes: ['shiftname', 'shiftcategory']
          }]
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.status(200).json(requests);
  } catch (error) {
    console.error('Error fetching overtime requests:', error);
    res.status(500).json({
      message: 'Error fetching overtime requests',
      error: error.message
    });
  }
}

// Get overtime requests for a specific user
async function getUserOvertimeRequests(req, res) {
  try {
    const { userId } = req.params;
    
    // Validate userId is a valid UUID
    if (!userId || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId)) {
      return res.status(400).json({
        message: 'Invalid user ID format'
      });
    }
    
    const requests = await OvertimeRequest.findAll({
      where: { userid: userId },
      include: [
        {
          model: Shift,
          as: 'shift',
          include: [{
            model: ShiftType,
            as: 'shifttype',
            attributes: ['shiftname', 'shiftcategory']
          }]
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.status(200).json(requests);
  } catch (error) {
    console.error('Error fetching user overtime requests:', error);
    res.status(500).json({
      message: 'Error fetching user overtime requests',
      error: error.message
    });
  }
}

// Create a new overtime request
async function createOvertimeRequest(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { userid, shiftid } = req.body;

    // Validate shift exists and is overtime category
    const shift = await Shift.findOne({
      where: { shiftid },
      include: [{
        model: ShiftType,
        as: 'shifttype',
        where: { shiftcategory: 'Overtime' }
      }]
    });

    if (!shift) {
      return res.status(400).json({
        message: 'Shift not found or not eligible for overtime'
      });
    }

    // Calculate overtime duration in minutes
    const startTime = new Date(shift.shiftstarttime);
    const endTime = new Date(shift.shiftendtime);
    const overtimeduration = Math.round((endTime - startTime) / (1000 * 60));

    // Create overtime request
    const request = await OvertimeRequest.create({
      userid,
      shiftid,
      overtimeduration,
      status: 'pending'
    });

    res.status(201).json(request);
  } catch (error) {
    console.error('Error creating overtime request:', error);
    res.status(500).json({
      message: 'Error creating overtime request',
      error: error.message
    });
  }
}

// Update overtime request status (admin only)
async function updateOvertimeRequestStatus(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { requestid } = req.params;
    const { status } = req.body;

    // Validate status
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        message: 'Invalid status. Must be either "approved" or "rejected"'
      });
    }

    const request = await OvertimeRequest.findByPk(requestid);
    if (!request) {
      return res.status(404).json({
        message: 'Overtime request not found'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        message: 'Cannot update status of non-pending request'
      });
    }

    await request.update({ status });

    res.status(200).json(request);
  } catch (error) {
    console.error('Error updating overtime request status:', error);
    res.status(500).json({
      message: 'Error updating overtime request status',
      error: error.message
    });
  }
}

// Delete overtime request
async function deleteOvertimeRequest(req, res) {
  try {
    const { requestid } = req.params;

    const request = await OvertimeRequest.findByPk(requestid);
    if (!request) {
      return res.status(404).json({
        message: 'Overtime request not found'
      });
    }

    await request.destroy();

    res.status(200).json({
      message: 'Overtime request deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting overtime request:', error);
    res.status(500).json({
      message: 'Error deleting overtime request',
      error: error.message
    });
  }
}

module.exports = {
  getAllOvertimeRequests,
  getUserOvertimeRequests,
  createOvertimeRequest,
  updateOvertimeRequestStatus,
  deleteOvertimeRequest
};