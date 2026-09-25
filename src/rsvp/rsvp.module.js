'use strict';

const { Module } = require('@nestjs/common');
const { RsvpService } = require('./rsvp.service');
const { RsvpController } = require('./rsvp.controller');

/**
 * RsvpModule is re-exported through EventsModule's controller list so the RSVP
 * routes live under the `/events/:id` prefix. The module exists primarily so
 * the service can be unit-tested in isolation.
 */
@Module({
  controllers: [RsvpController],
  providers: [RsvpService],
  exports: [RsvpService],
})
class RsvpModule {}

module.exports = { RsvpModule };
