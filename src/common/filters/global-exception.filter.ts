import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  Global,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

interface ErrorResponse {
  status: number;
  error: string | object;
  timestamp: string;
  path: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private static readonly UNEXPECTED_ERROR_MESSAGE =
    'An unexpected error occurred';

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : GlobalExceptionFilter.UNEXPECTED_ERROR_MESSAGE;

    response.status(status).json({
      status,
      timestamp: new Date().toISOString(),
      path: request.url,
      error: message,
    } as ErrorResponse);
  }
}
