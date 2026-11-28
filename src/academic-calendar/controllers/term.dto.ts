import { ApiProperty } from '@nestjs/swagger'
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator'
import { Term, TermStatus } from '../entities/term.entity.js'
import { PaginationQuery } from '../../common/pagination.js'
import { IsAfter } from '../../common/decorators/is-after.decorator.js'

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/

export class CreateTermDTO {
  constructor(args?: Partial<CreateTermDTO>) {
    if (args) {
      Object.assign(this, args)
    }
  }

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  academicYearId: string

  @ApiProperty({ example: '2026/2027 Odd' })
  @IsString()
  @IsNotEmpty()
  name: string

  @ApiProperty({ example: '2026-08-01' })
  @Matches(DATE_ONLY_REGEX, {
    message: 'startDate must be in YYYY-MM-DD format',
  })
  @IsDateString({ strict: true })
  startDate: string

  @ApiProperty({ example: '2027-01-31' })
  @Matches(DATE_ONLY_REGEX, {
    message: 'endDate must be in YYYY-MM-DD format',
  })
  @IsDateString({ strict: true })
  @IsAfter('startDate', {
    strict: true,
    message: 'endDate must be after startDate',
  })
  endDate: string

  @ApiProperty({
    enum: TermStatus,
    required: false,
    default: TermStatus.planned,
    example: TermStatus.planned,
  })
  @IsOptional()
  @IsEnum(TermStatus)
  status?: TermStatus
}

export class UpdateTermDTO {
  constructor(args?: Partial<UpdateTermDTO>) {
    if (args) {
      Object.assign(this, args)
    }
  }

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  academicYearId: string

  @ApiProperty({ example: '2026/2027 Odd' })
  @IsString()
  @IsNotEmpty()
  name: string

  @ApiProperty({ example: '2026-08-01' })
  @Matches(DATE_ONLY_REGEX, {
    message: 'startDate must be in YYYY-MM-DD format',
  })
  @IsDateString({ strict: true })
  startDate: string

  @ApiProperty({ example: '2027-01-31' })
  @Matches(DATE_ONLY_REGEX, {
    message: 'endDate must be in YYYY-MM-DD format',
  })
  @IsDateString({ strict: true })
  @IsAfter('startDate', {
    strict: true,
    message: 'endDate must be after startDate',
  })
  endDate: string

  @ApiProperty({
    enum: TermStatus,
    example: TermStatus.active,
  })
  @IsEnum(TermStatus)
  status: TermStatus
}

export class TermOut {
  constructor(args?: Required<TermOut>) {
    if (args) {
      Object.assign(this, args)
    }
  }

  @ApiProperty()
  @IsString()
  id: string

  @ApiProperty()
  @IsString()
  academicYearId: string

  @ApiProperty({ example: '2026/2027 Odd' })
  @IsString()
  name: string

  @ApiProperty({ example: '2026-08-01' })
  @IsString()
  startDate: string

  @ApiProperty({ example: '2027-01-31' })
  @IsString()
  endDate: string

  @ApiProperty({
    enum: TermStatus,
    example: TermStatus.planned,
  })
  @IsEnum(TermStatus)
  status: TermStatus

  static fromTerm(term: Term) {
    return new TermOut(term)
  }
}

export class TermsQuery extends PaginationQuery {
  constructor(args?: Partial<TermsQuery>) {
    super()
    if (args) {
      Object.assign(this, args)
    }
  }

  @ApiProperty({
    description: 'Filter terms by academic year ID',
    required: false,
  })
  @IsString()
  @IsOptional()
  academicYearId?: string

  @ApiProperty({
    description: 'Filter terms by status',
    enum: TermStatus,
    required: false,
    example: TermStatus.active,
  })
  @IsEnum(TermStatus)
  @IsOptional()
  status?: TermStatus

  @ApiProperty({
    description: 'Filter terms by name',
    required: false,
    example: 'Odd',
  })
  @IsString()
  @IsOptional()
  search?: string
}
