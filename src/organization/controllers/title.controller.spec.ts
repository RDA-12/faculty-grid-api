import { Test } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { User } from '../../user/entities/user.entity.js'
import { Title, TitleScope } from '../entities/title.entity.js'
import { TitleController } from './title.controller.js'
import {
  CreateTitleDTO,
  TitleOut,
  TitlesQuery,
  UpdateTitleDTO,
} from './title.dto.js'
import {
  CreateTitleParams,
  CreateTitleUseCase,
} from '../user-cases/create-title.use-case.js'
import {
  GetTitlesParams,
  GetTitlesUseCase,
} from '../user-cases/get-titles.use-case.js'
import { GetTitleByIdUseCase } from '../user-cases/get-title-by-id.use-case.js'
import {
  UpdateTitleParams,
  UpdateTitleUseCase,
} from '../user-cases/update-title.use-case.js'
import { DeleteTitleUseCase } from '../user-cases/delete-title.use-case.js'
import { AppResult } from '../../common/app-result.js'
import { AppException } from '../../common/app-exception.js'
import {
  PaginatedResult,
  Pagination,
  PaginationResult,
} from '../../common/pagination.js'

describe('TitleController', () => {
  const user = new User({
    id: 'id',
    name: 'name',
    email: 'email',
  })
  const title = new Title({
    id: 'title-id',
    name: 'Dean',
    scope: TitleScope.faculty,
  })
  const paginatedResult = new PaginatedResult({
    data: [title],
    pagination: new PaginationResult({
      total: 10,
      page: 1,
      pageSize: 10,
    }),
  })
  const titleOut = TitleOut.fromTitle(title)
  let createTitleUseCase: { execute: ReturnType<typeof vi.fn> }
  let getTitlesUseCase: { execute: ReturnType<typeof vi.fn> }
  let getTitleByIdUseCase: { execute: ReturnType<typeof vi.fn> }
  let updateTitleUseCase: { execute: ReturnType<typeof vi.fn> }
  let deleteTitleUseCase: { execute: ReturnType<typeof vi.fn> }
  let titleController: TitleController

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [TitleController],
      providers: [
        {
          provide: CreateTitleUseCase,
          useValue: {
            execute: vi.fn().mockResolvedValue(AppResult.success(title)),
          },
        },
        {
          provide: GetTitlesUseCase,
          useValue: {
            execute: vi
              .fn()
              .mockResolvedValue(AppResult.success(paginatedResult)),
          },
        },
        {
          provide: GetTitleByIdUseCase,
          useValue: {
            execute: vi.fn().mockResolvedValue(AppResult.success(title)),
          },
        },
        {
          provide: UpdateTitleUseCase,
          useValue: {
            execute: vi.fn().mockResolvedValue(AppResult.success(title)),
          },
        },
        {
          provide: DeleteTitleUseCase,
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

    createTitleUseCase = moduleRef.get(CreateTitleUseCase)
    getTitlesUseCase = moduleRef.get(GetTitlesUseCase)
    getTitleByIdUseCase = moduleRef.get(GetTitleByIdUseCase)
    updateTitleUseCase = moduleRef.get(UpdateTitleUseCase)
    deleteTitleUseCase = moduleRef.get(DeleteTitleUseCase)

    titleController = moduleRef.get(TitleController)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('createTitle', () => {
    const createTitleRequest = new CreateTitleDTO({
      name: 'Dean',
      scope: TitleScope.faculty,
    })
    const params = new CreateTitleParams({
      name: createTitleRequest.name,
      scope: createTitleRequest.scope,
      createdBy: user.id,
    })

    it('calls CreateTitleUseCase once', async () => {
      await titleController.createTitle(user, createTitleRequest)

      expect(createTitleUseCase.execute).toHaveBeenCalledExactlyOnceWith(params)
    })

    it('should return TitleOut when CreateTitleUseCase succeeds', async () => {
      const result = await titleController.createTitle(user, createTitleRequest)

      expect(result).toStrictEqual(AppResult.success(titleOut))
    })

    it('should return failed when CreateTitleUseCase fails', async () => {
      const e = AppException.test()
      vi.spyOn(createTitleUseCase, 'execute').mockResolvedValueOnce(
        AppResult.failed(e),
      )

      const result = await titleController.createTitle(user, createTitleRequest)

      expect(result).toStrictEqual(AppResult.failed(e))
    })
  })

  describe('getTitles', () => {
    it('calls GetTitlesUseCase once with defaults', async () => {
      await titleController.getTitles(user)

      expect(getTitlesUseCase.execute).toHaveBeenCalledExactlyOnceWith(
        new Pagination({}),
      )
    })

    it('calls GetTitlesUseCase once with pagination', async () => {
      const pagination = new Pagination({ page: 2 })

      await titleController.getTitles(user, pagination)

      expect(getTitlesUseCase.execute).toHaveBeenCalledExactlyOnceWith(
        pagination,
      )
    })

    it('calls GetTitlesUseCase once with scope filter', async () => {
      const query = new TitlesQuery({ scope: TitleScope.program })

      await titleController.getTitles(user, query)

      expect(getTitlesUseCase.execute).toHaveBeenCalledExactlyOnceWith(
        new GetTitlesParams({ scope: query.scope }),
      )
    })

    it('calls GetTitlesUseCase once with search filter', async () => {
      const query = new TitlesQuery({ search: 'Dean' })

      await titleController.getTitles(user, query)

      expect(getTitlesUseCase.execute).toHaveBeenCalledExactlyOnceWith(
        new GetTitlesParams({ search: query.search }),
      )
    })

    it('should return paginated TitleOut when GetTitlesUseCase succeeds', async () => {
      const result = await titleController.getTitles(user)

      expect(result).toStrictEqual(
        AppResult.success(
          paginatedResult.mapData((it) => TitleOut.fromTitle(it)),
        ),
      )
    })

    it('should return failed when GetTitlesUseCase fails', async () => {
      const e = AppException.test()
      vi.spyOn(getTitlesUseCase, 'execute').mockResolvedValueOnce(
        AppResult.failed(e),
      )

      const result = await titleController.getTitles(user)

      expect(result).toStrictEqual(AppResult.failed(e))
    })
  })

  describe('getTitleById', () => {
    it('calls GetTitleByIdUseCase once', async () => {
      await titleController.getTitleById(user, 'title-id')

      expect(getTitleByIdUseCase.execute).toHaveBeenCalledExactlyOnceWith(
        'title-id',
      )
    })

    it('should return TitleOut when GetTitleByIdUseCase succeeds', async () => {
      const result = await titleController.getTitleById(user, 'title-id')

      expect(result).toStrictEqual(AppResult.success(titleOut))
    })

    it('should return failed when GetTitleByIdUseCase fails', async () => {
      const e = AppException.test()
      vi.spyOn(getTitleByIdUseCase, 'execute').mockResolvedValueOnce(
        AppResult.failed(e),
      )

      const result = await titleController.getTitleById(user, 'title-id')

      expect(result).toStrictEqual(AppResult.failed(e))
    })
  })

  describe('updateTitle', () => {
    const updateTitleRequest = new UpdateTitleDTO({
      name: 'Head of Program',
      scope: TitleScope.program,
    })
    const params = new UpdateTitleParams({
      id: 'title-id',
      name: updateTitleRequest.name,
      scope: updateTitleRequest.scope,
    })

    it('calls UpdateTitleUseCase once', async () => {
      await titleController.updateTitle(user, 'title-id', updateTitleRequest)

      expect(updateTitleUseCase.execute).toHaveBeenCalledExactlyOnceWith(params)
    })

    it('should return TitleOut when UpdateTitleUseCase succeeds', async () => {
      const result = await titleController.updateTitle(
        user,
        'title-id',
        updateTitleRequest,
      )

      expect(result).toStrictEqual(AppResult.success(titleOut))
    })

    it('should return failed when UpdateTitleUseCase fails', async () => {
      const e = AppException.test()
      vi.spyOn(updateTitleUseCase, 'execute').mockResolvedValueOnce(
        AppResult.failed(e),
      )

      const result = await titleController.updateTitle(
        user,
        'title-id',
        updateTitleRequest,
      )

      expect(result).toStrictEqual(AppResult.failed(e))
    })
  })

  describe('deleteTitle', () => {
    it('calls DeleteTitleUseCase once', async () => {
      await titleController.deleteTitle(user, 'id')

      expect(deleteTitleUseCase.execute).toHaveBeenCalledExactlyOnceWith('id')
    })

    it('should return undefined when DeleteTitleUseCase succeeds', async () => {
      const result = await titleController.deleteTitle(user, 'id')

      expect(result).toBeUndefined()
    })

    it('should return failed when DeleteTitleUseCase fails', async () => {
      const e = AppException.test()
      vi.spyOn(deleteTitleUseCase, 'execute').mockResolvedValueOnce(
        AppResult.failed(e),
      )

      const result = await titleController.deleteTitle(user, 'id')

      expect(result).toStrictEqual(AppResult.failed(e))
    })
  })
})
