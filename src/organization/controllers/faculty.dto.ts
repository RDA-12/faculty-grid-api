import { IsString } from 'class-validator'
import { Faculty } from '../entities/faculty.entity.js'

export class CreateFacultyDTO {
  @IsString()
  name: string
}

export class FacultyOut {
  constructor({ name }: Required<FacultyOut>) {
    this.name = name
  }

  @IsString()
  name: string

  static fromFaculty(faculty: Faculty) {
    return new FacultyOut({ name: faculty.name })
  }
}
