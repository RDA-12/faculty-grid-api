import { Test } from '@nestjs/testing'
import { User } from '../../user/entities/user.entity.js'
import { Program, ProgramDegreeLevel } from '../entities/program.entity.js'
import { ProgramController } from './program.controller.js'
import { CreateProgramDTO, ProgramOut } from './program.dto.js'
import {
  CreateProgramParams,
  CreateProgramUseCase,
} from '../user-cases/create-program.use-case.js'
import { AppResult } from '../../common/app-result.js'
import { ConfigService } from '@nestjs/config'
import { AppException } from '../../common/app-exception.js'

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
  const programOut = ProgramOut.fromProgram(program)
  let createProgramUseCase: { execute: ReturnType<typeof vi.fn> }
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
          provide: ConfigService,
          useValue: {},
        },
      ],
    }).compile()

    createProgramUseCase = moduleRef.get(CreateProgramUseCase)

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
})
