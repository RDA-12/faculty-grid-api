import { ApiProperty } from '@nestjs/swagger'
import { IsEnum, IsString } from 'class-validator'
import { Program, ProgramDegreeLevel } from '../entities/program.entity.js'

export class CreateProgramDTO {
  constructor(args?: Partial<CreateProgramDTO>) {
    if (args) {
      Object.assign(this, args)
    }
  }

  @ApiProperty()
  @IsString()
  name: string

  @ApiProperty()
  @IsEnum(ProgramDegreeLevel)
  degreeLevel: ProgramDegreeLevel

  @ApiProperty()
  @IsString()
  facultyId: string
}

export class ProgramOut {
  constructor(args?: Required<ProgramOut>) {
    if (args) {
      Object.assign(this, args)
    }
  }

  @ApiProperty()
  @IsString()
  id: string

  @ApiProperty()
  @IsString()
  name: string

  @ApiProperty()
  @IsEnum(ProgramDegreeLevel)
  degreeLevel: ProgramDegreeLevel

  @ApiProperty()
  @IsString()
  facultyId: string

  static fromProgram(program: Program) {
    return new ProgramOut(program)
  }
}
