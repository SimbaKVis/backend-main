const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./userModel');

const ShiftType = sequelize.define('shifttype', {
  shifttypeid: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  shiftname: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  defaultduration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  shiftcategory: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  createddate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updateddate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'shifttype',
  timestamps: false,
  hooks: {
    beforeUpdate: (shifttype) => {
      shifttype.updateddate = new Date();
    }
  }
});

const Shift = sequelize.define('shift', {
  shiftid: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  shifttypeid: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: ShiftType,
      key: 'shifttypeid'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  userid: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'userid'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  shiftstarttime: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  shiftendtime: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isAfter(value) {
        if (value <= this.shiftstarttime) {
          throw new Error('Shift end time must be after shift start time');
        }
      }
    }
  },
  shiftduration: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  shiftlocation: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  assignedby: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'userid'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  createddate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updateddate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'shift',
  timestamps: false,
  hooks: {
    beforeValidate: (shift) => {
      if (shift.shiftstarttime && shift.shiftendtime) {
        shift.shiftduration = Math.round(
          (new Date(shift.shiftendtime) - new Date(shift.shiftstarttime)) / (1000 * 60)
        );
      }

      if (!shift.shiftduration || shift.shiftduration <= 0) {
        throw new Error('Shift duration must be a positive number.');
      }
    },
    beforeUpdate: (shift) => {
      shift.updateddate = new Date();
      if (shift.changed('shiftendtime') || shift.changed('shiftstarttime')) {
        shift.shiftduration = Math.round(
          (new Date(shift.shiftendtime) - new Date(shift.shiftstarttime)) / (1000 * 60)
        );
      }
    }
  }
});

// Defining Associations
ShiftType.hasMany(Shift, {
  foreignKey: 'shifttypeid',
  as: 'shifts'
});

Shift.belongsTo(ShiftType, {
  foreignKey: 'shifttypeid',
  as: 'shifttype'
});

User.hasMany(Shift, {
  foreignKey: 'userid',
  as: 'shifts'
});

Shift.belongsTo(User, {
  foreignKey: 'userid',
  as: 'user'
});

User.hasMany(Shift, {
  foreignKey: 'assignedby',
  as: 'assignedShifts'
});

Shift.belongsTo(User, {
  foreignKey: 'assignedby',
  as: 'assignedByUser'
});

module.exports = { ShiftType, Shift };
