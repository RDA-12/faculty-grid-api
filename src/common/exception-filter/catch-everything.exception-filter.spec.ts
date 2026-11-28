import {
  type ArgumentsHost,
  BadRequestException,
  ForbiddenException,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'
import type { HttpAdapterHost } from '@nestjs/core'
import { FailedResponse } from '../app-response.js'
import { CatchEverythingExceptionFilter } from './catch-everything.exception-filter.js'

describe('CatchEverythingExceptionFilter', () => {
  const mockReply = vi.fn()
  const mockResponse = {}
  const mockHost = {
    switchToHttp: () => ({
      getResponse: () => mockResponse,
    }),
  } as unknown as ArgumentsHost
  const httpAdapterHost = {
    httpAdapter: {
      reply: mockReply,
    },
  } as unknown as HttpAdapterHost

  let filter: CatchEverythingExceptionFilter

  beforeEach(() => {
    filter = new CatchEverythingExceptionFilter(httpAdapterHost)
    vi.clearAllMocks()
  })

  it('should reply 404 with FailedResponse for NotFoundException', () => {
    filter.catch(new NotFoundException('Cannot GET /unknown'), mockHost)

    expect(mockReply).toHaveBeenCalledExactlyOnceWith(
      mockResponse,
      new FailedResponse(404, 'Not Found', 'Cannot GET /unknown'),
      404,
    )
  })

  it('should reply 403 with FailedResponse for ForbiddenException', () => {
    filter.catch(new ForbiddenException('Forbidden resource'), mockHost)

    expect(mockReply).toHaveBeenCalledExactlyOnceWith(
      mockResponse,
      new FailedResponse(403, 'Forbidden', 'Forbidden resource'),
      403,
    )
  })

  it('should join array message for 4xx HttpException', () => {
    filter.catch(
      new BadRequestException(['field is invalid', 'other is invalid']),
      mockHost,
    )

    expect(mockReply).toHaveBeenCalledExactlyOnceWith(
      mockResponse,
      new FailedResponse(
        400,
        'Bad Request',
        'field is invalid, other is invalid',
      ),
      400,
    )
  })

  it('should handle string response for 4xx HttpException', () => {
    filter.catch(new HttpException('Custom client error', 405), mockHost)

    expect(mockReply).toHaveBeenCalledExactlyOnceWith(
      mockResponse,
      new FailedResponse(405, 'HttpException', 'Custom client error'),
      405,
    )
  })

  it('should reply generic 500 for InternalServerErrorException', () => {
    filter.catch(
      new InternalServerErrorException('secret db details'),
      mockHost,
    )

    expect(mockReply).toHaveBeenCalledExactlyOnceWith(
      mockResponse,
      new FailedResponse(
        500,
        'Internal error',
        'Something went wrong in the server',
      ),
      500,
    )
  })

  it('should reply generic 500 for non-HttpException Error and unknown values', () => {
    filter.catch(new Error('unexpected'), mockHost)

    expect(mockReply).toHaveBeenCalledWith(
      mockResponse,
      new FailedResponse(
        500,
        'Internal error',
        'Something went wrong in the server',
      ),
      500,
    )

    vi.clearAllMocks()
    filter.catch('boom', mockHost)

    expect(mockReply).toHaveBeenCalledExactlyOnceWith(
      mockResponse,
      new FailedResponse(
        500,
        'Internal error',
        'Something went wrong in the server',
      ),
      500,
    )
  })
})
