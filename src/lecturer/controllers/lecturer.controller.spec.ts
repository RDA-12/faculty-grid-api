import { Test } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { User } from '../../user/entities/user.entity.js'
import {
  AcademicDegree,
  EmploymentStatus,
  Lecturer,
} from '../entities/lecturer.entity.js'
import { LecturerController } from './lecturer.controller.js'
import {
  CreateLecturerDTO,
  LecturerOut,
  LecturersQuery,
  UpdateLecturerDTO,
} from './lecturer.dto.js'
import {
  CreateLecturerParams,
  CreateLecturerUseCase,
} from '../use-cases/create-lecturer.use-case.js'
import {
  GetLecturersParams,
  GetLecturersUseCase,
} from '../use-cases/get-lecturers.use-case.js'
import { GetLecturerByIdUseCase } from '../use-cases/get-lecturer-by-id.use-case.js'
import {
  UpdateLecturerParams,
  UpdateLecturerUseCase,
} from '../use-cases/update-lecturer.use-case.js'
import { DeleteLecturerUseCase } from '../use-cases/delete-lecturer.use-case.js'
import { AppResult } from '../../common/app-result.js'
import { AppException } from '../../common/app-exception.js'
import {
  PaginatedResult,
  Pagination,
  PaginationResult,
} from '../../common/pagination.js'

describe('LecturerController', () => {
  const user = new User({
    id: 'user-id',
    name: 'Admin',
    email: 'admin@example.com',
  })
  const lecturer = new Lecturer({
    id: 'lecturer-id',
    name: 'Budi Santoso',
    displayName: 'Dr. Budi Santoso, S.T., M.T.',
    programId: 'program-id',
    employmentStatus: EmploymentStatus.asn,
    rankId: 'rank-id',
    functionalRankId: 'functional-rank-id',
    academicDegree: AcademicDegree.doctorate,
  })
  const paginatedResult = new PaginatedResult({
    data: [lecturer],
    pagination: new PaginationResult({
      total: 10,
      page: 1,
      pageSize: 10,
    }),
  })
  const lecturerOut = LecturerOut.fromLecturer(lecturer)

  let createLecturerUseCase: { execute: ReturnType<typeof vi.fn> }
  let getLecturersUseCase: { execute: ReturnType<typeof vi.fn> }
  let getLecturerByIdUseCase: { execute: ReturnType<typeof vi.fn> }
  let updateLecturerUseCase: { execute: ReturnType<typeof vi.fn> }
  let deleteLecturerUseCase: { execute: ReturnType<typeof vi.fn> }
  let lecturerController: LecturerController

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [LecturerController],
      providers: [
        {
          provide: CreateLecturerUseCase,
          useValue: {
            execute: vi.fn().mockResolvedValue(AppResult.success(lecturer)),
          },
        },
        {
          provide: GetLecturersUseCase,
          useValue: {
            execute: vi
              .fn()
              .mockResolvedValue(AppResult.success(paginatedResult)),
          },
        },
        {
          provide: GetLecturerByIdUseCase,
          useValue: {
            execute: vi.fn().mockResolvedValue(AppResult.success(lecturer)),
          },
        },
        {
          provide: UpdateLecturerUseCase,
          useValue: {
            execute: vi.fn().mockResolvedValue(AppResult.success(lecturer)),
          },
        },
        {
          provide: DeleteLecturerUseCase,
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

    createLecturerUseCase = moduleRef.get(CreateLecturerUseCase)
    getLecturersUseCase = moduleRef.get(GetLecturersUseCase)
    getLecturerByIdUseCase = moduleRef.get(GetLecturerByIdUseCase)
    updateLecturerUseCase = moduleRef.get(UpdateLecturerUseCase)
    deleteLecturerUseCase = moduleRef.get(DeleteLecturerUseCase)

    lecturerController = moduleRef.get(LecturerController)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('createLecturer', () => {
    const createRequest = new CreateLecturerDTO({
      name: 'Budi Santoso',
      displayName: 'Dr. Budi Santoso, S.T., M.T.',
      programId: 'program-id',
      employmentStatus: EmploymentStatus.asn,
      rankId: 'rank-id',
      functionalRankId: 'functional-rank-id',
      academicDegree: AcademicDegree.doctorate,
    })
    const params = new CreateLecturerParams({
      name: createRequest.name,
      displayName: createRequest.displayName,
      programId: createRequest.programId,
      employmentStatus: createRequest.employmentStatus,
      rankId: createRequest.rankId,
      functionalRankId: createRequest.functionalRankId,
      academicDegree: createRequest.academicDegree,
      createdBy: user.id,
    })

    it('calls CreateLecturerUseCase once', async () => {
      await lecturerController.createLecturer(user, createRequest)

      expect(createLecturerUseCase.execute).toHaveBeenCalledExactlyOnceWith(
        params,
      )
    })

    it('should return LecturerOut when CreateLecturerUseCase succeeds', async () => {
      const result = await lecturerController.createLecturer(
        user,
        createRequest,
      )

      expect(result).toStrictEqual(AppResult.success(lecturerOut))
    })

    it('should return failed when CreateLecturerUseCase fails', async () => {
      const e = AppException.test()
      vi.spyOn(createLecturerUseCase, 'execute').mockResolvedValueOnce(
        AppResult.failed(e),
      )

      const result = await lecturerController.createLecturer(
        user,
        createRequest,
      )

      expect(result).toStrictEqual(AppResult.failed(e))
    })
  })

  describe('getLecturers', () => {
    it('calls GetLecturersUseCase once with defaults', async () => {
      await lecturerController.getLecturers(user)

      expect(getLecturersUseCase.execute).toHaveBeenCalledExactlyOnceWith(
        new Pagination({}),
      )
    })

    it('calls GetLecturersUseCase once with filters', async () => {
      const query = new LecturersQuery({
        programId: 'program-id',
        employmentStatus: EmploymentStatus.military,
        rankId: 'rank-id',
        functionalRankId: 'functional-rank-id',
        academicDegree: AcademicDegree.master,
        search: 'Budi',
      })

      await lecturerController.getLecturers(user, query)

      expect(getLecturersUseCase.execute).toHaveBeenCalledExactlyOnceWith(
        new GetLecturersParams({
          programId: query.programId,
          employmentStatus: query.employmentStatus,
          rankId: query.rankId,
          functionalRankId: query.functionalRankId,
          academicDegree: query.academicDegree,
          search: query.search,
        }),
      )
    })

    it('should return paginated LecturerOut when GetLecturersUseCase succeeds', async () => {
      const result = await lecturerController.getLecturers(user)

      expect(result).toStrictEqual(
        AppResult.success(
          paginatedResult.mapData((it) => LecturerOut.fromLecturer(it)),
        ),
      )
    })

    it('should return failed when GetLecturersUseCase fails', async () => {
      const e = AppException.test()
      vi.spyOn(getLecturersUseCase, 'execute').mockResolvedValueOnce(
        AppResult.failed(e),
      )

      const result = await lecturerController.getLecturers(user)

      expect(result).toStrictEqual(AppResult.failed(e))
    })
  })

  describe('getLecturerById', () => {
    it('calls GetLecturerByIdUseCase once', async () => {
      await lecturerController.getLecturerById(user, 'lecturer-id')

      expect(getLecturerByIdUseCase.execute).toHaveBeenCalledExactlyOnceWith(
        'lecturer-id',
      )
    })

    it('should return LecturerOut when GetLecturerByIdUseCase succeeds', async () => {
      const result = await lecturerController.getLecturerById(
        user,
        'lecturer-id',
      )

      expect(result).toStrictEqual(AppResult.success(lecturerOut))
    })

    it('should return failed when GetLecturerByIdUseCase fails', async () => {
      const e = AppException.test()
      vi.spyOn(getLecturerByIdUseCase, 'execute').mockResolvedValueOnce(
        AppResult.failed(e),
      )

      const result = await lecturerController.getLecturerById(
        user,
        'lecturer-id',
      )

      expect(result).toStrictEqual(AppResult.failed(e))
    })
  })

  describe('updateLecturer', () => {
    const updateRequest = new UpdateLecturerDTO({
      name: 'Budi Santoso',
      displayName: 'Budi Santoso, M.T.',
      programId: 'program-id',
      employmentStatus: EmploymentStatus.contract,
      rankId: null,
      functionalRankId: null,
      academicDegree: AcademicDegree.master,
    })
    const params = new UpdateLecturerParams({
      id: 'lecturer-id',
      name: updateRequest.name,
      displayName: updateRequest.displayName,
      programId: updateRequest.programId,
      employmentStatus: updateRequest.employmentStatus,
      rankId: null,
      functionalRankId: null,
      academicDegree: updateRequest.academicDegree,
    })

    it('calls UpdateLecturerUseCase once', async () => {
      await lecturerController.updateLecturer(
        user,
        'lecturer-id',
        updateRequest,
      )

      expect(updateLecturerUseCase.execute).toHaveBeenCalledExactlyOnceWith(
        params,
      )
    })

    it('should return LecturerOut when UpdateLecturerUseCase succeeds', async () => {
      const result = await lecturerController.updateLecturer(
        user,
        'lecturer-id',
        updateRequest,
      )

      expect(result).toStrictEqual(AppResult.success(lecturerOut))
    })

    it('should return failed when UpdateLecturerUseCase fails', async () => {
      const e = AppException.test()
      vi.spyOn(updateLecturerUseCase, 'execute').mockResolvedValueOnce(
        AppResult.failed(e),
      )

      const result = await lecturerController.updateLecturer(
        user,
        'lecturer-id',
        updateRequest,
      )

      expect(result).toStrictEqual(AppResult.failed(e))
    })
  })

  describe('deleteLecturer', () => {
    it('calls DeleteLecturerUseCase once', async () => {
      await lecturerController.deleteLecturer(user, 'id')

      expect(deleteLecturerUseCase.execute).toHaveBeenCalledExactlyOnceWith(
        'id',
      )
    })

    it('should return undefined when DeleteLecturerUseCase succeeds', async () => {
      const result = await lecturerController.deleteLecturer(user, 'id')

      expect(result).toBeUndefined()
    })

    it('should return failed when DeleteLecturerUseCase fails', async () => {
      const e = AppException.test()
      vi.spyOn(deleteLecturerUseCase, 'execute').mockResolvedValueOnce(
        AppResult.failed(e),
      )

      const result = await lecturerController.deleteLecturer(user, 'id')

      expect(result).toStrictEqual(AppResult.failed(e))
    })
  })
})
