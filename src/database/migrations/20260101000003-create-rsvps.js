'use strict';

/**
 * Migration: create the `rsvps` table.
 *
 * Columns:
 * - id          UUID PRIMARY KEY
 * - event_id    UUID NOT NULL → events.id ON DELETE CASCADE
 * - user_id     UUID NOT NULL → users.id  ON DELETE CASCADE
 * - created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
 *
 * Constraints:
 * - UNIQUE(event_id, user_id) — a user can RSVP at most once per event.
 *
 * Indexes:
 * - rsvps_event_user_unique  (UNIQUE(event_id, user_id))
 * - rsvps_event_id_idx
 * - rsvps_user_id_idx
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('rsvps', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      event_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'events',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    await queryInterface.addIndex('rsvps', ['event_id', 'user_id'], {
      unique: true,
      name: 'rsvps_event_user_unique',
    });

    await queryInterface.addIndex('rsvps', ['event_id'], {
      name: 'rsvps_event_id_idx',
    });

    await queryInterface.addIndex('rsvps', ['user_id'], {
      name: 'rsvps_user_id_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('rsvps');
  },
};
