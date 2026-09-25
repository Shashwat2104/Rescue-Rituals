'use strict';

const { DataTypes, Model } = require('sequelize');

/**
 * User model.
 *
 * Database constraints:
 * - id is a UUID primary key.
 * - email is UNIQUE at the database level (also enforced by an explicit index).
 * - name / email / passwordHash are NOT NULL.
 *
 * The `passwordHash` field is sensitive; services must never include it in API responses.
 */
class User extends Model {}

function initUser(sequelize) {
  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(120),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      passwordHash: {
        type: DataTypes.STRING(255),
        allowNull: false,
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
      modelName: 'User',
      tableName: 'users',
      timestamps: true,
      updatedAt: false,
      indexes: [
        {
          unique: true,
          fields: ['email'],
          name: 'users_email_unique',
        },
      ],
    },
  );
  return User;
}

module.exports = { User, initUser };
