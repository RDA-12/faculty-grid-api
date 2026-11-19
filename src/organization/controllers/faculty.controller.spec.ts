import { Test } from '@nestjs/testing'
import { AppResult } from '../../common/app-result.js'
import { AppException } from '../../common/app-exception.js'
import { User } from '../../user/entities/user.entity.js'
import { ConfigService } from '@nestjs/config'
import { Faculty } from '../entities/faculty.entity.js'
import { CreateFacultyDTO, FacultyOut } from './faculty.dto.js'
import {
  CreateFacultyParams,
  CreateFacultyUseCase,
} from '../user-cases/create-faculty.use-case.js'
import { FacultyController } from './faculty.controller.js'

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
  let createFacultyUseCase: { execute: ReturnType<typeof vi.fn> }
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
          provide: ConfigService,
          useValue: {},
        },
      ],
    }).compile()

    createFacultyUseCase = moduleRef.get(CreateFacultyUseCase)

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
})
