import { validate } from 'class-validator'
import { IsAfter } from './is-after.decorator.js'

class DateRangeSample {
  startDate?: string

  @IsAfter('startDate', {
    message: 'endDate must not be earlier than startDate',
  })
  endDate?: string | null
}

class StrictDateRangeSample {
  startDate?: string

  @IsAfter('startDate', { strict: true })
  endDate?: string | null
}

describe('IsAfter decorator', () => {
  it('passes when endDate is after startDate', async () => {
    const sample = new DateRangeSample()
    sample.startDate = '2026-01-01'
    sample.endDate = '2026-06-01'

    const errors = await validate(sample)
    expect(errors).toHaveLength(0)
  })

  it('passes when endDate is equal to startDate (non-strict)', async () => {
    const sample = new DateRangeSample()
    sample.startDate = '2026-01-01'
    sample.endDate = '2026-01-01'

    const errors = await validate(sample)
    expect(errors).toHaveLength(0)
  })

  it('passes when endDate is undefined or null', async () => {
    const sampleUndefined = new DateRangeSample()
    sampleUndefined.startDate = '2026-01-01'

    const sampleNull = new DateRangeSample()
    sampleNull.startDate = '2026-01-01'
    sampleNull.endDate = null

    expect(await validate(sampleUndefined)).toHaveLength(0)
    expect(await validate(sampleNull)).toHaveLength(0)
  })

  it('fails when endDate is earlier than startDate', async () => {
    const sample = new DateRangeSample()
    sample.startDate = '2026-06-01'
    sample.endDate = '2026-01-01'

    const errors = await validate(sample)
    expect(errors).toHaveLength(1)
    expect(errors[0].property).toBe('endDate')
    expect(errors[0].constraints?.IsAfter).toBe(
      'endDate must not be earlier than startDate',
    )
  })

  it('skips when either date is malformed', async () => {
    const sample = new DateRangeSample()
    sample.startDate = 'not-a-date'
    sample.endDate = '2026-01-01'

    const errors = await validate(sample)
    expect(errors).toHaveLength(0)
  })

  describe('strict mode', () => {
    it('passes when endDate is strictly after startDate', async () => {
      const sample = new StrictDateRangeSample()
      sample.startDate = '2026-01-01'
      sample.endDate = '2026-01-02'

      const errors = await validate(sample)
      expect(errors).toHaveLength(0)
    })

    it('fails when endDate equals startDate', async () => {
      const sample = new StrictDateRangeSample()
      sample.startDate = '2026-01-01'
      sample.endDate = '2026-01-01'

      const errors = await validate(sample)
      expect(errors).toHaveLength(1)
      expect(errors[0].property).toBe('endDate')
      expect(errors[0].constraints?.IsAfter).toBe(
        'endDate must be after startDate',
      )
    })

    it('fails when endDate is earlier than startDate', async () => {
      const sample = new StrictDateRangeSample()
      sample.startDate = '2026-06-01'
      sample.endDate = '2026-01-01'

      const errors = await validate(sample)
      expect(errors).toHaveLength(1)
      expect(errors[0].property).toBe('endDate')
      expect(errors[0].constraints?.IsAfter).toBe(
        'endDate must be after startDate',
      )
    })
  })
})
