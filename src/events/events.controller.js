'use strict';

const {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} = require('@nestjs/common');
const {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} = require('@nestjs/swagger');

const { JwtAuthGuard } = require('../auth/guards/jwt-auth.guard');
const { CurrentUser } = require('../auth/decorators/current-user.decorator');

const { EventsService } = require('./events.service');
const { CreateEventDto } = require('./dto/create-event.dto');
const { UpdateEventDto } = require('./dto/update-event.dto');
const { EventResponseDto } = require('./dto/event-response.dto');

@ApiTags('events')
@Controller('events')
class EventsController {
  constructor(@Inject(EventsService) eventsService) {
    this.eventsService = eventsService;
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new event',
    description:
      'Creates a new event owned by the authenticated user. The authenticated ' +
      'user automatically becomes the event organiser and can update or delete it. ' +
      'Events must have a positive capacity; startDate must precede endDate.',
  })
  @ApiBody({ type: CreateEventDto })
  @ApiCreatedResponse({ description: 'Event created', type: EventResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed — missing or invalid fields' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  create(@Body() dto, @CurrentUser() user) {
    return this.eventsService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({
    summary: 'List all events',
    description:
      'Returns every event in the system ordered by startDate ascending. ' +
      'Each event includes a live attendeeCount so clients can display availability ' +
      'without a separate request. This endpoint is public — no authentication required.',
  })
  @ApiOkResponse({ description: 'List of events', type: EventResponseDto, isArray: true })
  findAll() {
    return this.eventsService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a single event by ID',
    description:
      'Returns the full details of one event identified by its UUID. ' +
      'Includes the live attendeeCount. Returns 404 if the event does not exist. ' +
      'This endpoint is public.',
  })
  @ApiParam({ name: 'id', description: 'UUID v4 of the event', type: 'string', format: 'uuid', example: 'a1b2c3d4-5678-90ab-cdef-1234567890ab' })
  @ApiOkResponse({ description: 'Event found', type: EventResponseDto })
  @ApiNotFoundResponse({ description: 'Event not found' })
  findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id) {
    return this.eventsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update an event',
    description:
      'Updates one or more fields of an existing event. Only the user who created ' +
      'the event (the organiser) may update it. Omit fields to leave them unchanged. ' +
      'Returns 403 Forbidden if the authenticated user is not the organiser.',
  })
  @ApiParam({ name: 'id', description: 'UUID v4 of the event to update', type: 'string', format: 'uuid', example: 'a1b2c3d4-5678-90ab-cdef-1234567890ab' })
  @ApiBody({ type: UpdateEventDto })
  @ApiOkResponse({ description: 'Event updated', type: EventResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  @ApiForbiddenResponse({ description: 'Authenticated user is not the event organiser' })
  @ApiNotFoundResponse({ description: 'Event not found' })
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id,
    @Body() dto,
    @CurrentUser() user,
  ) {
    return this.eventsService.update(id, dto, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete an event',
    description:
      'Permanently deletes an event and all associated RSVPs. ' +
      'Only the user who created the event (the organiser) may delete it. ' +
      'Returns 204 No Content on success. Returns 403 Forbidden if the ' +
      'authenticated user is not the organiser.',
  })
  @ApiParam({ name: 'id', description: 'UUID v4 of the event to delete', type: 'string', format: 'uuid', example: 'a1b2c3d4-5678-90ab-cdef-1234567890ab' })
  @ApiNoContentResponse({ description: 'Event deleted' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  @ApiForbiddenResponse({ description: 'Authenticated user is not the event organiser' })
  @ApiNotFoundResponse({ description: 'Event not found' })
  async remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id,
    @CurrentUser() user,
  ) {
    await this.eventsService.remove(id, user.id);
  }
}

module.exports = { EventsController };
