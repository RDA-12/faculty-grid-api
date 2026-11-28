import { ApiProperty } from '@nestjs/swagger'
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { Rank, RankType } from '../entities/rank.entity.js'
import { PaginationQuery } from '../../common/pagination.js'

export class CreateRankDTO {
  constructor(args?: Partial<CreateRankDTO>) {
    if (args) {
      Object.assign(this, args)
    }
  }

  @ApiProperty({
    description:
      'Rank name including grade when applicable (e.g., "Penata Muda (III/a)" for ASN or "Mayor" for military)',
  })
  @IsString()
  @IsNotEmpty()
  name: string

  @ApiProperty({ enum: RankType })
  @IsEnum(RankType)
  type: RankType
}

export class UpdateRankDTO {
  constructor(args?: Partial<UpdateRankDTO>) {
    if (args) {
      Object.assign(this, args)
    }
  }

  @ApiProperty({
    description:
      'Rank name including grade when applicable (e.g., "Penata Muda (III/a)" for ASN or "Mayor" for military)',
  })
  @IsString()
  @IsNotEmpty()
  name: string

  @ApiProperty({ enum: RankType })
  @IsEnum(RankType)
  type: RankType
}

export class RankOut {
  constructor(args?: Required<RankOut>) {
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

  @ApiProperty({ enum: RankType })
  @IsEnum(RankType)
  type: RankType

  static fromRank(rank: Rank) {
    return new RankOut(rank)
  }
}

export class RanksQuery extends PaginationQuery {
  constructor(args?: Partial<RanksQuery>) {
    super()
    if (args) {
      Object.assign(this, args)
    }
  }

  @ApiProperty({
    description: 'Filter rank by type',
    enum: RankType,
    required: false,
  })
  @IsEnum(RankType)
  @IsOptional()
  type?: RankType

  @ApiProperty({
    description: 'Filter rank by its name',
    required: false,
  })
  @IsString()
  @IsOptional()
  search?: string
}
