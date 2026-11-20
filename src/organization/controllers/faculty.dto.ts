import { IsString } from 'class-validator'
import { Faculty } from '../entities/faculty.entity.js'
import { ApiProperty } from '@nestjs/swagger'

export class CreateFacultyDTO {
  @ApiProperty()
  @IsString()
  name: string
}

export class FacultyOut {
  constructor({ name }: Required<FacultyOut>) {
    this.name = name
  }

  @ApiProperty()
  @IsString()
  name: string

  static fromFaculty(faculty: Faculty) {
    return new FacultyOut({ name: faculty.name })
  }
}
