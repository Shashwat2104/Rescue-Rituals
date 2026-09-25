'use strict';

const {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
} = require('@nestjs/common');
const {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} = require('@nestjs/swagger');

const { AuthService } = require('./auth.service');
const { RegisterDto } = require('./dto/register.dto');
const { LoginDto } = require('./dto/login.dto');
const { AuthResponseDto } = require('./dto/auth-response.dto');

@ApiTags('auth')
@Controller('auth')
class AuthController {
  constructor(@Inject(AuthService) authService) {
    this.authService = authService;
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new user and obtain a JWT',
    description:
      'Creates a new user account with the provided name, email, and password. ' +
      'On success, returns a signed JWT access token (duration is controlled by the JWT_EXPIRES_IN ' +
      'env var, default 1 h) and the created user profile. Email addresses must be unique across all users.',
  })
  @ApiBody({ type: RegisterDto })
  @ApiCreatedResponse({ description: 'User registered successfully', type: AuthResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed — missing or invalid fields' })
  @ApiConflictResponse({ description: 'Email address is already registered' })
  register(@Body() dto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Log in with email + password and obtain a JWT',
    description:
      'Authenticates a user with their email and password. On success, returns ' +
      'a signed JWT access token (duration is controlled by the JWT_EXPIRES_IN env var, default 1 h) and the user profile. ' +
      'Use the returned token as `Bearer <token>` in the `Authorization` header ' +
      'for all protected endpoints.',
  })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ description: 'Login successful', type: AuthResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed — missing or malformed fields' })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password' })
  login(@Body() dto) {
    return this.authService.login(dto);
  }
}

module.exports = { AuthController };
