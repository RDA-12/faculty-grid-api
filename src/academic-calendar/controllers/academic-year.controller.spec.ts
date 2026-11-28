import { Test } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { User } from '../../user/entities/user.entity.js'
import {
  AcademicYear,
  AcademicYearStatus,
} from '../entities/academic-year.entity.js'
import { AcademicYearController } from './academic-year.controller.js'
import {
  AcademicYearOut,
  AcademicYearsQuery,
  CreateAcademicYearDTO,
  UpdateAcademicYearDTO,
} from './academic-year.dto.js'
import {
  CreateAcademicYearParams,
  CreateAcademicYearUseCase,
} from '../use-cases/create-academic-year.use-case.js'
import {
  GetAcademicYearsParams,
  GetAcademicYearsUseCase,
} from '../use-cases/get-academic-years.use-case.js'
import { GetAcademicYearByIdUseCase } from '../use-cases/get-academic-year-by-id.use-case.js'
import {
  UpdateAcademicYearParams,
  UpdateAcademicYearUseCase,
} from '../use-cases/update-academic-year.use-case.js'
import { DeleteAcademicYearUseCase } from '../use-cases/delete-academic-year.use-case.js'
import { AppResult } from '../../common/app-result.js'
import { AppException } from '../../common/app-exception.js'
import { PaginatedResult, PaginationResult } from '../../common/pagination.js'

describe('AcademicYearController', () => {
  const user = new User({
    id: 'user-id',
    name: 'name',
    email: 'email',
  })
  const academicYear = new AcademicYear({
    id: 'year-id',
    name: '2026/2027',
    startDate: '2026-08-01',
    endDate: '2027-07-31',
    status: AcademicYearStatus.planned,
  })
  const paginatedResult = new PaginatedResult({
    data: [academicYear],
    pagination: new PaginationResult({
      total: 10,
      page: 1,
      pageSize: 10,
    }),
  })
  const academicYearOut = AcademicYearOut.fromAcademicYear(academicYear)
  let createAcademicYearUseCase: { execute: ReturnType<typeof vi.fn> }
  let getAcademicYearsUseCase: { execute: ReturnType<typeof vi.fn> }
  let getAcademicYearByIdUseCase: { execute: ReturnType<typeof vi.fn> }
  let updateAcademicYearUseCase: { execute: ReturnType<typeof vi.fn> }
  let deleteAcademicYearUseCase: { execute: ReturnType<typeof vi.fn> }
  let academicYearController: AcademicYearController

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AcademicYearController],
      providers: [
        {
          provide: CreateAcademicYearUseCase,
          useValue: {
            execute: vi.fn().mockResolvedValue(AppResult.success(academicYear)),
          },
        },
        {
          provide: GetAcademicYearsUseCase,
          useValue: {
            execute: vi
              .fn()
              .mockResolvedValue(AppResult.success(paginatedResult)),
          },
        },
        {
          provide: GetAcademicYearByIdUseCase,
          useValue: {
            execute: vi.fn().mockResolvedValue(AppResult.success(academicYear)),
          },
        },
        {
          provide: UpdateAcademicYearUseCase,
          useValue: {
            execute: vi.fn().mockResolvedValue(AppResult.success(academicYear)),
          },
        },
        {
          provide: DeleteAcademicYearUseCase,
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

    createAcademicYearUseCase = moduleRef.get(CreateAcademicYearUseCase)
    getAcademicYearsUseCase = moduleRef.get(GetAcademicYearsUseCase)
    getAcademicYearByIdUseCase = moduleRef.get(GetAcademicYearByIdUseCase)
    updateAcademicYearUseCase = moduleRef.get(UpdateAcademicYearUseCase)
    deleteAcademicYearUseCase = moduleRef.get(DeleteAcademicYearUseCase)

    academicYearController = moduleRef.get(AcademicYearController)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('createAcademicYear', () => {
    const createRequest = new CreateAcademicYearDTO({
      name: '2026/2027',
      startDate: '2026-08-01',
      endDate: '2027-07-31',
    })
    const params = new CreateAcademicYearParams({
      name: createRequest.name,
      startDate: createRequest.startDate,
      endDate: createRequest.endDate,
      status: createRequest.status,
      createdBy: user.id,
    })

    it('calls CreateAcademicYearUseCase once with planned default status', async () => {
      await academicYearController.createAcademicYear(user, createRequest)

      expect(createAcademicYearUseCase.execute).toHaveBeenCalledExactlyOnceWith(
        params,
      )
      expect(params.status).toBe(AcademicYearStatus.planned)
    })

    it('calls CreateAcademicYearUseCase once with explicit status', async () => {
      const activeRequest = new CreateAcademicYearDTO({
        name: '2026/2027',
        startDate: '2026-08-01',
        endDate: '2027-07-31',
        status: AcademicYearStatus.active,
      })

      await academicYearController.createAcademicYear(user, activeRequest)

      expect(createAcademicYearUseCase.execute).toHaveBeenCalledExactlyOnceWith(
        new CreateAcademicYearParams({
          name: activeRequest.name,
          startDate: activeRequest.startDate,
          endDate: activeRequest.endDate,
          status: AcademicYearStatus.active,
          createdBy: user.id,
        }),
      )
    })

    it('should return AcademicYearOut when CreateAcademicYearUseCase succeeds', async () => {
      const result = await academicYearController.createAcademicYear(
        user,
        createRequest,
      )

      expect(result).toStrictEqual(AppResult.success(academicYearOut))
    })

    it('should return failed when CreateAcademicYearUseCase fails', async () => {
      const e = AppException.test()
      vi.spyOn(createAcademicYearUseCase, 'execute').mockResolvedValueOnce(
        AppResult.failed(e),
      )

      const result = await academicYearController.createAcademicYear(
        user,
        createRequest,
      )

      expect(result).toStrictEqual(AppResult.failed(e))
    })
  })

  describe('getAcademicYears', () => {
    it('calls GetAcademicYearsUseCase once with defaults', async () => {
      await academicYearController.getAcademicYears(user)

      expect(getAcademicYearsUseCase.execute).toHaveBeenCalledExactlyOnceWith(
        new GetAcademicYearsParams({}),
      )
    })

    it('calls GetAcademicYearsUseCase once with pagination', async () => {
      const query = new AcademicYearsQuery({ page: 2, pageSize: 5 })

      await academicYearController.getAcademicYears(user, query)

      expect(getAcademicYearsUseCase.execute).toHaveBeenCalledExactlyOnceWith(
        new GetAcademicYearsParams({ page: 2, pageSize: 5 }),
      )
    })

    it('calls GetAcademicYearsUseCase once with filters', async () => {
      const query = new AcademicYearsQuery({
        status: AcademicYearStatus.active,
        search: '2026',
      })

      await academicYearController.getAcademicYears(user, query)

      expect(getAcademicYearsUseCase.execute).toHaveBeenCalledExactlyOnceWith(
        new GetAcademicYearsParams({
          status: query.status,
          search: query.search,
        }),
      )
    })

    it('should return paginated AcademicYearOut when GetAcademicYearsUseCase succeeds', async () => {
      const result = await academicYearController.getAcademicYears(user)

      expect(result).toStrictEqual(
        AppResult.success(
          paginatedResult.mapData((it) => AcademicYearOut.fromAcademicYear(it)),
        ),
      )
    })

    it('should return failed when GetAcademicYearsUseCase fails', async () => {
      const e = AppException.test()
      vi.spyOn(getAcademicYearsUseCase, 'execute').mockResolvedValueOnce(
        AppResult.failed(e),
      )

      const result = await academicYearController.getAcademicYears(user)

      expect(result).toStrictEqual(AppResult.failed(e))
    })
  })

  describe('getAcademicYearById', () => {
    it('calls GetAcademicYearByIdUseCase once', async () => {
      await academicYearController.getAcademicYearById(user, 'year-id')

      expect(
        getAcademicYearByIdUseCase.execute,
      ).toHaveBeenCalledExactlyOnceWith('year-id')
    })

    it('should return AcademicYearOut when GetAcademicYearByIdUseCase succeeds', async () => {
      const result = await academicYearController.getAcademicYearById(
        user,
        'year-id',
      )

      expect(result).toStrictEqual(AppResult.success(academicYearOut))
    })

    it('should return failed when GetAcademicYearByIdUseCase fails', async () => {
      const e = AppException.test()
      vi.spyOn(getAcademicYearByIdUseCase, 'execute').mockResolvedValueOnce(
        AppResult.failed(e),
      )

      const result = await academicYearController.getAcademicYearById(
        user,
        'year-id',
      )

      expect(result).toStrictEqual(AppResult.failed(e))
    })
  })

  describe('updateAcademicYear', () => {
    const updateRequest = new UpdateAcademicYearDTO({
      name: '2026/2027',
      startDate: '2026-08-01',
      endDate: '2027-07-31',
      status: AcademicYearStatus.active,
    })
    const params = new UpdateAcademicYearParams({
      id: 'year-id',
      name: updateRequest.name,
      startDate: updateRequest.startDate,
      endDate: updateRequest.endDate,
      status: updateRequest.status,
    })

    it('calls UpdateAcademicYearUseCase once', async () => {
      await academicYearController.updateAcademicYear(
        user,
        'year-id',
        updateRequest,
      )

      expect(updateAcademicYearUseCase.execute).toHaveBeenCalledExactlyOnceWith(
        params,
      )
    })

    it('should return AcademicYearOut when UpdateAcademicYearUseCase succeeds', async () => {
      const result = await academicYearController.updateAcademicYear(
        user,
        'year-id',
        updateRequest,
      )

      expect(result).toStrictEqual(AppResult.success(academicYearOut))
    })

    it('should return failed when UpdateAcademicYearUseCase fails', async () => {
      const e = AppException.test()
      vi.spyOn(updateAcademicYearUseCase, 'execute').mockResolvedValueOnce(
        AppResult.failed(e),
      )

      const result = await academicYearController.updateAcademicYear(
        user,
        'year-id',
        updateRequest,
      )

      expect(result).toStrictEqual(AppResult.failed(e))
    })
  })

  describe('deleteAcademicYear', () => {
    it('calls DeleteAcademicYearUseCase once', async () => {
      await academicYearController.deleteAcademicYear(user, 'year-id')

      expect(deleteAcademicYearUseCase.execute).toHaveBeenCalledExactlyOnceWith(
        'year-id',
      )
    })

    it('should return undefined when DeleteAcademicYearUseCase succeeds', async () => {
      const result = await academicYearController.deleteAcademicYear(
        user,
        'year-id',
      )

      expect(result).toBeUndefined()
    })

    it('should return failed when DeleteAcademicYearUseCase fails', async () => {
      const e = AppException.test()
      vi.spyOn(deleteAcademicYearUseCase, 'execute').mockResolvedValueOnce(
        AppResult.failed(e),
      )

      const result = await academicYearController.deleteAcademicYear(
        user,
        'year-id',
      )

      expect(result).toStrictEqual(AppResult.failed(e))
    })
  })
})
