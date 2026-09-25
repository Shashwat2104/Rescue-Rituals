'use strict';

/**
 * Migration: create the `events` table.
 *
 * Columns:
 * - id           UUID PRIMARY KEY
 * - title        VARCHAR(200) NOT NULL
 * - description  TEXT NULL
 * - location     VARCHAR(255) NOT NULL
 * - start_date   TIMESTAMPTZ  NOT NULL
 * - end_date     TIMESTAMPTZ  NOT NULL
 * - capacity     INTEGER      NOT NULL CHECK (capacity > 0)
 * - created_by   UUID NOT NULL → users.id ON DELETE CASCADE
 * - created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
 * - updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
 *
 * Indexes:
 * - events_start_date_idx
 * - events_created_by_idx
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'events',
      {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        title: {
          type: Sequelize.STRING(200),
          allowNull: false,
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        location: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        start_date: {
          type: Sequelize.DATE,
          allowNull: false,
        },
        end_date: {
          type: Sequelize.DATE,
          allowNull: false,
        },
        capacity: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        created_by: {
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
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
        },
      },
      {
        // Postgres CHECK constraint: capacity must be a positive integer.
        // (Sequelize also validates this at the application level.)
      },
    );

    await queryInterface.sequelize.query(
      'ALTER TABLE events ADD CONSTRAINT events_capacity_positive CHECK (capacity > 0)',
    );

    await queryInterface.addIndex('events', ['start_date'], {
      name: 'events_start_date_idx',
    });

    await queryInterface.addIndex('events', ['created_by'], {
      name: 'events_created_by_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('events');
  },
};
