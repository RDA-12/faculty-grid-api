import { Test } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { User } from '../../user/entities/user.entity.js'
import { LecturerTitle } from '../entities/lecturer-title.entity.js'
import { LecturerTitleController } from './lecturer-title.controller.js'
import {
  CreateLecturerTitleDTO,
  LecturerTitleOut,
  LecturerTitlesQuery,
  UpdateLecturerTitleDTO,
} from './lecturer-title.dto.js'
import {
  CreateLecturerTitleParams,
  CreateLecturerTitleUseCase,
} from '../use-cases/create-lecturer-title.use-case.js'
import {
  GetLecturerTitlesParams,
  GetLecturerTitlesUseCase,
} from '../use-cases/get-lecturer-titles.use-case.js'
import { GetLecturerTitleByIdUseCase } from '../use-cases/get-lecturer-title-by-id.use-case.js'
import {
  UpdateLecturerTitleParams,
  UpdateLecturerTitleUseCase,
} from '../use-cases/update-lecturer-title.use-case.js'
import { DeleteLecturerTitleUseCase } from '../use-cases/delete-lecturer-title.use-case.js'
import { AppResult } from '../../common/app-result.js'
import { AppException } from '../../common/app-exception.js'
import {
  PaginatedResult,
  Pagination,
  PaginationResult,
} from '../../common/pagination.js'

describe('LecturerTitleController', () => {
  const user = new User({
    id: 'user-id',
    name: 'Admin',
    email: 'admin@example.com',
  })
  const assignment = new LecturerTitle({
    id: 'assignment-id',
    lecturerId: 'lecturer-id',
    titleId: 'title-id',
    facultyId: 'faculty-id',
    programId: null,
    startDate: '2026-01-01',
    endDate: null,
  })
  const paginatedResult = new PaginatedResult({
    data: [assignment],
    pagination: new PaginationResult({
      total: 10,
      page: 1,
      pageSize: 10,
    }),
  })
  const assignmentOut = LecturerTitleOut.fromLecturerTitle(assignment)

  let createLecturerTitleUseCase: { execute: ReturnType<typeof vi.fn> }
  let getLecturerTitlesUseCase: { execute: ReturnType<typeof vi.fn> }
  let getLecturerTitleByIdUseCase: { execute: ReturnType<typeof vi.fn> }
  let updateLecturerTitleUseCase: { execute: ReturnType<typeof vi.fn> }
  let deleteLecturerTitleUseCase: { execute: ReturnType<typeof vi.fn> }
  let lecturerTitleController: LecturerTitleController

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [LecturerTitleController],
      providers: [
        {
          provide: CreateLecturerTitleUseCase,
          useValue: {
            execute: vi.fn().mockResolvedValue(AppResult.success(assignment)),
          },
        },
        {
          provide: GetLecturerTitlesUseCase,
          useValue: {
            execute: vi
              .fn()
              .mockResolvedValue(AppResult.success(paginatedResult)),
          },
        },
        {
          provide: GetLecturerTitleByIdUseCase,
          useValue: {
            execute: vi.fn().mockResolvedValue(AppResult.success(assignment)),
          },
        },
        {
          provide: UpdateLecturerTitleUseCase,
          useValue: {
            execute: vi.fn().mockResolvedValue(AppResult.success(assignment)),
          },
        },
        {
          provide: DeleteLecturerTitleUseCase,
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

    createLecturerTitleUseCase = moduleRef.get(CreateLecturerTitleUseCase)
    getLecturerTitlesUseCase = moduleRef.get(GetLecturerTitlesUseCase)
    getLecturerTitleByIdUseCase = moduleRef.get(GetLecturerTitleByIdUseCase)
    updateLecturerTitleUseCase = moduleRef.get(UpdateLecturerTitleUseCase)
    deleteLecturerTitleUseCase = moduleRef.get(DeleteLecturerTitleUseCase)

    lecturerTitleController = moduleRef.get(LecturerTitleController)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('createLecturerTitle', () => {
    const createRequest = new CreateLecturerTitleDTO({
      lecturerId: 'lecturer-id',
      titleId: 'title-id',
      facultyId: 'faculty-id',
      startDate: '2026-01-01',
    })
    const params = new CreateLecturerTitleParams({
      lecturerId: createRequest.lecturerId,
      titleId: createRequest.titleId,
      facultyId: createRequest.facultyId,
      programId: null,
      startDate: createRequest.startDate,
      endDate: null,
      createdBy: user.id,
    })

    it('calls CreateLecturerTitleUseCase once', async () => {
      await lecturerTitleController.createLecturerTitle(user, createRequest)

      expect(
        createLecturerTitleUseCase.execute,
      ).toHaveBeenCalledExactlyOnceWith(params)
    })

    it('should return LecturerTitleOut when CreateLecturerTitleUseCase succeeds', async () => {
      const result = await lecturerTitleController.createLecturerTitle(
        user,
        createRequest,
      )

      expect(result).toStrictEqual(AppResult.success(assignmentOut))
    })

    it('should return failed when CreateLecturerTitleUseCase fails', async () => {
      const e = AppException.test()
      vi.spyOn(createLecturerTitleUseCase, 'execute').mockResolvedValueOnce(
        AppResult.failed(e),
      )

      const result = await lecturerTitleController.createLecturerTitle(
        user,
        createRequest,
      )

      expect(result).toStrictEqual(AppResult.failed(e))
    })
  })

  describe('getLecturerTitles', () => {
    it('calls GetLecturerTitlesUseCase once with defaults', async () => {
      await lecturerTitleController.getLecturerTitles(user)

      expect(getLecturerTitlesUseCase.execute).toHaveBeenCalledExactlyOnceWith(
        new Pagination({}),
      )
    })

    it('calls GetLecturerTitlesUseCase once with filters', async () => {
      const query = new LecturerTitlesQuery({
        lecturerId: 'lecturer-id',
        titleId: 'title-id',
        facultyId: 'faculty-id',
        programId: 'program-id',
        activeOnly: true,
      })

      await lecturerTitleController.getLecturerTitles(user, query)

      expect(getLecturerTitlesUseCase.execute).toHaveBeenCalledExactlyOnceWith(
        new GetLecturerTitlesParams({
          lecturerId: query.lecturerId,
          titleId: query.titleId,
          facultyId: query.facultyId,
          programId: query.programId,
          activeOnly: query.activeOnly,
        }),
      )
    })

    it('should return paginated LecturerTitleOut when GetLecturerTitlesUseCase succeeds', async () => {
      const result = await lecturerTitleController.getLecturerTitles(user)

      expect(result).toStrictEqual(
        AppResult.success(
          paginatedResult.mapData((it) =>
            LecturerTitleOut.fromLecturerTitle(it),
          ),
        ),
      )
    })

    it('should return failed when GetLecturerTitlesUseCase fails', async () => {
      const e = AppException.test()
      vi.spyOn(getLecturerTitlesUseCase, 'execute').mockResolvedValueOnce(
        AppResult.failed(e),
      )

      const result = await lecturerTitleController.getLecturerTitles(user)

      expect(result).toStrictEqual(AppResult.failed(e))
    })
  })

  describe('getLecturerTitleById', () => {
    it('calls GetLecturerTitleByIdUseCase once', async () => {
      await lecturerTitleController.getLecturerTitleById(user, 'assignment-id')

      expect(
        getLecturerTitleByIdUseCase.execute,
      ).toHaveBeenCalledExactlyOnceWith('assignment-id')
    })

    it('should return LecturerTitleOut when GetLecturerTitleByIdUseCase succeeds', async () => {
      const result = await lecturerTitleController.getLecturerTitleById(
        user,
        'assignment-id',
      )

      expect(result).toStrictEqual(AppResult.success(assignmentOut))
    })

    it('should return failed when GetLecturerTitleByIdUseCase fails', async () => {
      const e = AppException.test()
      vi.spyOn(getLecturerTitleByIdUseCase, 'execute').mockResolvedValueOnce(
        AppResult.failed(e),
      )

      const result = await lecturerTitleController.getLecturerTitleById(
        user,
        'assignment-id',
      )

      expect(result).toStrictEqual(AppResult.failed(e))
    })
  })

  describe('updateLecturerTitle', () => {
    const updateRequest = new UpdateLecturerTitleDTO({
      lecturerId: 'lecturer-id',
      titleId: 'title-id',
      facultyId: 'faculty-id',
      startDate: '2026-01-01',
      endDate: '2027-01-01',
    })
    const params = new UpdateLecturerTitleParams({
      id: 'assignment-id',
      lecturerId: updateRequest.lecturerId,
      titleId: updateRequest.titleId,
      facultyId: updateRequest.facultyId,
      programId: null,
      startDate: updateRequest.startDate,
      endDate: updateRequest.endDate,
    })

    it('calls UpdateLecturerTitleUseCase once', async () => {
      await lecturerTitleController.updateLecturerTitle(
        user,
        'assignment-id',
        updateRequest,
      )

      expect(
        updateLecturerTitleUseCase.execute,
      ).toHaveBeenCalledExactlyOnceWith(params)
    })

    it('should return LecturerTitleOut when UpdateLecturerTitleUseCase succeeds', async () => {
      const result = await lecturerTitleController.updateLecturerTitle(
        user,
        'assignment-id',
        updateRequest,
      )

      expect(result).toStrictEqual(AppResult.success(assignmentOut))
    })

    it('should return failed when UpdateLecturerTitleUseCase fails', async () => {
      const e = AppException.test()
      vi.spyOn(updateLecturerTitleUseCase, 'execute').mockResolvedValueOnce(
        AppResult.failed(e),
      )

      const result = await lecturerTitleController.updateLecturerTitle(
        user,
        'assignment-id',
        updateRequest,
      )

      expect(result).toStrictEqual(AppResult.failed(e))
    })
  })

  describe('deleteLecturerTitle', () => {
    it('calls DeleteLecturerTitleUseCase once', async () => {
      await lecturerTitleController.deleteLecturerTitle(user, 'id')

      expect(
        deleteLecturerTitleUseCase.execute,
      ).toHaveBeenCalledExactlyOnceWith('id')
    })

    it('should return undefined when DeleteLecturerTitleUseCase succeeds', async () => {
      const result = await lecturerTitleController.deleteLecturerTitle(
        user,
        'id',
      )

      expect(result).toBeUndefined()
    })

    it('should return failed when DeleteLecturerTitleUseCase fails', async () => {
      const e = AppException.test()
      vi.spyOn(deleteLecturerTitleUseCase, 'execute').mockResolvedValueOnce(
        AppResult.failed(e),
      )

      const result = await lecturerTitleController.deleteLecturerTitle(
        user,
        'id',
      )

      expect(result).toStrictEqual(AppResult.failed(e))
    })
  })
})
