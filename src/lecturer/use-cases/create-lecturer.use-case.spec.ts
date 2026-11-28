import { Test } from '@nestjs/testing'
import { AppResult } from '../../common/app-result.js'
import {
  AppException,
  InvalidRequestError,
  InvalidRequestException,
  NotFoundException,
} from '../../common/app-exception.js'
import {
  AcademicDegree,
  EmploymentStatus,
  Lecturer,
} from '../entities/lecturer.entity.js'
import { Rank, RankType } from '../entities/rank.entity.js'
import { FunctionalRank } from '../entities/functional-rank.entity.js'
import { LecturerRepository } from '../repositories/lecturer.repository.js'
import { RankRepository } from '../repositories/rank.repository.js'
import { FunctionalRankRepository } from '../repositories/functional-rank.repository.js'
import {
  CreateLecturerParams,
  CreateLecturerUseCase,
} from './create-lecturer.use-case.js'

describe('CreateLecturerUseCase', () => {
  const asnRank = new Rank({
    id: 'asn-rank-id',
    name: 'Penata Muda (III/a)',
    type: RankType.asn,
  })
  const militaryRank = new Rank({
    id: 'military-rank-id',
    name: 'Mayor',
    type: RankType.military,
  })
  const functionalRank = new FunctionalRank({
    id: 'functional-rank-id',
    name: 'Lektor',
  })
  const lecturer = new Lecturer({
    id: 'lecturer-id',
    name: 'Budi Santoso',
    displayName: 'Dr. Budi Santoso, S.T., M.T.',
    programId: 'program-id',
    employmentStatus: EmploymentStatus.asn,
    rankId: asnRank.id,
    functionalRankId: functionalRank.id,
    academicDegree: AcademicDegree.doctorate,
  })

  let lecturerRepository: { save: ReturnType<typeof vi.fn> }
  let rankRepository: { getById: ReturnType<typeof vi.fn> }
  let functionalRankRepository: { getById: ReturnType<typeof vi.fn> }
  let createLecturerUseCase: CreateLecturerUseCase

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: LecturerRepository,
          useValue: {
            save: vi.fn().mockResolvedValue(AppResult.success(lecturer)),
          },
        },
        {
          provide: RankRepository,
          useValue: {
            getById: vi.fn().mockResolvedValue(AppResult.success(asnRank)),
          },
        },
        {
          provide: FunctionalRankRepository,
          useValue: {
            getById: vi
              .fn()
              .mockResolvedValue(AppResult.success(functionalRank)),
          },
        },
        CreateLecturerUseCase,
      ],
    }).compile()

    lecturerRepository = moduleRef.get(LecturerRepository)
    rankRepository = moduleRef.get(RankRepository)
    functionalRankRepository = moduleRef.get(FunctionalRankRepository)
    createLecturerUseCase = moduleRef.get(CreateLecturerUseCase)
  })

  it('should create ASN lecturer when rank type is asn', async () => {
    const params = new CreateLecturerParams({
      name: lecturer.name,
      displayName: lecturer.displayName,
      programId: lecturer.programId,
      employmentStatus: EmploymentStatus.asn,
      rankId: asnRank.id,
      functionalRankId: functionalRank.id,
      academicDegree: AcademicDegree.doctorate,
      createdBy: 'user-id',
    })

    const result = await createLecturerUseCase.execute(params)

    expect(rankRepository.getById).toHaveBeenCalledExactlyOnceWith(asnRank.id)
    expect(functionalRankRepository.getById).toHaveBeenCalledExactlyOnceWith(
      functionalRank.id,
    )
    expect(lecturerRepository.save).toHaveBeenCalledExactlyOnceWith(params)
    expect(result).toStrictEqual(AppResult.success(lecturer))
  })

  it('should fail with InvalidRequestException when ASN lecturer has null rankId', async () => {
    const params = new CreateLecturerParams({
      name: lecturer.name,
      displayName: lecturer.displayName,
      programId: lecturer.programId,
      employmentStatus: EmploymentStatus.asn,
      rankId: null,
      academicDegree: AcademicDegree.doctorate,
      createdBy: 'user-id',
    })

    const result = await createLecturerUseCase.execute(params)

    expect(lecturerRepository.save).not.toHaveBeenCalled()
    expect(result).toStrictEqual(
      AppResult.failed(
        new InvalidRequestException([
          new InvalidRequestError({
            property: 'rankId',
            value: null,
            constraints: ['rankId is required when employmentStatus is asn'],
          }),
        ]),
      ),
    )
  })

  it('should fail with InvalidRequestException when ASN lecturer uses military rank', async () => {
    vi.spyOn(rankRepository, 'getById').mockResolvedValueOnce(
      AppResult.success(militaryRank),
    )
    const params = new CreateLecturerParams({
      name: lecturer.name,
      displayName: lecturer.displayName,
      programId: lecturer.programId,
      employmentStatus: EmploymentStatus.asn,
      rankId: militaryRank.id,
      academicDegree: AcademicDegree.doctorate,
      createdBy: 'user-id',
    })

    const result = await createLecturerUseCase.execute(params)

    expect(lecturerRepository.save).not.toHaveBeenCalled()
    expect(result).toStrictEqual(
      AppResult.failed(
        new InvalidRequestException([
          new InvalidRequestError({
            property: 'rankId',
            value: militaryRank.id,
            constraints: [
              'rank type military does not match employmentStatus asn',
            ],
          }),
        ]),
      ),
    )
  })

  it('should create military lecturer when rank type is military', async () => {
    vi.spyOn(rankRepository, 'getById').mockResolvedValueOnce(
      AppResult.success(militaryRank),
    )
    const params = new CreateLecturerParams({
      name: lecturer.name,
      displayName: lecturer.displayName,
      programId: lecturer.programId,
      employmentStatus: EmploymentStatus.military,
      rankId: militaryRank.id,
      academicDegree: AcademicDegree.master,
      createdBy: 'user-id',
    })

    const result = await createLecturerUseCase.execute(params)

    expect(functionalRankRepository.getById).not.toHaveBeenCalled()
    expect(lecturerRepository.save).toHaveBeenCalledExactlyOnceWith(params)
    expect(result).toStrictEqual(AppResult.success(lecturer))
  })

  it('should fail with InvalidRequestException when military lecturer has null rankId', async () => {
    const params = new CreateLecturerParams({
      name: lecturer.name,
      displayName: lecturer.displayName,
      programId: lecturer.programId,
      employmentStatus: EmploymentStatus.military,
      rankId: null,
      academicDegree: AcademicDegree.master,
      createdBy: 'user-id',
    })

    const result = await createLecturerUseCase.execute(params)

    expect(lecturerRepository.save).not.toHaveBeenCalled()
    expect(result).toStrictEqual(
      AppResult.failed(
        new InvalidRequestException([
          new InvalidRequestError({
            property: 'rankId',
            value: null,
            constraints: [
              'rankId is required when employmentStatus is military',
            ],
          }),
        ]),
      ),
    )
  })

  it('should fail with InvalidRequestException when military lecturer uses asn rank', async () => {
    const params = new CreateLecturerParams({
      name: lecturer.name,
      displayName: lecturer.displayName,
      programId: lecturer.programId,
      employmentStatus: EmploymentStatus.military,
      rankId: asnRank.id,
      academicDegree: AcademicDegree.master,
      createdBy: 'user-id',
    })

    const result = await createLecturerUseCase.execute(params)

    expect(lecturerRepository.save).not.toHaveBeenCalled()
    expect(result).toStrictEqual(
      AppResult.failed(
        new InvalidRequestException([
          new InvalidRequestError({
            property: 'rankId',
            value: asnRank.id,
            constraints: [
              'rank type asn does not match employmentStatus military',
            ],
          }),
        ]),
      ),
    )
  })

  it('should create contract lecturer with null rankId without checking rankRepository', async () => {
    const params = new CreateLecturerParams({
      name: lecturer.name,
      displayName: lecturer.displayName,
      programId: lecturer.programId,
      employmentStatus: EmploymentStatus.contract,
      rankId: null,
      academicDegree: AcademicDegree.bachelor,
      createdBy: 'user-id',
    })

    const result = await createLecturerUseCase.execute(params)

    expect(rankRepository.getById).not.toHaveBeenCalled()
    expect(lecturerRepository.save).toHaveBeenCalledExactlyOnceWith(params)
    expect(result).toStrictEqual(AppResult.success(lecturer))
  })

  it('should create contract lecturer with an existing rank of any type', async () => {
    vi.spyOn(rankRepository, 'getById').mockResolvedValueOnce(
      AppResult.success(militaryRank),
    )
    const params = new CreateLecturerParams({
      name: lecturer.name,
      displayName: lecturer.displayName,
      programId: lecturer.programId,
      employmentStatus: EmploymentStatus.contract,
      rankId: militaryRank.id,
      academicDegree: AcademicDegree.bachelor,
      createdBy: 'user-id',
    })

    const result = await createLecturerUseCase.execute(params)

    expect(rankRepository.getById).toHaveBeenCalledExactlyOnceWith(
      militaryRank.id,
    )
    expect(lecturerRepository.save).toHaveBeenCalledExactlyOnceWith(params)
    expect(result).toStrictEqual(AppResult.success(lecturer))
  })

  it('should propagate NotFoundException when rankId does not exist', async () => {
    const notFound = new NotFoundException('rank not found')
    vi.spyOn(rankRepository, 'getById').mockResolvedValueOnce(
      AppResult.failed(notFound),
    )
    const params = new CreateLecturerParams({
      name: lecturer.name,
      displayName: lecturer.displayName,
      programId: lecturer.programId,
      employmentStatus: EmploymentStatus.asn,
      rankId: 'missing-rank',
      academicDegree: AcademicDegree.doctorate,
      createdBy: 'user-id',
    })

    const result = await createLecturerUseCase.execute(params)

    expect(lecturerRepository.save).not.toHaveBeenCalled()
    expect(result).toStrictEqual(AppResult.failed(notFound))
  })

  it('should propagate NotFoundException when functionalRankId does not exist', async () => {
    const notFound = new NotFoundException('functional rank not found')
    vi.spyOn(functionalRankRepository, 'getById').mockResolvedValueOnce(
      AppResult.failed(notFound),
    )
    const params = new CreateLecturerParams({
      name: lecturer.name,
      displayName: lecturer.displayName,
      programId: lecturer.programId,
      employmentStatus: EmploymentStatus.contract,
      functionalRankId: 'missing-functional-rank',
      academicDegree: AcademicDegree.doctorate,
      createdBy: 'user-id',
    })

    const result = await createLecturerUseCase.execute(params)

    expect(lecturerRepository.save).not.toHaveBeenCalled()
    expect(result).toStrictEqual(AppResult.failed(notFound))
  })

  it('should return failed when LecturerRepository.save fails', async () => {
    const e = AppException.test()
    vi.spyOn(lecturerRepository, 'save').mockResolvedValueOnce(
      AppResult.failed(e),
    )
    const params = new CreateLecturerParams({
      name: lecturer.name,
      displayName: lecturer.displayName,
      programId: lecturer.programId,
      employmentStatus: EmploymentStatus.contract,
      academicDegree: AcademicDegree.doctorate,
      createdBy: 'user-id',
    })

    const result = await createLecturerUseCase.execute(params)

    expect(result).toStrictEqual(AppResult.failed(e))
  })
})
