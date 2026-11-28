import { ApiProperty } from '@nestjs/swagger'
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator'
import {
  AcademicDegree,
  EmploymentStatus,
  Lecturer,
} from '../entities/lecturer.entity.js'
import { PaginationQuery } from '../../common/pagination.js'

export class CreateLecturerDTO {
  constructor(args?: Partial<CreateLecturerDTO>) {
    if (args) {
      Object.assign(this, args)
    }
  }

  @ApiProperty({ example: 'Budi Santoso' })
  @IsString()
  @IsNotEmpty()
  name: string

  @ApiProperty({
    description: 'Lecturer name including academic or military titles',
    example: 'Dr. Budi Santoso, S.T., M.T.',
  })
  @IsString()
  @IsNotEmpty()
  displayName: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  programId: string

  @ApiProperty({ enum: EmploymentStatus, example: EmploymentStatus.asn })
  @IsEnum(EmploymentStatus)
  employmentStatus: EmploymentStatus

  @ApiProperty({
    required: false,
    nullable: true,
    description:
      'Required when employmentStatus is asn or military (must match rank type); optional for contract',
  })
  @ValidateIf(
    (o: CreateLecturerDTO) =>
      o.employmentStatus === EmploymentStatus.asn ||
      o.employmentStatus === EmploymentStatus.military ||
      (o.rankId !== undefined && o.rankId !== null),
  )
  @IsString()
  @IsNotEmpty()
  rankId?: string | null

  @ApiProperty({
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  functionalRankId?: string | null

  @ApiProperty({ enum: AcademicDegree, example: AcademicDegree.doctorate })
  @IsEnum(AcademicDegree)
  academicDegree: AcademicDegree
}

export class UpdateLecturerDTO {
  constructor(args?: Partial<UpdateLecturerDTO>) {
    if (args) {
      Object.assign(this, args)
    }
  }

  @ApiProperty({ example: 'Budi Santoso' })
  @IsString()
  @IsNotEmpty()
  name: string

  @ApiProperty({
    description: 'Lecturer name including academic or military titles',
    example: 'Dr. Budi Santoso, S.T., M.T.',
  })
  @IsString()
  @IsNotEmpty()
  displayName: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  programId: string

  @ApiProperty({ enum: EmploymentStatus, example: EmploymentStatus.asn })
  @IsEnum(EmploymentStatus)
  employmentStatus: EmploymentStatus

  @ApiProperty({
    required: false,
    nullable: true,
    description:
      'Required when employmentStatus is asn or military (must match rank type); optional for contract',
  })
  @ValidateIf(
    (o: UpdateLecturerDTO) =>
      o.employmentStatus === EmploymentStatus.asn ||
      o.employmentStatus === EmploymentStatus.military ||
      (o.rankId !== undefined && o.rankId !== null),
  )
  @IsString()
  @IsNotEmpty()
  rankId?: string | null

  @ApiProperty({
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  functionalRankId?: string | null

  @ApiProperty({ enum: AcademicDegree, example: AcademicDegree.doctorate })
  @IsEnum(AcademicDegree)
  academicDegree: AcademicDegree
}

export class LecturerOut {
  constructor(args?: Required<LecturerOut>) {
    if (args) {
      Object.assign(this, args)
    }
  }

  @ApiProperty()
  @IsString()
  id: string

  @ApiProperty({ example: 'Budi Santoso' })
  @IsString()
  name: string

  @ApiProperty({ example: 'Dr. Budi Santoso, S.T., M.T.' })
  @IsString()
  displayName: string

  @ApiProperty()
  @IsString()
  programId: string

  @ApiProperty({ enum: EmploymentStatus, example: EmploymentStatus.asn })
  @IsEnum(EmploymentStatus)
  employmentStatus: EmploymentStatus

  @ApiProperty({ nullable: true })
  @IsString()
  @IsOptional()
  rankId: string | null

  @ApiProperty({ nullable: true })
  @IsString()
  @IsOptional()
  functionalRankId: string | null

  @ApiProperty({ enum: AcademicDegree, example: AcademicDegree.doctorate })
  @IsEnum(AcademicDegree)
  academicDegree: AcademicDegree

  static fromLecturer(lecturer: Lecturer) {
    return new LecturerOut(lecturer)
  }
}

export class LecturersQuery extends PaginationQuery {
  constructor(args?: Partial<LecturersQuery>) {
    super()
    if (args) {
      Object.assign(this, args)
    }
  }

  @ApiProperty({
    description: 'Filter lecturers by program ID',
    required: false,
  })
  @IsString()
  @IsOptional()
  programId?: string

  @ApiProperty({
    description: 'Filter lecturers by employment status',
    enum: EmploymentStatus,
    required: false,
    example: EmploymentStatus.asn,
  })
  @IsEnum(EmploymentStatus)
  @IsOptional()
  employmentStatus?: EmploymentStatus

  @ApiProperty({
    description: 'Filter lecturers by rank ID',
    required: false,
  })
  @IsString()
  @IsOptional()
  rankId?: string

  @ApiProperty({
    description: 'Filter lecturers by functional rank ID',
    required: false,
  })
  @IsString()
  @IsOptional()
  functionalRankId?: string

  @ApiProperty({
    description: 'Filter lecturers by academic degree',
    enum: AcademicDegree,
    required: false,
    example: AcademicDegree.doctorate,
  })
  @IsEnum(AcademicDegree)
  @IsOptional()
  academicDegree?: AcademicDegree

  @ApiProperty({
    description: 'Filter lecturers by name or displayName',
    required: false,
    example: 'Budi',
  })
  @IsString()
  @IsOptional()
  search?: string
}
