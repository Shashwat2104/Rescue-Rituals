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
  ValidatorConstraint,
} = require('class-validator');

/**
 * Custom class-validator rule: endDate must be strictly later than startDate.
 * If either side is missing, we defer to `@IsDate` so we don't double-report.
 */
@ValidatorConstraint({ name: 'EndAfterStart', async: false })
class EndAfterStartRule {
  validate(endDate, args) {
    const object = args.object;
    if (!endDate || !object.startDate) return true;
    return new Date(endDate).getTime() > new Date(object.startDate).getTime();
  }

  defaultMessage() {
    return 'endDate must be later than startDate';
  }
}

/**
 * Payload accepted by `POST /events`.
 */
class CreateEventDto {
  @ApiProperty({
    type: 'string',
    minLength: 3,
    maxLength: 200,
    description: 'Short, descriptive title for the event (3–200 characters).',
    example: 'NestJS Workshop: Building Scalable APIs',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title;

  @ApiProperty({
    type: 'string',
    required: false,
    maxLength: 5000,
    description: 'Detailed description of the event, venue, agenda, or anything else attendees should know.',
    example: 'A hands-on workshop covering dependency injection, modules, guards, and Swagger documentation in NestJS.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description;

  @ApiProperty({
    type: 'string',
    minLength: 2,
    maxLength: 255,
    description: 'Physical or virtual location of the event (e.g. "Room 3B, Tech Hub" or "https://meet.google.com/abc-defg-hij").',
    example: 'Conference Hall A, Tech Campus',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  location;

  @ApiProperty({
    type: 'string',
    format: 'date-time',
    description: 'When the event begins, in ISO 8601 format (e.g. 2025-06-15T09:00:00.000Z). Must precede endDate.',
    example: '2025-06-15T09:00:00.000Z',
  })
  @Type(() => Date)
  @IsDate({ message: 'startDate must be a valid ISO 8601 date' })
  startDate;

  @ApiProperty({
    type: 'string',
    format: 'date-time',
    description: 'When the event ends, in ISO 8601 format (e.g. 2025-06-15T17:00:00.000Z). Must be strictly after startDate.',
    example: '2025-06-15T17:00:00.000Z',
  })
  @Type(() => Date)
  @IsDate({ message: 'endDate must be a valid ISO 8601 date' })
  @Validate(EndAfterStartRule)
  endDate;

  @ApiProperty({
    type: 'integer',
    minimum: 1,
    description: 'Maximum number of attendees permitted to RSVP. Must be a positive integer.',
    example: 50,
  })
  @Type(() => Number)
  @IsInt({ message: 'capacity must be an integer' })
  @Min(1, { message: 'capacity must be a positive integer' })
  capacity;
}

module.exports = { CreateEventDto, EndAfterStartRule };
