import { PasswordHasher } from '@nestjs/authentication'
import { AppPasswordHasher } from './app-password-hasher.util.js'
import { Test } from '@nestjs/testing'
import { AppResult } from '../../common/app-result.js'
import { UnexpectedException } from '../../common/app-exception.js'

describe('AppPasswordHasher', () => {
  let nestPasswordHasher: { verify: ReturnType<typeof vi.fn> }
  let passwordHasher: AppPasswordHasher

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: PasswordHasher,
          useValue: {
            verify: vi.fn().mockResolvedValue(false),
          },
        },
        AppPasswordHasher,
      ],
    }).compile()

    nestPasswordHasher = moduleRef.get(PasswordHasher)
    passwordHasher = moduleRef.get(AppPasswordHasher)
  })

  describe('verify', () => {
    it('should returns success with correct verification when PasswordHasher.verify success', async () => {
      const result = await passwordHasher.verify('password', 'encoded')

      expect(result).toStrictEqual(AppResult.success(false))
      expect(nestPasswordHasher.verify).toHaveBeenCalledExactlyOnceWith(
        'password',
        'encoded',
      )
    })

    it('should returns failed when PasswordHasher.verify failed', async () => {
      vi.spyOn(nestPasswordHasher, 'verify').mockRejectedValueOnce(
        new Error('error'),
      )
      const result = await passwordHasher.verify('password', 'encoded')

      expect(result).toStrictEqual(
        AppResult.failed(new UnexpectedException('Error: error')),
      )
    })
  })
})
