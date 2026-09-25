'use strict';

const { ApiProperty } = require('@nestjs/swagger');
const { Type } = require('class-transformer');
const {
  IsDate,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  Validate,
} = require('class-validator');

const { EndAfterStartRule } = require('./create-event.dto');

/**
 * Payload accepted by `PATCH /events/:id`.
 * All fields are optional; omitted fields are left untouched.
 */
class UpdateEventDto {
  @ApiProperty({
    type: 'string',
    required: false,
    minLength: 3,
    maxLength: 200,
    description: 'Updated title for the event (3–200 characters). Omit to keep the current value.',
    example: 'NestJS Workshop: Advanced Patterns',
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title;

  @ApiProperty({
    type: 'string',
    required: false,
    maxLength: 5000,
    description: 'Updated description of the event. Omit to keep the current value.',
    example: 'Updated agenda: now includes live coding and Q&A sessions.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description;

  @ApiProperty({
    type: 'string',
    required: false,
    minLength: 2,
    maxLength: 255,
    description: 'Updated location. Omit to keep the current value.',
    example: 'Room 3B, Tech Hub',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  location;

  @ApiProperty({
    type: 'string',
    required: false,
    format: 'date-time',
    description: 'Updated start time in ISO 8601 format. Must precede endDate. Omit to keep the current value.',
    example: '2025-07-01T10:00:00.000Z',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'startDate must be a valid ISO 8601 date' })
  startDate;

  @ApiProperty({
    type: 'string',
    required: false,
    format: 'date-time',
    description: 'Updated end time in ISO 8601 format. Must be strictly after startDate. Omit to keep the current value.',
    example: '2025-07-01T18:00:00.000Z',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'endDate must be a valid ISO 8601 date' })
  @Validate(EndAfterStartRule)
  endDate;

  @ApiProperty({
    type: 'integer',
    required: false,
    minimum: 1,
    description: 'Updated capacity. Must be at least 1 and cannot be less than the current number of RSVPs. Omit to keep the current value.',
    example: 75,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'capacity must be an integer' })
  @Min(1, { message: 'capacity must be a positive integer' })
  capacity;
}

module.exports = { UpdateEventDto };
