import { Test } from '@nestjs/testing'
import { User } from '../../user/entities/user.entity.js'
import { Program, ProgramDegreeLevel } from '../entities/program.entity.js'
import { ProgramController } from './program.controller.js'
import { CreateProgramDTO, ProgramOut, ProgramsQuery } from './program.dto.js'
import {
  CreateProgramParams,
  CreateProgramUseCase,
} from '../user-cases/create-program.use-case.js'
import { AppResult } from '../../common/app-result.js'
import { ConfigService } from '@nestjs/config'
import { AppException } from '../../common/app-exception.js'
import {
  PaginatedResult,
  Pagination,
  PaginationResult,
} from '../../common/pagination.js'
import {
  GetProgramsParams,
  GetProgramsUseCase,
} from '../user-cases/get-programs.use-case.js'
import { DeleteProgramUseCase } from '../user-cases/delete-program.use-case.js'

describe('ProgramController', () => {
  const user = new User({
    id: 'id',
    name: 'name',
    email: 'email',
  })
  const program = new Program({
    id: 'program-id',
    name: 'program name',
    degreeLevel: ProgramDegreeLevel.bachelor,
    facultyId: 'facultyId',
  })
  const paginatedResult = new PaginatedResult({
    data: [program],
    pagination: new PaginationResult({
      total: 10,
      page: 1,
      pageSize: 0,
    }),
  })
  const programOut = ProgramOut.fromProgram(program)
  let createProgramUseCase: { execute: ReturnType<typeof vi.fn> }
  let getProgramsUseCase: { execute: ReturnType<typeof vi.fn> }
  let deleteProgramUseCase: { execute: ReturnType<typeof vi.fn> }
  let programController: ProgramController

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ProgramController],
      providers: [
        {
          provide: CreateProgramUseCase,
          useValue: {
            execute: vi.fn().mockResolvedValue(AppResult.success(program)),
          },
        },
        {
          provide: GetProgramsUseCase,
          useValue: {
            execute: vi
              .fn()
              .mockResolvedValue(AppResult.success(paginatedResult)),
          },
        },
        {
          provide: DeleteProgramUseCase,
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

    createProgramUseCase = moduleRef.get(CreateProgramUseCase)
    getProgramsUseCase = moduleRef.get(GetProgramsUseCase)
    deleteProgramUseCase = moduleRef.get(DeleteProgramUseCase)

    programController = moduleRef.get(ProgramController)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('createProgram', () => {
    const createProgramRequest = new CreateProgramDTO({
      name: 'new program',
      degreeLevel: ProgramDegreeLevel.bachelor,
      facultyId: 'facultyId',
    })
    const params = new CreateProgramParams({
      name: createProgramRequest.name,
      degreeLevel: createProgramRequest.degreeLevel,
      facultyId: createProgramRequest.facultyId,
      createdBy: user.id,
    })

    it('calls CreateProgramUseCase once', async () => {
      await programController.createProgram(user, createProgramRequest)

      expect(createProgramUseCase.execute).toHaveBeenCalledExactlyOnceWith(
        params,
      )
    })

    it('should return correct user when CreateProgramUseCase success', async () => {
      const result = await programController.createProgram(
        user,
        createProgramRequest,
      )

      expect(result).toStrictEqual(AppResult.success(programOut))
    })

    it('should returns failed when CreateProgramUseCase failed', async () => {
      const e = AppException.test()
      vi.spyOn(createProgramUseCase, 'execute').mockResolvedValueOnce(
        AppResult.failed(e),
      )

      const result = await programController.createProgram(
        user,
        createProgramRequest,
      )

      expect(result).toStrictEqual(AppResult.failed(e))
    })
  })

  describe('getPrograms', () => {
    it('calls GetProgramsUseCase once', async () => {
      await programController.getPrograms(user)

      expect(getProgramsUseCase.execute).toHaveBeenCalledExactlyOnceWith(
        new Pagination({}),
      )
    })

    it('calls GetProgramsUseCase once with pagination', async () => {
      const pagination = new Pagination({ page: 10 })

      await programController.getPrograms(user, pagination)

      expect(getProgramsUseCase.execute).toHaveBeenCalledExactlyOnceWith(
        pagination,
      )
    })

    it('calls GetProgramsUseCase once with facultyId filter', async () => {
      const query = new ProgramsQuery({ facultyId: 'facultyId' })

      await programController.getPrograms(user, query)

      expect(getProgramsUseCase.execute).toHaveBeenCalledExactlyOnceWith(
        new GetProgramsParams({ facultyId: query.facultyId }),
      )
    })

    it('calls GetProgramsUseCase once with search filter', async () => {
      const query = new ProgramsQuery({ search: 'search' })

      await programController.getPrograms(user, query)

      expect(getProgramsUseCase.execute).toHaveBeenCalledExactlyOnceWith(
        new GetProgramsParams({ search: query.search }),
      )
    })

    it('should return correct faculties when GetProgramsUseCase success', async () => {
      const result = await programController.getPrograms(user)

      expect(result).toStrictEqual(
        AppResult.success(
          paginatedResult.mapData((it) => ProgramOut.fromProgram(it)),
        ),
      )
    })

    it('should returns failed when GetProgramsUseCase failed', async () => {
      const e = AppException.test()
      vi.spyOn(getProgramsUseCase, 'execute').mockResolvedValueOnce(
        AppResult.failed(e),
      )

      const result = await programController.getPrograms(user)

      expect(result).toStrictEqual(AppResult.failed(e))
    })
  })

  describe('deleteProgram', () => {
    it('calls DeleteProgramUseCase once', async () => {
      await programController.deleteProgram(user, 'id')

      expect(deleteProgramUseCase.execute).toHaveBeenCalledExactlyOnceWith('id')
    })

    it('should return undefined when DeleteProgramUseCase success', async () => {
      const result = await programController.deleteProgram(user, 'id')

      expect(result).toBeUndefined()
    })

    it('should returns failed when DeleteProgramUseCase failed', async () => {
      const e = AppException.test()
      vi.spyOn(deleteProgramUseCase, 'execute').mockResolvedValueOnce(
        AppResult.failed(e),
      )

      const result = await programController.deleteProgram(user, 'id')

      expect(result).toStrictEqual(AppResult.failed(e))
    })
  })
})
