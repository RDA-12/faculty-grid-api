import { Test } from '@nestjs/testing'
import { User } from '../entities/user.entity.js'
import { UserController } from './user.controller.js'
import { UserOut } from './user.dto.js'

describe('UserController', () => {
  const user = new User({
    id: 'id',
    name: 'name',
    email: 'email',
  })
  const userOut = UserOut.fromUser(user)
  let userController: UserController

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [UserController],
    }).compile()

    userController = moduleRef.get(UserController)
  })

  describe('getMe', () => {
    it('should returns UserOut from provided User', () => {
      const result = userController.getMe(user)

      expect(result).toStrictEqual(userOut)
    })
  })
})
