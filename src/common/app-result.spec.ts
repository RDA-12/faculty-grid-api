import { AppException } from './app-exception.js'
import { AppResult } from './app-result.js'

describe('AppResult', () => {
  describe('success', () => {
    it('should run success callback on when', () => {
      let result = AppResult.success('string')

      var actual: string | null = null
      result.when({
        success(data) {
          actual = data
        },
      })

      expect(actual).toBe('string')
    })

    describe('failed', () => {
      it('should run failed callback on when', () => {
        let e = new AppException('')
        let result = AppResult.failed(e)

        var actual: AppException | null = null
        result.when({
          failed(exception) {
            actual = exception
          },
        })

        expect(actual).toStrictEqual(e)
      })
    })
  })
})
