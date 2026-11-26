import { IsOptional, IsString } from 'class-validator'
import { Faculty } from '../entities/faculty.entity.js'
import { ApiProperty } from '@nestjs/swagger'
import { PaginationQuery } from '../../common/pagination.js'

export class CreateFacultyDTO {
  @ApiProperty()
  @IsString()
  name: string
}

export class FacultyOut {
  constructor({ id, name }: Required<FacultyOut>) {
    this.id = id
    this.name = name
  }

  @ApiProperty()
  @IsString()
  id: string

  @ApiProperty()
  @IsString()
  name: string

  static fromFaculty(faculty: Faculty) {
    return new FacultyOut({ id: faculty.id, name: faculty.name })
  }
}

export class GetFacultiesQuery extends PaginationQuery {
  constructor(args?: Partial<GetFacultiesQuery>) {
    super()
    if (args) {
      Object.assign(this, args)
    }
  }

  @ApiProperty({ description: 'Search faculties by its name', required: false })
  @IsOptional()
  @IsString()
  search?: string
}
