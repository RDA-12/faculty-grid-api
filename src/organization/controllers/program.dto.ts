import { ApiProperty } from '@nestjs/swagger'
import { IsEnum, IsOptional, IsString } from 'class-validator'
import { Program, ProgramDegreeLevel } from '../entities/program.entity.js'
import { PaginationQuery } from '../../common/pagination.js'

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

export class ProgramsQuery extends PaginationQuery {
  constructor(args?: Partial<ProgramsQuery>) {
    super()
    if (args) {
      Object.assign(this, args)
    }
  }

  @ApiProperty({ description: 'Filter program by faculty', required: false })
  @IsString()
  @IsOptional()
  facultyId?: string

  @ApiProperty({ description: 'Filter program by its name', required: false })
  @IsString()
  @IsOptional()
  search?: string
}
