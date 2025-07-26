import { HttpExceptionFilter } from './http-exception.filter';
import { BadRequestException, HttpStatus, ArgumentsHost } from '@nestjs/common';
import { Response, Request } from 'express';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockResponse: Partial<Response>;
  let mockRequest: Partial<Request>;
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new HttpExceptionFilter();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockRequest = {
      url: '/test',
    };

    mockHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as unknown as ArgumentsHost;
  });

  it('should format error response correctly', () => {
    const exception = new BadRequestException('Test error');

    filter.catch(exception, mockHost);

    // Verificando se o status da resposta foi chamado corretamente
    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);

    // Verificando se o corpo da resposta está correto
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Test error',
        path: '/test',
        timestamp: expect.any(String),  // Verifica se o timestamp está presente e é uma string
      }),
    );
  });
});
