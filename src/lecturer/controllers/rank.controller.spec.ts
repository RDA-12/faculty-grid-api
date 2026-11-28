import { Test } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { User } from '../../user/entities/user.entity.js'
import { Rank, RankType } from '../entities/rank.entity.js'
import { RankController } from './rank.controller.js'
import {
  CreateRankDTO,
  RankOut,
  RanksQuery,
  UpdateRankDTO,
} from './rank.dto.js'
import {
  CreateRankParams,
  CreateRankUseCase,
} from '../use-cases/create-rank.use-case.js'
import {
  GetRanksParams,
  GetRanksUseCase,
} from '../use-cases/get-ranks.use-case.js'
import { GetRankByIdUseCase } from '../use-cases/get-rank-by-id.use-case.js'
import {
  UpdateRankParams,
  UpdateRankUseCase,
} from '../use-cases/update-rank.use-case.js'
import { DeleteRankUseCase } from '../use-cases/delete-rank.use-case.js'
import { AppResult } from '../../common/app-result.js'
import { AppException } from '../../common/app-exception.js'
import {
  PaginatedResult,
  Pagination,
  PaginationResult,
} from '../../common/pagination.js'

describe('RankController', () => {
  const user = new User({
    id: 'id',
    name: 'name',
    email: 'email',
  })
  const rank = new Rank({
    id: 'rank-id',
    name: 'Penata Muda (III/a)',
    type: RankType.asn,
  })
  const paginatedResult = new PaginatedResult({
    data: [rank],
    pagination: new PaginationResult({
      total: 10,
      page: 1,
      pageSize: 10,
    }),
  })
  const rankOut = RankOut.fromRank(rank)
  let createRankUseCase: { execute: ReturnType<typeof vi.fn> }
  let getRanksUseCase: { execute: ReturnType<typeof vi.fn> }
  let getRankByIdUseCase: { execute: ReturnType<typeof vi.fn> }
  let updateRankUseCase: { execute: ReturnType<typeof vi.fn> }
  let deleteRankUseCase: { execute: ReturnType<typeof vi.fn> }
  let rankController: RankController

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [RankController],
      providers: [
        {
          provide: CreateRankUseCase,
          useValue: {
            execute: vi.fn().mockResolvedValue(AppResult.success(rank)),
          },
        },
        {
          provide: GetRanksUseCase,
          useValue: {
            execute: vi
              .fn()
              .mockResolvedValue(AppResult.success(paginatedResult)),
          },
        },
        {
          provide: GetRankByIdUseCase,
          useValue: {
            execute: vi.fn().mockResolvedValue(AppResult.success(rank)),
          },
        },
        {
          provide: UpdateRankUseCase,
          useValue: {
            execute: vi.fn().mockResolvedValue(AppResult.success(rank)),
          },
        },
        {
          provide: DeleteRankUseCase,
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

    createRankUseCase = moduleRef.get(CreateRankUseCase)
    getRanksUseCase = moduleRef.get(GetRanksUseCase)
    getRankByIdUseCase = moduleRef.get(GetRankByIdUseCase)
    updateRankUseCase = moduleRef.get(UpdateRankUseCase)
    deleteRankUseCase = moduleRef.get(DeleteRankUseCase)

    rankController = moduleRef.get(RankController)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('createRank', () => {
    const createRankRequest = new CreateRankDTO({
      name: 'Penata Muda (III/a)',
      type: RankType.asn,
    })
    const params = new CreateRankParams({
      name: createRankRequest.name,
      type: createRankRequest.type,
      createdBy: user.id,
    })

    it('calls CreateRankUseCase once', async () => {
      await rankController.createRank(user, createRankRequest)

      expect(createRankUseCase.execute).toHaveBeenCalledExactlyOnceWith(params)
    })

    it('should return RankOut when CreateRankUseCase succeeds', async () => {
      const result = await rankController.createRank(user, createRankRequest)

      expect(result).toStrictEqual(AppResult.success(rankOut))
    })

    it('should return failed when CreateRankUseCase fails', async () => {
      const e = AppException.test()
      vi.spyOn(createRankUseCase, 'execute').mockResolvedValueOnce(
        AppResult.failed(e),
      )

      const result = await rankController.createRank(user, createRankRequest)

      expect(result).toStrictEqual(AppResult.failed(e))
    })
  })

  describe('getRanks', () => {
    it('calls GetRanksUseCase once with defaults', async () => {
      await rankController.getRanks(user)

      expect(getRanksUseCase.execute).toHaveBeenCalledExactlyOnceWith(
        new Pagination({}),
      )
    })

    it('calls GetRanksUseCase once with pagination', async () => {
      const pagination = new Pagination({ page: 2 })

      await rankController.getRanks(user, pagination)

      expect(getRanksUseCase.execute).toHaveBeenCalledExactlyOnceWith(
        pagination,
      )
    })

    it('calls GetRanksUseCase once with type filter', async () => {
      const query = new RanksQuery({ type: RankType.military })

      await rankController.getRanks(user, query)

      expect(getRanksUseCase.execute).toHaveBeenCalledExactlyOnceWith(
        new GetRanksParams({ type: query.type }),
      )
    })

    it('calls GetRanksUseCase once with search filter', async () => {
      const query = new RanksQuery({ search: 'Penata' })

      await rankController.getRanks(user, query)

      expect(getRanksUseCase.execute).toHaveBeenCalledExactlyOnceWith(
        new GetRanksParams({ search: query.search }),
      )
    })

    it('should return paginated RankOut when GetRanksUseCase succeeds', async () => {
      const result = await rankController.getRanks(user)

      expect(result).toStrictEqual(
        AppResult.success(
          paginatedResult.mapData((it) => RankOut.fromRank(it)),
        ),
      )
    })

    it('should return failed when GetRanksUseCase fails', async () => {
      const e = AppException.test()
      vi.spyOn(getRanksUseCase, 'execute').mockResolvedValueOnce(
        AppResult.failed(e),
      )

      const result = await rankController.getRanks(user)

      expect(result).toStrictEqual(AppResult.failed(e))
    })
  })

  describe('getRankById', () => {
    it('calls GetRankByIdUseCase once', async () => {
      await rankController.getRankById(user, 'rank-id')

      expect(getRankByIdUseCase.execute).toHaveBeenCalledExactlyOnceWith(
        'rank-id',
      )
    })

    it('should return RankOut when GetRankByIdUseCase succeeds', async () => {
      const result = await rankController.getRankById(user, 'rank-id')

      expect(result).toStrictEqual(AppResult.success(rankOut))
    })

    it('should return failed when GetRankByIdUseCase fails', async () => {
      const e = AppException.test()
      vi.spyOn(getRankByIdUseCase, 'execute').mockResolvedValueOnce(
        AppResult.failed(e),
      )

      const result = await rankController.getRankById(user, 'rank-id')

      expect(result).toStrictEqual(AppResult.failed(e))
    })
  })

  describe('updateRank', () => {
    const updateRankRequest = new UpdateRankDTO({
      name: 'Mayor',
      type: RankType.military,
    })
    const params = new UpdateRankParams({
      id: 'rank-id',
      name: updateRankRequest.name,
      type: updateRankRequest.type,
    })

    it('calls UpdateRankUseCase once', async () => {
      await rankController.updateRank(user, 'rank-id', updateRankRequest)

      expect(updateRankUseCase.execute).toHaveBeenCalledExactlyOnceWith(params)
    })

    it('should return RankOut when UpdateRankUseCase succeeds', async () => {
      const result = await rankController.updateRank(
        user,
        'rank-id',
        updateRankRequest,
      )

      expect(result).toStrictEqual(AppResult.success(rankOut))
    })

    it('should return failed when UpdateRankUseCase fails', async () => {
      const e = AppException.test()
      vi.spyOn(updateRankUseCase, 'execute').mockResolvedValueOnce(
        AppResult.failed(e),
      )

      const result = await rankController.updateRank(
        user,
        'rank-id',
        updateRankRequest,
      )

      expect(result).toStrictEqual(AppResult.failed(e))
    })
  })

  describe('deleteRank', () => {
    it('calls DeleteRankUseCase once', async () => {
      await rankController.deleteRank(user, 'id')

      expect(deleteRankUseCase.execute).toHaveBeenCalledExactlyOnceWith('id')
    })

    it('should return undefined when DeleteRankUseCase succeeds', async () => {
      const result = await rankController.deleteRank(user, 'id')

      expect(result).toBeUndefined()
    })

    it('should return failed when DeleteRankUseCase fails', async () => {
      const e = AppException.test()
      vi.spyOn(deleteRankUseCase, 'execute').mockResolvedValueOnce(
        AppResult.failed(e),
      )

      const result = await rankController.deleteRank(user, 'id')

      expect(result).toStrictEqual(AppResult.failed(e))
    })
  })
})
