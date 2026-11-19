import { AuthzUser } from './authz-user.js'
import { Role } from './role.entity.js'

describe('AuthzUser', () => {
  describe('isA', () => {
    it('should return correctly', () => {
      const user = new AuthzUser({
        id: 'id',
        name: 'name',
        email: 'email',
        roles: [],
      })

      expect(user.isA(Role.admin)).toBeFalsy()
    })
  })
})
