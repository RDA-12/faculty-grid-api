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
  UpdateLecturerParams,
  UpdateLecturerUseCase,
} from './update-lecturer.use-case.js'

describe('UpdateLecturerUseCase', () => {
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

  let lecturerRepository: { update: ReturnType<typeof vi.fn> }
  let rankRepository: { getById: ReturnType<typeof vi.fn> }
  let functionalRankRepository: { getById: ReturnType<typeof vi.fn> }
  let updateLecturerUseCase: UpdateLecturerUseCase

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: LecturerRepository,
          useValue: {
            update: vi.fn().mockResolvedValue(AppResult.success(lecturer)),
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
        UpdateLecturerUseCase,
      ],
    }).compile()

    lecturerRepository = moduleRef.get(LecturerRepository)
    rankRepository = moduleRef.get(RankRepository)
    functionalRankRepository = moduleRef.get(FunctionalRankRepository)
    updateLecturerUseCase = moduleRef.get(UpdateLecturerUseCase)
  })

  it('should update ASN lecturer when rank type is asn', async () => {
    const params = new UpdateLecturerParams({
      id: lecturer.id,
      name: lecturer.name,
      displayName: lecturer.displayName,
      programId: lecturer.programId,
      employmentStatus: EmploymentStatus.asn,
      rankId: asnRank.id,
      functionalRankId: functionalRank.id,
      academicDegree: AcademicDegree.doctorate,
    })

    const result = await updateLecturerUseCase.execute(params)

    expect(lecturerRepository.update).toHaveBeenCalledExactlyOnceWith(params)
    expect(result).toStrictEqual(AppResult.success(lecturer))
  })

  it('should fail with InvalidRequestException when ASN lecturer has null rankId', async () => {
    const params = new UpdateLecturerParams({
      id: lecturer.id,
      name: lecturer.name,
      displayName: lecturer.displayName,
      programId: lecturer.programId,
      employmentStatus: EmploymentStatus.asn,
      rankId: null,
      academicDegree: AcademicDegree.doctorate,
    })

    const result = await updateLecturerUseCase.execute(params)

    expect(lecturerRepository.update).not.toHaveBeenCalled()
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

  it('should fail with InvalidRequestException when military lecturer uses asn rank', async () => {
    const params = new UpdateLecturerParams({
      id: lecturer.id,
      name: lecturer.name,
      displayName: lecturer.displayName,
      programId: lecturer.programId,
      employmentStatus: EmploymentStatus.military,
      rankId: asnRank.id,
      academicDegree: AcademicDegree.master,
    })

    const result = await updateLecturerUseCase.execute(params)

    expect(lecturerRepository.update).not.toHaveBeenCalled()
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

  it('should update military lecturer when rank type is military', async () => {
    vi.spyOn(rankRepository, 'getById').mockResolvedValueOnce(
      AppResult.success(militaryRank),
    )
    const params = new UpdateLecturerParams({
      id: lecturer.id,
      name: lecturer.name,
      displayName: lecturer.displayName,
      programId: lecturer.programId,
      employmentStatus: EmploymentStatus.military,
      rankId: militaryRank.id,
      academicDegree: AcademicDegree.master,
    })

    const result = await updateLecturerUseCase.execute(params)

    expect(lecturerRepository.update).toHaveBeenCalledExactlyOnceWith(params)
    expect(result).toStrictEqual(AppResult.success(lecturer))
  })

  it('should update contract lecturer with null rankId', async () => {
    const params = new UpdateLecturerParams({
      id: lecturer.id,
      name: lecturer.name,
      displayName: lecturer.displayName,
      programId: lecturer.programId,
      employmentStatus: EmploymentStatus.contract,
      rankId: null,
      academicDegree: AcademicDegree.bachelor,
    })

    const result = await updateLecturerUseCase.execute(params)

    expect(rankRepository.getById).not.toHaveBeenCalled()
    expect(lecturerRepository.update).toHaveBeenCalledExactlyOnceWith(params)
    expect(result).toStrictEqual(AppResult.success(lecturer))
  })

  it('should propagate NotFoundException when functionalRankId does not exist', async () => {
    const notFound = new NotFoundException('functional rank not found')
    vi.spyOn(functionalRankRepository, 'getById').mockResolvedValueOnce(
      AppResult.failed(notFound),
    )
    const params = new UpdateLecturerParams({
      id: lecturer.id,
      name: lecturer.name,
      displayName: lecturer.displayName,
      programId: lecturer.programId,
      employmentStatus: EmploymentStatus.contract,
      functionalRankId: 'missing-functional-rank',
      academicDegree: AcademicDegree.doctorate,
    })

    const result = await updateLecturerUseCase.execute(params)

    expect(lecturerRepository.update).not.toHaveBeenCalled()
    expect(result).toStrictEqual(AppResult.failed(notFound))
  })

  it('should return failed when LecturerRepository.update fails', async () => {
    const e = AppException.test()
    vi.spyOn(lecturerRepository, 'update').mockResolvedValueOnce(
      AppResult.failed(e),
    )
    const params = new UpdateLecturerParams({
      id: lecturer.id,
      name: lecturer.name,
      displayName: lecturer.displayName,
      programId: lecturer.programId,
      employmentStatus: EmploymentStatus.contract,
      academicDegree: AcademicDegree.doctorate,
    })

    const result = await updateLecturerUseCase.execute(params)

    expect(result).toStrictEqual(AppResult.failed(e))
  })
})
