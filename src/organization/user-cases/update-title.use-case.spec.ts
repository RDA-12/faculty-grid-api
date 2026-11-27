import { Test } from '@nestjs/testing'
import { AppException } from '../../common/app-exception.js'
import { AppResult } from '../../common/app-result.js'
import { Title, TitleScope } from '../entities/title.entity.js'
import { TitleRepository } from '../repositories/title.repository.js'
import {
  UpdateTitleParams,
  UpdateTitleUseCase,
} from './update-title.use-case.js'

describe('UpdateTitleUseCase', () => {
  const params = new UpdateTitleParams({
    id: 'id',
    name: 'Head of Program',
    scope: TitleScope.program,
  })
  const title = new Title({
    id: params.id,
    name: params.name,
    scope: params.scope,
  })
  let titleRepository: {
    update: ReturnType<typeof vi.fn>
  }
  let updateTitleUseCase: UpdateTitleUseCase

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: TitleRepository,
          useValue: {
            update: vi.fn().mockResolvedValue(AppResult.success(title)),
          },
        },
        UpdateTitleUseCase,
      ],
    }).compile()

    titleRepository = moduleRef.get(TitleRepository)
    updateTitleUseCase = moduleRef.get(UpdateTitleUseCase)
  })

  it('should call TitleRepository.update once', async () => {
    await updateTitleUseCase.execute(params)

    expect(titleRepository.update).toHaveBeenCalledExactlyOnceWith(params)
  })

  it('should return success with updated title when TitleRepository.update succeeds', async () => {
    const result = await updateTitleUseCase.execute(params)

    expect(result).toStrictEqual(AppResult.success(title))
  })

  it('should return failed with exception when TitleRepository.update fails', async () => {
    const e = AppException.test()
    vi.spyOn(titleRepository, 'update').mockResolvedValueOnce(
      AppResult.failed(e),
    )
    const result = await updateTitleUseCase.execute(params)

    expect(result).toStrictEqual(AppResult.failed(e))
  })
})
