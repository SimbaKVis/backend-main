const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./userModel');
const { Shift } = require('./shiftmanagementModels');

const ShiftSwapRequest = sequelize.define('shift_swap_request', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    requesting_user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: User,
            key: 'userid'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
    requested_shift_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: Shift,
            key: 'shiftid'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
    colleague_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: User,
            key: 'userid'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
    colleague_shift_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: Shift,
            key: 'shiftid'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
    reason: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
        defaultValue: 'Pending',
        allowNull: false
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false
    }
}, {
    tableName: 'shift_swap_requests',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Define associations
ShiftSwapRequest.belongsTo(User, {
    foreignKey: 'requesting_user_id',
    as: 'requestingUser'
});

ShiftSwapRequest.belongsTo(User, {
    foreignKey: 'colleague_id',
    as: 'colleague'
});

ShiftSwapRequest.belongsTo(Shift, {
    foreignKey: 'requested_shift_id',
    as: 'requestedShift'
});

ShiftSwapRequest.belongsTo(Shift, {
    foreignKey: 'colleague_shift_id',
    as: 'colleagueShift'
});

// Model methods
const createShiftSwapRequest = async (requestingUserId, requestedShiftId, colleagueId, colleagueShiftId, reason, status = 'Pending') => {
    return await ShiftSwapRequest.create({
        requesting_user_id: requestingUserId,
        requested_shift_id: requestedShiftId,
        colleague_id: colleagueId,
        colleague_shift_id: colleagueShiftId,
        reason,
        status
    });
};

const getAllRequests = async () => {
    return await ShiftSwapRequest.findAll({
        include: [
            {
                model: User,
                as: 'requestingUser',
                attributes: ['firstname', 'lastname', 'emailaddress']
            },
            {
                model: User,
                as: 'colleague',
                attributes: ['firstname', 'lastname', 'emailaddress']
            },
            {
                model: Shift,
                as: 'requestedShift',
                attributes: ['shiftstarttime', 'shiftendtime', 'shiftlocation']
            },
            {
                model: Shift,
                as: 'colleagueShift',
                attributes: ['shiftstarttime', 'shiftendtime', 'shiftlocation']
            }
        ],
        order: [['created_at', 'DESC']]
    });
};

const getUserRequests = async (userId) => {
    return await ShiftSwapRequest.findAll({
        where: {
            [Sequelize.Op.or]: [
                { requesting_user_id: userId },
                { colleague_id: userId }
            ]
        },
        include: [
            {
                model: User,
                as: 'requestingUser',
                attributes: ['firstname', 'lastname', 'emailaddress']
            },
            {
                model: User,
                as: 'colleague',
                attributes: ['firstname', 'lastname', 'emailaddress']
            },
            {
                model: Shift,
                as: 'requestedShift',
                attributes: ['shiftstarttime', 'shiftendtime', 'shiftlocation']
            },
            {
                model: Shift,
                as: 'colleagueShift',
                attributes: ['shiftstarttime', 'shiftendtime', 'shiftlocation']
            }
        ],
        order: [['created_at', 'DESC']]
    });
};

const updateRequestStatus = async (id, status) => {
    const request = await ShiftSwapRequest.findByPk(id, {
        include: [
            {
                model: Shift,
                as: 'requestedShift'
            },
            {
                model: Shift,
                as: 'colleagueShift'
            }
        ]
    });
    
    if (!request) return null;

    // Start a transaction to ensure data consistency
    const t = await sequelize.transaction();

    try {
        // Update the request status
        await request.update({ status }, { transaction: t });

        // If the request is approved, swap the shifts
        if (status === 'Approved') {
            // Get the current user IDs
            const requestingUserId = request.requestedShift.userid;
            const colleagueUserId = request.colleagueShift.userid;

            // Swap the user IDs
            await request.requestedShift.update(
                { userid: colleagueUserId },
                { transaction: t }
            );
            await request.colleagueShift.update(
                { userid: requestingUserId },
                { transaction: t }
            );
        }

        // Commit the transaction
        await t.commit();

        // Return the updated request with all associations
        return await ShiftSwapRequest.findByPk(id, {
            include: [
                {
                    model: User,
                    as: 'requestingUser',
                    attributes: ['firstname', 'lastname', 'emailaddress']
                },
                {
                    model: User,
                    as: 'colleague',
                    attributes: ['firstname', 'lastname', 'emailaddress']
                },
                {
                    model: Shift,
                    as: 'requestedShift',
                    attributes: ['shiftstarttime', 'shiftendtime', 'shiftlocation']
                },
                {
                    model: Shift,
                    as: 'colleagueShift',
                    attributes: ['shiftstarttime', 'shiftendtime', 'shiftlocation']
                }
            ]
        });
    } catch (error) {
        // Rollback the transaction if there's an error
        await t.rollback();
        throw error;
    }
};

const deleteRequest = async (id) => {
    const request = await ShiftSwapRequest.findByPk(id);
    if (!request) return null;

    await request.destroy();
    return request;
};

module.exports = {
    ShiftSwapRequest,
    createShiftSwapRequest,
    getAllRequests,
    getUserRequests,
    updateRequestStatus,
    deleteRequest
};