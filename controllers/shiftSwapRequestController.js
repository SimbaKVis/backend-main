const { Shift } = require('../models/shiftmanagementModels');
const User = require('../models/userModel');
const { createShiftSwapRequest, getAllRequests, updateRequestStatus, getUserRequests } = require('../models/shiftSwapRequest');

// Get all shift swap requests
const getShiftSwapRequests = async (req, res) => {
    try {
        const requests = await getAllRequests();
        res.status(200).json(requests);
    } catch (error) {
        console.error('Error fetching shift swap requests:', error);
        res.status(500).json({ 
            message: 'Error fetching shift swap requests', 
            error: error.message 
        });
    }
};

// Get all shift swap requests for a specific user
const getUserShiftSwapRequests = async (req, res) => {
    const { userId } = req.params;

    try {
        const requests = await getUserRequests(userId);
        
        if (!requests) {
            return res.status(404).json({
                message: 'No shift swap requests found for this user'
            });
        }

        res.status(200).json(requests);
    } catch (error) {
        console.error('Error fetching user shift swap requests:', error);
        res.status(500).json({ 
            message: 'Error fetching user shift swap requests', 
            error: error.message 
        });
    }
};

// Create a new shift swap request
const createNewShiftSwapRequest = async (req, res) => {
    const {
        requestingUserId,
        requestedShiftId,
        colleagueId,
        colleagueShiftId,
        reason,
        status
    } = req.body;

    try {
        // Validate all required fields
        if (!requestingUserId || !requestedShiftId || !colleagueId || !colleagueShiftId || !reason) {
            return res.status(400).json({
                message: 'Missing required fields',
                required: ['requestingUserId', 'requestedShiftId', 'colleagueId', 'colleagueShiftId', 'reason']
            });
        }

        // Validate that both shifts exist
        const [requestedShift, colleagueShift] = await Promise.all([
            Shift.findByPk(requestedShiftId),
            Shift.findByPk(colleagueShiftId)
        ]);

        if (!requestedShift || !colleagueShift) {
            return res.status(404).json({
                message: 'One or both shifts not found',
                requestedShift: !!requestedShift,
                colleagueShift: !!colleagueShift
            });
        }

        // Validate that the shifts belong to the correct users
        if (requestedShift.userid !== requestingUserId) {
            return res.status(403).json({
                message: 'Requested shift does not belong to the requesting user'
            });
        }

        if (colleagueShift.userid !== colleagueId) {
            return res.status(403).json({
                message: 'Colleague shift does not belong to the selected colleague'
            });
        }

        // Create the shift swap request
        const request = await createShiftSwapRequest(
            requestingUserId,
            requestedShiftId,
            colleagueId,
            colleagueShiftId,
            reason,
            status || 'Pending'
        );

        res.status(201).json(request);
    } catch (error) {
        console.error('Error creating shift swap request:', error);
        res.status(500).json({ 
            message: 'Error creating shift swap request', 
            error: error.message 
        });
    }
};

// Update a shift swap request status
const updateShiftSwapRequest = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        if (!status) {
            return res.status(400).json({
                message: 'Status is required'
            });
        }

        if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({
                message: 'Invalid status. Must be one of: Pending, Approved, Rejected'
            });
        }

        const updatedRequest = await updateRequestStatus(id, status);
        
        if (!updatedRequest) {
            return res.status(404).json({
                message: 'Shift swap request not found'
            });
        }

        // Format the response to match frontend expectations
        const response = {
            id: updatedRequest.id,
            requestingUserId: updatedRequest.requesting_user_id,
            requestedShiftId: updatedRequest.requested_shift_id,
            colleagueId: updatedRequest.colleague_id,
            colleagueShiftId: updatedRequest.colleague_shift_id,
            reason: updatedRequest.reason,
            status: updatedRequest.status,
            createdAt: updatedRequest.created_at,
            updatedAt: updatedRequest.updated_at,
            requestingUser: updatedRequest.requestingUser,
            colleague: updatedRequest.colleague,
            requestedShift: updatedRequest.requestedShift,
            colleagueShift: updatedRequest.colleagueShift
        };

        res.status(200).json(response);
    } catch (error) {
        console.error('Error updating shift swap request:', error);
        res.status(500).json({ 
            message: 'Error updating shift swap request', 
            error: error.message 
        });
    }
};

module.exports = {
    getShiftSwapRequests,
    createNewShiftSwapRequest,
    updateShiftSwapRequest,
    getUserShiftSwapRequests
};
