import { Test } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { User } from '../../user/entities/user.entity.js'
import { Term, TermStatus } from '../entities/term.entity.js'
import { TermController } from './term.controller.js'
import {
  CreateTermDTO,
  TermOut,
  TermsQuery,
  UpdateTermDTO,
} from './term.dto.js'
import {
  CreateTermParams,
  CreateTermUseCase,
} from '../use-cases/create-term.use-case.js'
import {
  GetTermsParams,
  GetTermsUseCase,
} from '../use-cases/get-terms.use-case.js'
import { GetTermByIdUseCase } from '../use-cases/get-term-by-id.use-case.js'
import {
  UpdateTermParams,
  UpdateTermUseCase,
} from '../use-cases/update-term.use-case.js'
import { DeleteTermUseCase } from '../use-cases/delete-term.use-case.js'
import { AppResult } from '../../common/app-result.js'
import { AppException } from '../../common/app-exception.js'
import { PaginatedResult, PaginationResult } from '../../common/pagination.js'

describe('TermController', () => {
  const user = new User({
    id: 'user-id',
    name: 'name',
    email: 'email',
  })
  const term = new Term({
    id: 'term-id',
    academicYearId: 'year-id',
    name: '2026/2027 Odd',
    startDate: '2026-08-01',
    endDate: '2027-01-31',
    status: TermStatus.planned,
  })
  const paginatedResult = new PaginatedResult({
    data: [term],
    pagination: new PaginationResult({
      total: 10,
      page: 1,
      pageSize: 10,
    }),
  })
  const termOut = TermOut.fromTerm(term)
  let createTermUseCase: { execute: ReturnType<typeof vi.fn> }
  let getTermsUseCase: { execute: ReturnType<typeof vi.fn> }
  let getTermByIdUseCase: { execute: ReturnType<typeof vi.fn> }
  let updateTermUseCase: { execute: ReturnType<typeof vi.fn> }
  let deleteTermUseCase: { execute: ReturnType<typeof vi.fn> }
  let termController: TermController

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [TermController],
      providers: [
        {
          provide: CreateTermUseCase,
          useValue: {
            execute: vi.fn().mockResolvedValue(AppResult.success(term)),
          },
        },
        {
          provide: GetTermsUseCase,
          useValue: {
            execute: vi
              .fn()
              .mockResolvedValue(AppResult.success(paginatedResult)),
          },
        },
        {
          provide: GetTermByIdUseCase,
          useValue: {
            execute: vi.fn().mockResolvedValue(AppResult.success(term)),
          },
        },
        {
          provide: UpdateTermUseCase,
          useValue: {
            execute: vi.fn().mockResolvedValue(AppResult.success(term)),
          },
        },
        {
          provide: DeleteTermUseCase,
          useValue: {
            execute: vi.fn().mockResolvedValue(AppResult.success(null)),
          },
        },
        {
          provide: ConfigService,
          useValue: {},
        },
      ],
    }).compile()

    createTermUseCase = moduleRef.get(CreateTermUseCase)
    getTermsUseCase = moduleRef.get(GetTermsUseCase)
    getTermByIdUseCase = moduleRef.get(GetTermByIdUseCase)
    updateTermUseCase = moduleRef.get(UpdateTermUseCase)
    deleteTermUseCase = moduleRef.get(DeleteTermUseCase)

    termController = moduleRef.get(TermController)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('createTerm', () => {
    const createRequest = new CreateTermDTO({
      academicYearId: 'year-id',
      name: '2026/2027 Odd',
      startDate: '2026-08-01',
      endDate: '2027-01-31',
    })
    const params = new CreateTermParams({
      academicYearId: createRequest.academicYearId,
      name: createRequest.name,
      startDate: createRequest.startDate,
      endDate: createRequest.endDate,
      status: createRequest.status,
      createdBy: user.id,
    })

    it('calls CreateTermUseCase once with planned default status', async () => {
      await termController.createTerm(user, createRequest)

      expect(createTermUseCase.execute).toHaveBeenCalledExactlyOnceWith(params)
      expect(params.status).toBe(TermStatus.planned)
    })

    it('calls CreateTermUseCase once with explicit status', async () => {
      const activeRequest = new CreateTermDTO({
        academicYearId: 'year-id',
        name: '2026/2027 Odd',
        startDate: '2026-08-01',
        endDate: '2027-01-31',
        status: TermStatus.active,
      })

      await termController.createTerm(user, activeRequest)

      expect(createTermUseCase.execute).toHaveBeenCalledExactlyOnceWith(
        new CreateTermParams({
          academicYearId: activeRequest.academicYearId,
          name: activeRequest.name,
          startDate: activeRequest.startDate,
          endDate: activeRequest.endDate,
          status: TermStatus.active,
          createdBy: user.id,
        }),
      )
    })

    it('should return TermOut when CreateTermUseCase succeeds', async () => {
      const result = await termController.createTerm(user, createRequest)

      expect(result).toStrictEqual(AppResult.success(termOut))
    })

    it('should return failed when CreateTermUseCase fails', async () => {
      const e = AppException.test()
      vi.spyOn(createTermUseCase, 'execute').mockResolvedValueOnce(
        AppResult.failed(e),
      )

      const result = await termController.createTerm(user, createRequest)

      expect(result).toStrictEqual(AppResult.failed(e))
    })
  })

  describe('getTerms', () => {
    it('calls GetTermsUseCase once with defaults', async () => {
      await termController.getTerms(user)

      expect(getTermsUseCase.execute).toHaveBeenCalledExactlyOnceWith(
        new GetTermsParams({}),
      )
    })

    it('calls GetTermsUseCase once with pagination', async () => {
      const query = new TermsQuery({ page: 2, pageSize: 5 })

      await termController.getTerms(user, query)

      expect(getTermsUseCase.execute).toHaveBeenCalledExactlyOnceWith(
        new GetTermsParams({ page: 2, pageSize: 5 }),
      )
    })

    it('calls GetTermsUseCase once with filters', async () => {
      const query = new TermsQuery({
        academicYearId: 'year-id',
        status: TermStatus.active,
        search: 'Odd',
      })

      await termController.getTerms(user, query)

      expect(getTermsUseCase.execute).toHaveBeenCalledExactlyOnceWith(
        new GetTermsParams({
          academicYearId: query.academicYearId,
          status: query.status,
          search: query.search,
        }),
      )
    })

    it('should return paginated TermOut when GetTermsUseCase succeeds', async () => {
      const result = await termController.getTerms(user)

      expect(result).toStrictEqual(
        AppResult.success(
          paginatedResult.mapData((it) => TermOut.fromTerm(it)),
        ),
      )
    })

    it('should return failed when GetTermsUseCase fails', async () => {
      const e = AppException.test()
      vi.spyOn(getTermsUseCase, 'execute').mockResolvedValueOnce(
        AppResult.failed(e),
      )

      const result = await termController.getTerms(user)

      expect(result).toStrictEqual(AppResult.failed(e))
    })
  })

  describe('getTermById', () => {
    it('calls GetTermByIdUseCase once', async () => {
      await termController.getTermById(user, 'term-id')

      expect(getTermByIdUseCase.execute).toHaveBeenCalledExactlyOnceWith(
        'term-id',
      )
    })

    it('should return TermOut when GetTermByIdUseCase succeeds', async () => {
      const result = await termController.getTermById(user, 'term-id')

      expect(result).toStrictEqual(AppResult.success(termOut))
    })

    it('should return failed when GetTermByIdUseCase fails', async () => {
      const e = AppException.test()
      vi.spyOn(getTermByIdUseCase, 'execute').mockResolvedValueOnce(
        AppResult.failed(e),
      )

      const result = await termController.getTermById(user, 'term-id')

      expect(result).toStrictEqual(AppResult.failed(e))
    })
  })

  describe('updateTerm', () => {
    const updateRequest = new UpdateTermDTO({
      academicYearId: 'year-id',
      name: '2026/2027 Odd',
      startDate: '2026-08-01',
      endDate: '2027-01-31',
      status: TermStatus.active,
    })
    const params = new UpdateTermParams({
      id: 'term-id',
      academicYearId: updateRequest.academicYearId,
      name: updateRequest.name,
      startDate: updateRequest.startDate,
      endDate: updateRequest.endDate,
      status: updateRequest.status,
    })

    it('calls UpdateTermUseCase once', async () => {
      await termController.updateTerm(user, 'term-id', updateRequest)

      expect(updateTermUseCase.execute).toHaveBeenCalledExactlyOnceWith(params)
    })

    it('should return TermOut when UpdateTermUseCase succeeds', async () => {
      const result = await termController.updateTerm(
        user,
        'term-id',
        updateRequest,
      )

      expect(result).toStrictEqual(AppResult.success(termOut))
    })

    it('should return failed when UpdateTermUseCase fails', async () => {
      const e = AppException.test()
      vi.spyOn(updateTermUseCase, 'execute').mockResolvedValueOnce(
        AppResult.failed(e),
      )

      const result = await termController.updateTerm(
        user,
        'term-id',
        updateRequest,
      )

      expect(result).toStrictEqual(AppResult.failed(e))
    })
  })

  describe('deleteTerm', () => {
    it('calls DeleteTermUseCase once', async () => {
      await termController.deleteTerm(user, 'term-id')

      expect(deleteTermUseCase.execute).toHaveBeenCalledExactlyOnceWith(
        'term-id',
      )
    })

    it('should return undefined when DeleteTermUseCase succeeds', async () => {
      const result = await termController.deleteTerm(user, 'term-id')

      expect(result).toBeUndefined()
    })

    it('should return failed when DeleteTermUseCase fails', async () => {
      const e = AppException.test()
      vi.spyOn(deleteTermUseCase, 'execute').mockResolvedValueOnce(
        AppResult.failed(e),
      )

      const result = await termController.deleteTerm(user, 'term-id')

      expect(result).toStrictEqual(AppResult.failed(e))
    })
  })
})
