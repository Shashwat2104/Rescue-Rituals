'use strict';

const { HttpStatus, HttpException, Logger } = require('@nestjs/common');
const { BaseExceptionFilter } = require('@nestjs/core');

/**
 * Global exception filter that catches all unhandled errors and returns
 * a consistent JSON error response.
 *
 * Handles:
 * - HttpException (4xx/5xx with message + statusCode)
 * - Generic Error / TypeError / ReferenceError
 * - Promise rejections (unhandled async errors)
 *
 * Note: extends BaseExceptionFilter (the correct NestJS 10 base class)
 * instead of the non-existent ExceptionFilter export.
 */
class HttpExceptionFilter extends BaseExceptionFilter {
  constructor() {
    super();
    this.logger = new Logger(HttpExceptionFilter.name);
  }

  catch(exception, host) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'Internal Server Error';
    let stack = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        error = exception.message || this.getErrorName(status);
      } else if (typeof exceptionResponse === 'object') {
        message = exceptionResponse.message || message;
        error = exceptionResponse.error || this.getErrorName(status);
      }
    } else if (exception instanceof Error) {
      // Generic Error, TypeError, ReferenceError, etc.
      message = exception.message || 'An unexpected error occurred';
      error = exception.name || 'Error';
      stack = exception.stack;

      // Log unexpected errors with stack trace
      this.logger.error(
        `Unhandled ${exception.name}: ${exception.message}`,
        exception.stack,
      );
    }

    // In production, hide stack traces from client
    const isProduction = process.env.NODE_ENV === 'production';
    const responseBody = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      error,
      message,
      ...(stack && !isProduction ? { stack } : {}),
    };

    response.status(status).json(responseBody);
  }

  getErrorName(status) {
    const names = {
      [HttpStatus.BAD_REQUEST]: 'Bad Request',
      [HttpStatus.UNAUTHORIZED]: 'Unauthorized',
      [HttpStatus.FORBIDDEN]: 'Forbidden',
      [HttpStatus.NOT_FOUND]: 'Not Found',
      [HttpStatus.CONFLICT]: 'Conflict',
      [HttpStatus.INTERNAL_SERVER_ERROR]: 'Internal Server Error',
      [HttpStatus.BAD_GATEWAY]: 'Bad Gateway',
      [HttpStatus.SERVICE_UNAVAILABLE]: 'Service Unavailable',
    };
    return names[status] || 'Error';
  }
}

module.exports = { HttpExceptionFilter };
