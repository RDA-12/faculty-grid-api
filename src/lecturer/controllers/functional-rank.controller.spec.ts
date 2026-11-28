import { Test } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { User } from '../../user/entities/user.entity.js'
import { FunctionalRank } from '../entities/functional-rank.entity.js'
import { FunctionalRankController } from './functional-rank.controller.js'
import {
  CreateFunctionalRankDTO,
  FunctionalRankOut,
  FunctionalRanksQuery,
  UpdateFunctionalRankDTO,
} from './functional-rank.dto.js'
import {
  CreateFunctionalRankParams,
  CreateFunctionalRankUseCase,
} from '../use-cases/create-functional-rank.use-case.js'
import {
  GetFunctionalRanksParams,
  GetFunctionalRanksUseCase,
} from '../use-cases/get-functional-ranks.use-case.js'
import { GetFunctionalRankByIdUseCase } from '../use-cases/get-functional-rank-by-id.use-case.js'
import {
  UpdateFunctionalRankParams,
  UpdateFunctionalRankUseCase,
} from '../use-cases/update-functional-rank.use-case.js'
import { DeleteFunctionalRankUseCase } from '../use-cases/delete-functional-rank.use-case.js'
import { AppResult } from '../../common/app-result.js'
import { AppException } from '../../common/app-exception.js'
import {
  PaginatedResult,
  Pagination,
  PaginationResult,
} from '../../common/pagination.js'

describe('FunctionalRankController', () => {
  const user = new User({
    id: 'id',
    name: 'name',
    email: 'email',
  })
  const functionalRank = new FunctionalRank({
    id: 'functional-rank-id',
    name: 'Lektor',
  })
  const paginatedResult = new PaginatedResult({
    data: [functionalRank],
    pagination: new PaginationResult({
      total: 10,
      page: 1,
      pageSize: 10,
    }),
  })
  const functionalRankOut = FunctionalRankOut.fromFunctionalRank(functionalRank)
  let createFunctionalRankUseCase: { execute: ReturnType<typeof vi.fn> }
  let getFunctionalRanksUseCase: { execute: ReturnType<typeof vi.fn> }
  let getFunctionalRankByIdUseCase: { execute: ReturnType<typeof vi.fn> }
  let updateFunctionalRankUseCase: { execute: ReturnType<typeof vi.fn> }
  let deleteFunctionalRankUseCase: { execute: ReturnType<typeof vi.fn> }
  let functionalRankController: FunctionalRankController

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [FunctionalRankController],
      providers: [
        {
          provide: CreateFunctionalRankUseCase,
          useValue: {
            execute: vi
              .fn()
              .mockResolvedValue(AppResult.success(functionalRank)),
          },
        },
        {
          provide: GetFunctionalRanksUseCase,
          useValue: {
            execute: vi
              .fn()
              .mockResolvedValue(AppResult.success(paginatedResult)),
          },
        },
        {
          provide: GetFunctionalRankByIdUseCase,
          useValue: {
            execute: vi
              .fn()
              .mockResolvedValue(AppResult.success(functionalRank)),
          },
        },
        {
          provide: UpdateFunctionalRankUseCase,
          useValue: {
            execute: vi
              .fn()
              .mockResolvedValue(AppResult.success(functionalRank)),
          },
        },
        {
          provide: DeleteFunctionalRankUseCase,
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

    createFunctionalRankUseCase = moduleRef.get(CreateFunctionalRankUseCase)
    getFunctionalRanksUseCase = moduleRef.get(GetFunctionalRanksUseCase)
    getFunctionalRankByIdUseCase = moduleRef.get(GetFunctionalRankByIdUseCase)
    updateFunctionalRankUseCase = moduleRef.get(UpdateFunctionalRankUseCase)
    deleteFunctionalRankUseCase = moduleRef.get(DeleteFunctionalRankUseCase)

    functionalRankController = moduleRef.get(FunctionalRankController)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('createFunctionalRank', () => {
    const createFunctionalRankRequest = new CreateFunctionalRankDTO({
      name: 'Lektor',
    })
    const params = new CreateFunctionalRankParams({
      name: createFunctionalRankRequest.name,
      createdBy: user.id,
    })

    it('calls CreateFunctionalRankUseCase once', async () => {
      await functionalRankController.createFunctionalRank(
        user,
        createFunctionalRankRequest,
      )

      expect(
        createFunctionalRankUseCase.execute,
      ).toHaveBeenCalledExactlyOnceWith(params)
    })

    it('should return FunctionalRankOut when CreateFunctionalRankUseCase succeeds', async () => {
      const result = await functionalRankController.createFunctionalRank(
        user,
        createFunctionalRankRequest,
      )

      expect(result).toStrictEqual(AppResult.success(functionalRankOut))
    })

    it('should return failed when CreateFunctionalRankUseCase fails', async () => {
      const e = AppException.test()
      vi.spyOn(createFunctionalRankUseCase, 'execute').mockResolvedValueOnce(
        AppResult.failed(e),
      )

      const result = await functionalRankController.createFunctionalRank(
        user,
        createFunctionalRankRequest,
      )

      expect(result).toStrictEqual(AppResult.failed(e))
    })
  })

  describe('getFunctionalRanks', () => {
    it('calls GetFunctionalRanksUseCase once with defaults', async () => {
      await functionalRankController.getFunctionalRanks(user)

      expect(getFunctionalRanksUseCase.execute).toHaveBeenCalledExactlyOnceWith(
        new Pagination({}),
      )
    })

    it('calls GetFunctionalRanksUseCase once with pagination', async () => {
      const pagination = new Pagination({ page: 2 })

      await functionalRankController.getFunctionalRanks(user, pagination)

      expect(getFunctionalRanksUseCase.execute).toHaveBeenCalledExactlyOnceWith(
        pagination,
      )
    })

    it('calls GetFunctionalRanksUseCase once with search filter', async () => {
      const query = new FunctionalRanksQuery({ search: 'Lektor' })

      await functionalRankController.getFunctionalRanks(user, query)

      expect(getFunctionalRanksUseCase.execute).toHaveBeenCalledExactlyOnceWith(
        new GetFunctionalRanksParams({ search: query.search }),
      )
    })

    it('should return paginated FunctionalRankOut when GetFunctionalRanksUseCase succeeds', async () => {
      const result = await functionalRankController.getFunctionalRanks(user)

      expect(result).toStrictEqual(
        AppResult.success(
          paginatedResult.mapData((it) =>
            FunctionalRankOut.fromFunctionalRank(it),
          ),
        ),
      )
    })

    it('should return failed when GetFunctionalRanksUseCase fails', async () => {
      const e = AppException.test()
      vi.spyOn(getFunctionalRanksUseCase, 'execute').mockResolvedValueOnce(
        AppResult.failed(e),
      )

      const result = await functionalRankController.getFunctionalRanks(user)

      expect(result).toStrictEqual(AppResult.failed(e))
    })
  })

  describe('getFunctionalRankById', () => {
    it('calls GetFunctionalRankByIdUseCase once', async () => {
      await functionalRankController.getFunctionalRankById(
        user,
        'functional-rank-id',
      )

      expect(
        getFunctionalRankByIdUseCase.execute,
      ).toHaveBeenCalledExactlyOnceWith('functional-rank-id')
    })

    it('should return FunctionalRankOut when GetFunctionalRankByIdUseCase succeeds', async () => {
      const result = await functionalRankController.getFunctionalRankById(
        user,
        'functional-rank-id',
      )

      expect(result).toStrictEqual(AppResult.success(functionalRankOut))
    })

    it('should return failed when GetFunctionalRankByIdUseCase fails', async () => {
      const e = AppException.test()
      vi.spyOn(getFunctionalRankByIdUseCase, 'execute').mockResolvedValueOnce(
        AppResult.failed(e),
      )

      const result = await functionalRankController.getFunctionalRankById(
        user,
        'functional-rank-id',
      )

      expect(result).toStrictEqual(AppResult.failed(e))
    })
  })

  describe('updateFunctionalRank', () => {
    const updateFunctionalRankRequest = new UpdateFunctionalRankDTO({
      name: 'Lektor Kepala',
    })
    const params = new UpdateFunctionalRankParams({
      id: 'functional-rank-id',
      name: updateFunctionalRankRequest.name,
    })

    it('calls UpdateFunctionalRankUseCase once', async () => {
      await functionalRankController.updateFunctionalRank(
        user,
        'functional-rank-id',
        updateFunctionalRankRequest,
      )

      expect(
        updateFunctionalRankUseCase.execute,
      ).toHaveBeenCalledExactlyOnceWith(params)
    })

    it('should return FunctionalRankOut when UpdateFunctionalRankUseCase succeeds', async () => {
      const result = await functionalRankController.updateFunctionalRank(
        user,
        'functional-rank-id',
        updateFunctionalRankRequest,
      )

      expect(result).toStrictEqual(AppResult.success(functionalRankOut))
    })

    it('should return failed when UpdateFunctionalRankUseCase fails', async () => {
      const e = AppException.test()
      vi.spyOn(updateFunctionalRankUseCase, 'execute').mockResolvedValueOnce(
        AppResult.failed(e),
      )

      const result = await functionalRankController.updateFunctionalRank(
        user,
        'functional-rank-id',
        updateFunctionalRankRequest,
      )

      expect(result).toStrictEqual(AppResult.failed(e))
    })
  })

  describe('deleteFunctionalRank', () => {
    it('calls DeleteFunctionalRankUseCase once', async () => {
      await functionalRankController.deleteFunctionalRank(user, 'id')

      expect(
        deleteFunctionalRankUseCase.execute,
      ).toHaveBeenCalledExactlyOnceWith('id')
    })

    it('should return undefined when DeleteFunctionalRankUseCase succeeds', async () => {
      const result = await functionalRankController.deleteFunctionalRank(
        user,
        'id',
      )

      expect(result).toBeUndefined()
    })

    it('should return failed when DeleteFunctionalRankUseCase fails', async () => {
      const e = AppException.test()
      vi.spyOn(deleteFunctionalRankUseCase, 'execute').mockResolvedValueOnce(
        AppResult.failed(e),
      )

      const result = await functionalRankController.deleteFunctionalRank(
        user,
        'id',
      )

      expect(result).toStrictEqual(AppResult.failed(e))
    })
  })
})
