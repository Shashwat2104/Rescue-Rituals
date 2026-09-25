'use strict';

const { Module } = require('@nestjs/common');

const { EventsController } = require('./events.controller');
const { EventsService } = require('./events.service');

const { RsvpController } = require('../rsvp/rsvp.controller');
const { RsvpService } = require('../rsvp/rsvp.service');

/**
 * EventsModule bundles event CRUD plus RSVP / attendee routes, since the
 * RSVP endpoints are sub-resources of `/events/:id`.
 *
 * The Sequelize + model providers come from the global DatabaseModule, so
 * this module only declares feature-level providers.
 */
@Module({
  controllers: [EventsController, RsvpController],
  providers: [EventsService, RsvpService],
  exports: [EventsService],
})
class EventsModule {}

module.exports = { EventsModule };
