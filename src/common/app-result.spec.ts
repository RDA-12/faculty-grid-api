import { AppException } from './app-exception.js'
import { AppResult } from './app-result.js'

describe('AppResult', () => {
  describe('success', () => {
    it('should have non null data', () => {
      let result = AppResult.success('string')

      expect(result.data).toBe('string')
    })

    describe('failed', () => {
      it('should have non null exception', () => {
        let e = new AppException('')
        let result = AppResult.failed(e)

        expect(result.exception).toBe(e)
      })
    })
  })
})
