import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { FunctionalRank } from '../entities/functional-rank.entity.js'
import { PaginationQuery } from '../../common/pagination.js'

export class CreateFunctionalRankDTO {
  constructor(args?: Partial<CreateFunctionalRankDTO>) {
    if (args) {
      Object.assign(this, args)
    }
  }

  @ApiProperty({
    description: 'Name of the functional rank',
    example: 'Lektor',
  })
  @IsString()
  @IsNotEmpty()
  name: string
}

export class UpdateFunctionalRankDTO {
  constructor(args?: Partial<UpdateFunctionalRankDTO>) {
    if (args) {
      Object.assign(this, args)
    }
  }

  @ApiProperty({
    description: 'Name of the functional rank',
    example: 'Lektor',
  })
  @IsString()
  @IsNotEmpty()
  name: string
}

export class FunctionalRankOut {
  constructor(args?: Required<FunctionalRankOut>) {
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

  static fromFunctionalRank(functionalRank: FunctionalRank) {
    return new FunctionalRankOut(functionalRank)
  }
}

export class FunctionalRanksQuery extends PaginationQuery {
  constructor(args?: Partial<FunctionalRanksQuery>) {
    super()
    if (args) {
      Object.assign(this, args)
    }
  }

  @ApiProperty({
    description: 'Filter functional rank by its name',
    required: false,
  })
  @IsString()
  @IsOptional()
  search?: string
}
