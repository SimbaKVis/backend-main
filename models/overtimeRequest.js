const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./userModel');
const { Shift } = require('./shiftmanagementModels');

const OvertimeRequest = sequelize.define('OvertimeRequest', {
  requestid: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userid: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'userid'
    }
  },
  shiftid: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'shifts',
      key: 'shiftid'
    }
  },
  overtimeduration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Duration in minutes'
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending',
    allowNull: false
  }
}, {
  tableName: 'overtime_requests',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Define associations
OvertimeRequest.belongsTo(User, {
  foreignKey: 'userid',
  as: 'user'
});

OvertimeRequest.belongsTo(Shift, {
  foreignKey: 'shiftid',
  as: 'shift'
});

module.exports = OvertimeRequest; 