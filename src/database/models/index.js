'use strict';

/**
 * Model registry.
 *
 * Exposes `registerModels(sequelize)` which:
 *  1) initializes all Sequelize models on the provided connection,
 *  2) wires their associations,
 *  3) returns a frozen registry the rest of the application can consume.
 *
 * Centralising the wiring here keeps individual model files free of cross-model
 * imports and avoids circular dependency issues.
 */
const { initUser, User } = require('./user.model');
const { initEvent, Event } = require('./event.model');
const { initRsvp, Rsvp } = require('./rsvp.model');

function registerModels(sequelize) {
  const userModel = initUser(sequelize);
  const eventModel = initEvent(sequelize);
  const rsvpModel = initRsvp(sequelize);

  // --- Associations -----------------------------------------------------
  // User 1 ─── * Event (events created by the user)
  userModel.hasMany(eventModel, {
    foreignKey: 'createdBy',
    as: 'events',
    onDelete: 'CASCADE',
  });
  eventModel.belongsTo(userModel, {
    foreignKey: 'createdBy',
    as: 'createdByUser',
  });

  // User 1 ─── * RSVP
  userModel.hasMany(rsvpModel, {
    foreignKey: 'userId',
    as: 'rsvps',
    onDelete: 'CASCADE',
  });
  rsvpModel.belongsTo(userModel, {
    foreignKey: 'userId',
    as: 'user',
  });

  // Event 1 ─── * RSVP
  eventModel.hasMany(rsvpModel, {
    foreignKey: 'eventId',
    as: 'rsvps',
    onDelete: 'CASCADE',
  });
  rsvpModel.belongsTo(eventModel, {
    foreignKey: 'eventId',
    as: 'event',
  });

  return Object.freeze({
    User: userModel,
    Event: eventModel,
    Rsvp: rsvpModel,
  });
}

module.exports = { registerModels, User, Event, Rsvp };
