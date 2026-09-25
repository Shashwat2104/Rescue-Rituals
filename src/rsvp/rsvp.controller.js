'use strict';

const {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} = require('@nestjs/common');
const {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} = require('@nestjs/swagger');

const { JwtAuthGuard } = require('../auth/guards/jwt-auth.guard');
const { CurrentUser } = require('../auth/decorators/current-user.decorator');
const { RsvpService } = require('./rsvp.service');
const { AttendeesResponseDto } = require('./dto/attendee.dto');
const { RsvpResponseDto } = require('./dto/rsvp-response.dto');

@ApiTags('events')
@Controller('events/:id')
class RsvpController {
  constructor(@Inject(RsvpService) rsvpService) {
    this.rsvpService = rsvpService;
  }

  /**
   * RSVP (join) an event.
   *
   * Authenticated users only. The user's identity is extracted from the JWT
   * bearer token sent in the Authorization header.
   *
   * Behaviour:
   * - Returns 409 Conflict if the user has already RSVP'd to this event.
   * - Returns 409 Conflict if the event is at full capacity.
   * - Returns 404 Not Found if the event does not exist.
   * - The DB UNIQUE constraint on (event_id, user_id) is the authoritative
   *   guard against duplicate RSVPs under concurrent requests.
   */
  @Post('rsvp')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'RSVP (join) an event',
    description:
      'Register the authenticated user as attending this event. ' +
      'Requires a valid JWT bearer token. ' +
      'Returns 409 if the user has already RSVP\'d or the event is at capacity. ' +
      'Returns 404 if the event does not exist.',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'UUID of the event to join',
    example: 'a1b2c3d4-5678-90ab-cdef-1234567890ab',
  })
  @ApiCreatedResponse({
    description: 'RSVP created successfully',
    type: RsvpResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid JWT bearer token',
  })
  @ApiNotFoundResponse({
    description: 'Event not found',
  })
  @ApiConflictResponse({
    description:
      'Already RSVP\'d to this event, or the event has reached full capacity',
  })
  rsvp(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id,
    @CurrentUser() user,
  ) {
    return this.rsvpService.rsvpToEvent(id, user.id);
  }

  /**
   * List all attendees for an event.
   *
   * Returns each attendee's id, name, and email, plus the total count and
   * the event's capacity so clients can render a "X / Y spots filled" badge.
   *
   * Authenticated users only. The event must exist (404 otherwise).
   */
  @Get('attendees')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List attendees of an event',
    description:
      'Returns the list of users who have RSVP\'d to the event, ' +
      'including each attendee\'s id, name, and email. ' +
      'Also returns the current count and the event capacity. ' +
      'Requires a valid JWT bearer token. ' +
      'Returns 404 if the event does not exist.',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'UUID of the event whose attendees to list',
    example: 'a1b2c3d4-5678-90ab-cdef-1234567890ab',
  })
  @ApiOkResponse({
    description: 'Attendee list returned successfully',
    type: AttendeesResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid JWT bearer token',
  })
  @ApiNotFoundResponse({
    description: 'Event not found',
  })
  attendees(@Param('id', new ParseUUIDPipe({ version: '4' })) id) {
    return this.rsvpService.listAttendees(id);
  }
}

module.exports = { RsvpController };
