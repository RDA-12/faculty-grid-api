import { Test } from '@nestjs/testing'
import { AppResult } from '../../common/app-result.js'
import { AppException } from '../../common/app-exception.js'
import { User } from '../../user/entities/user.entity.js'
import { ConfigService } from '@nestjs/config'
import { Faculty } from '../entities/faculty.entity.js'
import {
  CreateFacultyDTO,
  FacultyOut,
  GetFacultiesQuery,
} from './faculty.dto.js'
import {
  CreateFacultyParams,
  CreateFacultyUseCase,
} from '../user-cases/create-faculty.use-case.js'
import { FacultyController } from './faculty.controller.js'
import {
  GetFacultiesParams,
  GetFacultiesUseCase,
} from '../user-cases/get-faculties.use-case.js'
import { DeleteFacultyUseCase } from '../user-cases/delete-faculty.use-case.js'
import {
  PaginatedResult,
  Pagination,
  PaginationResult,
} from '../../common/pagination.js'

describe('FacultyController', () => {
  const user = new User({
    id: 'id',
    name: 'name',
    email: 'email',
  })
  const faculty = new Faculty({
    id: 'faculty-id',
    name: 'faculty name',
  })
  const facultyOut = FacultyOut.fromFaculty(faculty)
  const paginatedResult = new PaginatedResult({
    data: [faculty],
    pagination: new PaginationResult({
      total: 10,
      page: 1,
      pageSize: 0,
    }),
  })
  let createFacultyUseCase: { execute: ReturnType<typeof vi.fn> }
  let getFacultiesUseCase: { execute: ReturnType<typeof vi.fn> }
  let deleteFacultyUseCase: { execute: ReturnType<typeof vi.fn> }
  let facultyController: FacultyController

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [FacultyController],
      providers: [
        {
          provide: CreateFacultyUseCase,
          useValue: {
            execute: vi.fn().mockResolvedValue(AppResult.success(faculty)),
          },
        },
        {
          provide: GetFacultiesUseCase,
          useValue: {
            execute: vi
              .fn()
              .mockResolvedValue(AppResult.success(paginatedResult)),
          },
        },
        {
          provide: DeleteFacultyUseCase,
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

    createFacultyUseCase = moduleRef.get(CreateFacultyUseCase)
    getFacultiesUseCase = moduleRef.get(GetFacultiesUseCase)
    deleteFacultyUseCase = moduleRef.get(DeleteFacultyUseCase)

    facultyController = moduleRef.get(FacultyController)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('createFaculty', () => {
    const createFacultyRequest = new CreateFacultyDTO()
    createFacultyRequest.name = faculty.name
    const params = new CreateFacultyParams({
      name: createFacultyRequest.name,
      user: user,
    })

    it('calls CreateFacultyUseCase once', async () => {
      await facultyController.creatFaculty(user, createFacultyRequest)

      expect(createFacultyUseCase.execute).toHaveBeenCalledExactlyOnceWith(
        params,
      )
    })

    it('should return correct user when CreateFacultyUseCase success', async () => {
      const result = await facultyController.creatFaculty(
        user,
        createFacultyRequest,
      )

      expect(result).toStrictEqual(AppResult.success(facultyOut))
    })

    it('should returns failed when CreateFacultyUseCase failed', async () => {
      const e = AppException.test()
      vi.spyOn(createFacultyUseCase, 'execute').mockResolvedValueOnce(
        AppResult.failed(e),
      )

      const result = await facultyController.creatFaculty(
        user,
        createFacultyRequest,
      )

      expect(result).toStrictEqual(AppResult.failed(e))
    })
  })

  describe('getFaculties', () => {
    it('calls GetFacultiesUseCase once', async () => {
      await facultyController.getFaculties(user)

      expect(getFacultiesUseCase.execute).toHaveBeenCalledExactlyOnceWith(
        new Pagination({}),
      )
    })

    it('calls GetFacultiesUseCase once with pagination', async () => {
      const pagination = new Pagination({ page: 10 })

      await facultyController.getFaculties(user, pagination)

      expect(getFacultiesUseCase.execute).toHaveBeenCalledExactlyOnceWith(
        pagination,
      )
    })

    it('should return correct faculties when GetFacultiesUseCase success', async () => {
      const result = await facultyController.getFaculties(user)

      expect(result).toStrictEqual(
        AppResult.success(
          paginatedResult.mapData((it) => FacultyOut.fromFaculty(it)),
        ),
      )
    })

    it('should returns failed when GetFacultiesUseCase failed', async () => {
      const e = AppException.test()
      vi.spyOn(getFacultiesUseCase, 'execute').mockResolvedValueOnce(
        AppResult.failed(e),
      )

      const result = await facultyController.getFaculties(user)

      expect(result).toStrictEqual(AppResult.failed(e))
    })

    it('should calls GetFacultiesUseCase once with search query', async () => {
      const query = new GetFacultiesQuery({ search: 'search' })

      await facultyController.getFaculties(user, query)

      expect(getFacultiesUseCase.execute).toHaveBeenCalledExactlyOnceWith(
        new GetFacultiesParams({ search: 'search' }),
      )
    })
  })

  describe('deleteFaculty', () => {
    it('calls DeleteFacultyUseCase once', async () => {
      await facultyController.deleteFaculty(user, 'id')

      expect(deleteFacultyUseCase.execute).toHaveBeenCalledExactlyOnceWith('id')
    })

    it('should return undefined when DeleteFacultyUseCase success', async () => {
      const result = await facultyController.deleteFaculty(user, 'id')

      expect(result).toBeUndefined()
    })

    it('should returns failed when DeleteFacultyUseCase failed', async () => {
      const e = AppException.test()
      vi.spyOn(deleteFacultyUseCase, 'execute').mockResolvedValueOnce(
        AppResult.failed(e),
      )

      const result = await facultyController.deleteFaculty(user, 'id')

      expect(result).toStrictEqual(AppResult.failed(e))
    })
  })
})
