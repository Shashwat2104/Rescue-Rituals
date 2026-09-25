'use strict';

const { DataTypes, Model } = require('sequelize');

/**
 * Event model.
 *
 * Database constraints:
 * - id is a UUID primary key.
 * - createdBy is a FK to users.id (NOT NULL).
 * - title / location / startDate / endDate / capacity / createdBy / created_at / updated_at are NOT NULL.
 * - description is nullable.
 * - capacity must be a positive integer (validated both at app and DB layer).
 *
 * The `created_by` FK uses ON DELETE CASCADE so removing a user removes their events.
 */
class Event extends Model {}

function initEvent(sequelize) {
  Event.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'title cannot be empty' },
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      location: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'location cannot be empty' },
        },
      },
      startDate: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'start_date',
      },
      endDate: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'end_date',
      },
      capacity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          isInt: { msg: 'capacity must be an integer' },
          min: { args: [1], msg: 'capacity must be a positive integer' },
        },
      },
      createdBy: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'created_by',
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'created_at',
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'updated_at',
      },
    },
    {
      sequelize,
      modelName: 'Event',
      tableName: 'events',
      timestamps: true,
      indexes: [
        {
          fields: ['start_date'],
          name: 'events_start_date_idx',
        },
        {
          fields: ['created_by'],
          name: 'events_created_by_idx',
        },
      ],
    },
  );
  return Event;
}

module.exports = { Event, initEvent };
