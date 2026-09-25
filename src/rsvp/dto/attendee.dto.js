'use strict';

const { ApiProperty } = require('@nestjs/swagger');

/**
 * Public projection of a User that has RSVP'd to an event.
 * Never includes passwordHash or any other sensitive field.
 */
class AttendeeDto {
  @ApiProperty({
    type: 'string',
    format: 'uuid',
    description: 'Unique identifier of the attending user.',
    example: 'b92e8a3f-1c4d-4e5f-a6b7-c8d9e0f1a2b3',
  })
  id;

  @ApiProperty({
    type: 'string',
    description: 'Display name of the attending user.',
    example: 'Ada Lovelace',
  })
  name;

  @ApiProperty({
    type: 'string',
    format: 'email',
    description: 'Email address of the attending user.',
    example: 'ada@example.com',
  })
  email;
}

/**
 * Response shape for `GET /events/:id/attendees`.
 * Provides both the list and aggregate counts so the client doesn't have to
 * compute them itself.
 */
class AttendeesResponseDto {
  @ApiProperty({
    type: AttendeeDto,
    isArray: true,
    description: 'List of attendees who have RSVP\'d to this event.',
    example: [
      { id: 'b92e8a3f-1c4d-4e5f-a6b7-c8d9e0f1a2b3', name: 'Ada Lovelace', email: 'ada@example.com' },
      { id: 'c83f9b2e-2d5e-6f7a-b8c9-d0e1f2a3b4c5', name: 'Alan Turing', email: 'alan@example.com' },
    ],
  })
  items;

  @ApiProperty({
    type: 'integer',
    description: 'Total number of confirmed attendees for this event.',
    example: 42,
  })
  count;

  @ApiProperty({
    type: 'integer',
    description: 'Maximum capacity of the event (as set when it was created).',
    example: 50,
  })
  capacity;
}

module.exports = { AttendeeDto, AttendeesResponseDto };
