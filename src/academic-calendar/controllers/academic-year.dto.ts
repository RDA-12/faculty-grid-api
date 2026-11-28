import { ApiProperty } from '@nestjs/swagger'
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator'
import {
  AcademicYear,
  AcademicYearStatus,
} from '../entities/academic-year.entity.js'
import { PaginationQuery } from '../../common/pagination.js'
import { IsAfter } from '../../common/decorators/is-after.decorator.js'

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/

export class CreateAcademicYearDTO {
  constructor(args?: Partial<CreateAcademicYearDTO>) {
    if (args) {
      Object.assign(this, args)
    }
  }

  @ApiProperty({ example: '2026/2027' })
  @IsString()
  @IsNotEmpty()
  name: string

  @ApiProperty({ example: '2026-08-01' })
  @Matches(DATE_ONLY_REGEX, {
    message: 'startDate must be in YYYY-MM-DD format',
  })
  @IsDateString({ strict: true })
  startDate: string

  @ApiProperty({ example: '2027-07-31' })
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
    enum: AcademicYearStatus,
    required: false,
    default: AcademicYearStatus.planned,
    example: AcademicYearStatus.planned,
  })
  @IsOptional()
  @IsEnum(AcademicYearStatus)
  status?: AcademicYearStatus
}

export class UpdateAcademicYearDTO {
  constructor(args?: Partial<UpdateAcademicYearDTO>) {
    if (args) {
      Object.assign(this, args)
    }
  }

  @ApiProperty({ example: '2026/2027' })
  @IsString()
  @IsNotEmpty()
  name: string

  @ApiProperty({ example: '2026-08-01' })
  @Matches(DATE_ONLY_REGEX, {
    message: 'startDate must be in YYYY-MM-DD format',
  })
  @IsDateString({ strict: true })
  startDate: string

  @ApiProperty({ example: '2027-07-31' })
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
    enum: AcademicYearStatus,
    example: AcademicYearStatus.active,
  })
  @IsEnum(AcademicYearStatus)
  status: AcademicYearStatus
}

export class AcademicYearOut {
  constructor(args?: Required<AcademicYearOut>) {
    if (args) {
      Object.assign(this, args)
    }
  }

  @ApiProperty()
  @IsString()
  id: string

  @ApiProperty({ example: '2026/2027' })
  @IsString()
  name: string

  @ApiProperty({ example: '2026-08-01' })
  @IsString()
  startDate: string

  @ApiProperty({ example: '2027-07-31' })
  @IsString()
  endDate: string

  @ApiProperty({
    enum: AcademicYearStatus,
    example: AcademicYearStatus.planned,
  })
  @IsEnum(AcademicYearStatus)
  status: AcademicYearStatus

  static fromAcademicYear(academicYear: AcademicYear) {
    return new AcademicYearOut(academicYear)
  }
}

export class AcademicYearsQuery extends PaginationQuery {
  constructor(args?: Partial<AcademicYearsQuery>) {
    super()
    if (args) {
      Object.assign(this, args)
    }
  }

  @ApiProperty({
    description: 'Filter academic years by status',
    enum: AcademicYearStatus,
    required: false,
    example: AcademicYearStatus.active,
  })
  @IsEnum(AcademicYearStatus)
  @IsOptional()
  status?: AcademicYearStatus

  @ApiProperty({
    description: 'Filter academic years by name',
    required: false,
    example: '2026',
  })
  @IsString()
  @IsOptional()
  search?: string
}
