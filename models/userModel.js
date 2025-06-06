const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  userid: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  firstname: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lastname: {
    type: DataTypes.STRING,
    allowNull: false
  },
  emailaddress: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  role: {
    type: DataTypes.ENUM('Admin', 'Agent'),
    allowNull: false
  },
  passwordhash: {  // Keep passwordhash field
    type: DataTypes.TEXT,
    allowNull: false
  },
  eligibleshifts: {
    type: DataTypes.TEXT,
    allowNull: true  // Add new field
  },
  createddate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updateddate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'createddate',
  updatedAt: 'updateddate',

  hooks: {  // Keep bcrypt hooks
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.passwordhash = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.passwordhash = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

module.exports = User;