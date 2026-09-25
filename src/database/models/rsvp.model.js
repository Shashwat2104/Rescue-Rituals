'use strict';

const { DataTypes, Model } = require('sequelize');

/**
 * RSVP model.
 *
 * Database constraints:
 * - id is a UUID primary key.
 * - eventId is a FK to events.id (NOT NULL, ON DELETE CASCADE).
 * - userId  is a FK to users.id  (NOT NULL, ON DELETE CASCADE).
 * - (eventId, userId) is UNIQUE — a user can RSVP to the same event at most once.
 *
 * The unique constraint is the final guard against duplicate RSVPs even under
 * concurrent requests. Application code additionally pre-checks capacity.
 */
class Rsvp extends Model {}

function initRsvp(sequelize) {
  Rsvp.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      eventId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'event_id',
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'user_id',
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'created_at',
      },
    },
    {
      sequelize,
      modelName: 'Rsvp',
      tableName: 'rsvps',
      timestamps: true,
      updatedAt: false,
      indexes: [
        {
          unique: true,
          fields: ['event_id', 'user_id'],
          name: 'rsvps_event_user_unique',
        },
        {
          fields: ['event_id'],
          name: 'rsvps_event_id_idx',
        },
        {
          fields: ['user_id'],
          name: 'rsvps_user_id_idx',
        },
      ],
    },
  );
  return Rsvp;
}

module.exports = { Rsvp, initRsvp };
