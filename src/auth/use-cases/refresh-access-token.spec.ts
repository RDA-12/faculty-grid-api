import { Test } from '@nestjs/testing'
import { RefreshAccessTokenUseCase } from './refresh-access-token.use-case.js'
import { JWT } from '../utils/jwt.util.js'
import { AppResult } from '../../common/app-result.js'
import { UserToken } from '../entities/user-credential.entity.js'
import { AppException } from '../../common/app-exception.js'

describe('RefreshAccessTokenUseCase', () => {
  const userToken = new UserToken({
    accessToken: 'access',
    refreshToken: 'refresh',
    expiresIn: 100,
  })
  let jwt = {
    refresh: vi.fn().mockResolvedValue(AppResult.success(userToken)),
  }
  let refreshAccessTokenUseCase: RefreshAccessTokenUseCase

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [{ provide: JWT, useValue: jwt }, RefreshAccessTokenUseCase],
    }).compile()

    refreshAccessTokenUseCase = moduleRef.get(RefreshAccessTokenUseCase)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should call JWT.refresh once', async () => {
    await refreshAccessTokenUseCase.execute('refresh')

    expect(jwt.refresh).toHaveBeenCalledExactlyOnceWith('refresh')
  })

  it('should return correct token pair when JWT.refresh success', async () => {
    const result = await refreshAccessTokenUseCase.execute('refresh')

    expect(result).toStrictEqual(AppResult.success(userToken))
  })

  it('should return failed when JWT.refresh failed', async () => {
    jwt.refresh.mockResolvedValueOnce(AppResult.failed(AppException.test()))

    const result = await refreshAccessTokenUseCase.execute('refresh')

    expect(result).toStrictEqual(AppResult.failed(AppException.test()))
  })
})
