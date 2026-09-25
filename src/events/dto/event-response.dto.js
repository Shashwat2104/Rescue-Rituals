'use strict';

const { ApiProperty } = require('@nestjs/swagger');

/**
 * Shape of an event returned by the API. Includes the live attendee count so
 * clients don't need a second request.
 */
class EventResponseDto {
  @ApiProperty({
    type: 'string',
    format: 'uuid',
    description: 'Unique identifier for this event.',
    example: 'a1b2c3d4-5678-90ab-cdef-1234567890ab',
  })
  id;

  @ApiProperty({
    type: 'string',
    description: 'Title of the event.',
    example: 'NestJS Workshop: Building Scalable APIs',
  })
  title;

  @ApiProperty({
    type: 'string',
    required: false,
    nullable: true,
    description: 'Optional detailed description of the event. Null when no description was provided.',
    example: 'A hands-on workshop covering NestJS fundamentals and Swagger.',
  })
  description;

  @ApiProperty({
    type: 'string',
    description: 'Where the event takes place (physical address or video link).',
    example: 'Conference Hall A, Tech Campus',
  })
  location;

  @ApiProperty({
    type: 'string',
    format: 'date-time',
    description: 'Scheduled start time in ISO 8601 format.',
    example: '2025-06-15T09:00:00.000Z',
  })
  startDate;

  @ApiProperty({
    type: 'string',
    format: 'date-time',
    description: 'Scheduled end time in ISO 8601 format.',
    example: '2025-06-15T17:00:00.000Z',
  })
  endDate;

  @ApiProperty({
    type: 'integer',
    minimum: 1,
    description: 'Maximum number of attendees permitted to RSVP.',
    example: 50,
  })
  capacity;

  @ApiProperty({
    type: 'string',
    format: 'uuid',
    description: 'UUID of the user who created this event (the organiser).',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  createdById;

  @ApiProperty({
    type: 'string',
    format: 'date-time',
    description: 'When this event record was first created.',
    example: '2025-05-01T08:30:00.000Z',
  })
  createdAt;

  @ApiProperty({
    type: 'string',
    format: 'date-time',
    description: 'When this event record was last updated.',
    example: '2025-05-10T14:22:00.000Z',
  })
  updatedAt;

  @ApiProperty({
    type: 'integer',
    description: 'Current count of confirmed attendees (RSVPs) for this event.',
    example: 12,
  })
  attendeeCount;
}

module.exports = { EventResponseDto };
