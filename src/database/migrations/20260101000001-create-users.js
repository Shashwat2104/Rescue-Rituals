'use strict';

/**
 * Migration: create the `users` table.
 *
 * Columns:
 * - id            UUID PRIMARY KEY (default uuid_generate_v4)
 * - name          VARCHAR(120) NOT NULL
 * - email         VARCHAR(255) NOT NULL
 * - password_hash VARCHAR(255) NOT NULL
 * - created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
 *
 * Constraints:
 * - UNIQUE(email) enforced both via UNIQUE column constraint and an explicit
 *   index for query plans.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(120),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      password_hash: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    await queryInterface.addIndex('users', ['email'], {
      unique: true,
      name: 'users_email_unique',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('users');
  },
};
