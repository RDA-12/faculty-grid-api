import { ApiProperty } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator'
import { Course, CourseType } from '../entities/course.entity.js'
import { PaginationQuery } from '../../common/pagination.js'

export class CreateCourseDTO {
  constructor(args?: Partial<CreateCourseDTO>) {
    if (args) {
      Object.assign(this, args)
    }
  }

  @ApiProperty({ example: 'CS101' })
  @IsString()
  @IsNotEmpty()
  code: string

  @ApiProperty({ example: 'Data Structures' })
  @IsString()
  @IsNotEmpty()
  name: string

  @ApiProperty({ example: 3 })
  @IsInt()
  @Min(1)
  credits: number

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  semester: number

  @ApiProperty({ enum: CourseType, example: CourseType.mandatory })
  @IsEnum(CourseType)
  courseType: CourseType

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  programId: string
}

export class UpdateCourseDTO {
  constructor(args?: Partial<UpdateCourseDTO>) {
    if (args) {
      Object.assign(this, args)
    }
  }

  @ApiProperty({ example: 'CS101' })
  @IsString()
  @IsNotEmpty()
  code: string

  @ApiProperty({ example: 'Data Structures' })
  @IsString()
  @IsNotEmpty()
  name: string

  @ApiProperty({ example: 3 })
  @IsInt()
  @Min(1)
  credits: number

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  semester: number

  @ApiProperty({ enum: CourseType, example: CourseType.mandatory })
  @IsEnum(CourseType)
  courseType: CourseType

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  programId: string
}

export class CourseOut {
  constructor(args?: Required<CourseOut>) {
    if (args) {
      Object.assign(this, args)
    }
  }

  @ApiProperty()
  @IsString()
  id: string

  @ApiProperty({ example: 'CS101' })
  @IsString()
  code: string

  @ApiProperty({ example: 'Data Structures' })
  @IsString()
  name: string

  @ApiProperty({ example: 3 })
  @IsInt()
  credits: number

  @ApiProperty({ example: 1 })
  @IsInt()
  semester: number

  @ApiProperty({ enum: CourseType, example: CourseType.mandatory })
  @IsEnum(CourseType)
  courseType: CourseType

  @ApiProperty()
  @IsString()
  programId: string

  static fromCourse(course: Course) {
    return new CourseOut(course)
  }
}

export class CoursesQuery extends PaginationQuery {
  constructor(args?: Partial<CoursesQuery>) {
    super()
    if (args) {
      Object.assign(this, args)
    }
  }

  @ApiProperty({
    description: 'Filter courses by program ID',
    required: false,
  })
  @IsString()
  @IsOptional()
  programId?: string

  @ApiProperty({
    description: 'Filter courses by semester number',
    required: false,
    example: 1,
  })
  @Transform(({ value }) =>
    value === undefined || value === '' ? undefined : Number(value),
  )
  @IsInt()
  @Min(1)
  @IsOptional()
  semester?: number

  @ApiProperty({
    description: 'Filter courses by course type',
    enum: CourseType,
    required: false,
    example: CourseType.mandatory,
  })
  @IsEnum(CourseType)
  @IsOptional()
  courseType?: CourseType

  @ApiProperty({
    description: 'Filter courses by code or name',
    required: false,
    example: 'CS101',
  })
  @IsString()
  @IsOptional()
  search?: string
}
