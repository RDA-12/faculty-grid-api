import { IsString } from 'class-validator'
import { Faculty } from '../entities/faculty.entity.js'
import { ApiProperty } from '@nestjs/swagger'

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
