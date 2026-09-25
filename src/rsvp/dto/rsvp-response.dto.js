'use strict';

const { ApiProperty } = require('@nestjs/swagger');

/**
 * Response returned when a user successfully RSVP'd to an event.
 * Returned with HTTP 201 Created.
 */
class RsvpResponseDto {
  @ApiProperty({
    type: 'string',
    format: 'uuid',
    description: 'Unique identifier of the RSVP record.',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  id;

  @ApiProperty({
    type: 'string',
    format: 'uuid',
    description: 'UUID of the event the user has RSVP\'d to.',
    example: 'a1b2c3d4-5678-90ab-cdef-1234567890ab',
  })
  eventId;

  @ApiProperty({
    type: 'string',
    format: 'uuid',
    description: 'UUID of the user who RSVP\'d.',
    example: 'b2c3d4e5-6789-0abc-def1-2345678901bc',
  })
  userId;

  @ApiProperty({
    type: 'string',
    format: 'date-time',
    description: 'ISO 8601 timestamp when the RSVP was created.',
    example: '2026-09-26T10:30:00.000Z',
  })
  createdAt;
}

module.exports = { RsvpResponseDto };
