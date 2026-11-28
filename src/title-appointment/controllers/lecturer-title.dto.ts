import { ApiProperty } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator'
import { LecturerTitle } from '../entities/lecturer-title.entity.js'
import { PaginationQuery } from '../../common/pagination.js'
import { IsAfter } from '../../common/decorators/is-after.decorator.js'

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/

export class CreateLecturerTitleDTO {
  constructor(args?: Partial<CreateLecturerTitleDTO>) {
    if (args) {
      Object.assign(this, args)
    }
  }

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  lecturerId: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  titleId: string

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  facultyId?: string | null

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  programId?: string | null

  @ApiProperty({ example: '2026-01-01' })
  @Matches(DATE_ONLY_REGEX, {
    message: 'startDate must be in YYYY-MM-DD format',
  })
  @IsDateString({ strict: true })
  startDate: string

  @ApiProperty({ required: false, nullable: true, example: '2028-01-01' })
  @IsOptional()
  @Matches(DATE_ONLY_REGEX, {
    message: 'endDate must be in YYYY-MM-DD format',
  })
  @IsDateString({ strict: true })
  @IsAfter('startDate', {
    message: 'endDate must not be earlier than startDate',
  })
  endDate?: string | null
}

export class UpdateLecturerTitleDTO {
  constructor(args?: Partial<UpdateLecturerTitleDTO>) {
    if (args) {
      Object.assign(this, args)
    }
  }

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  lecturerId: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  titleId: string

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  facultyId?: string | null

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  programId?: string | null

  @ApiProperty({ example: '2026-01-01' })
  @Matches(DATE_ONLY_REGEX, {
    message: 'startDate must be in YYYY-MM-DD format',
  })
  @IsDateString({ strict: true })
  startDate: string

  @ApiProperty({ required: false, nullable: true, example: '2028-01-01' })
  @IsOptional()
  @Matches(DATE_ONLY_REGEX, {
    message: 'endDate must be in YYYY-MM-DD format',
  })
  @IsDateString({ strict: true })
  @IsAfter('startDate', {
    message: 'endDate must not be earlier than startDate',
  })
  endDate?: string | null
}

export class LecturerTitleOut {
  constructor(args?: Required<LecturerTitleOut>) {
    if (args) {
      Object.assign(this, args)
    }
  }

  @ApiProperty()
  @IsString()
  id: string

  @ApiProperty()
  @IsString()
  lecturerId: string

  @ApiProperty()
  @IsString()
  titleId: string

  @ApiProperty({ nullable: true })
  @IsString()
  @IsOptional()
  facultyId: string | null

  @ApiProperty({ nullable: true })
  @IsString()
  @IsOptional()
  programId: string | null

  @ApiProperty({ example: '2026-01-01' })
  @IsString()
  startDate: string

  @ApiProperty({ nullable: true, example: '2028-01-01' })
  @IsString()
  @IsOptional()
  endDate: string | null

  static fromLecturerTitle(lecturerTitle: LecturerTitle) {
    return new LecturerTitleOut(lecturerTitle)
  }
}

export class LecturerTitlesQuery extends PaginationQuery {
  constructor(args?: Partial<LecturerTitlesQuery>) {
    super()
    if (args) {
      Object.assign(this, args)
    }
  }

  @ApiProperty({
    description: 'Filter lecturer titles by lecturer ID',
    required: false,
  })
  @IsString()
  @IsOptional()
  lecturerId?: string

  @ApiProperty({
    description: 'Filter lecturer titles by title ID',
    required: false,
  })
  @IsString()
  @IsOptional()
  titleId?: string

  @ApiProperty({
    description: 'Filter lecturer titles by faculty ID',
    required: false,
  })
  @IsString()
  @IsOptional()
  facultyId?: string

  @ApiProperty({
    description: 'Filter lecturer titles by program ID',
    required: false,
  })
  @IsString()
  @IsOptional()
  programId?: string

  @ApiProperty({
    description: 'Filter only active title assignments (endDate is null)',
    required: false,
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean()
  activeOnly?: boolean
}
