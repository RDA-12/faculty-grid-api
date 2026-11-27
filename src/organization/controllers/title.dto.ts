import { ApiProperty } from '@nestjs/swagger'
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { Title, TitleScope } from '../entities/title.entity.js'
import { PaginationQuery } from '../../common/pagination.js'

export class CreateTitleDTO {
  constructor(args?: Partial<CreateTitleDTO>) {
    if (args) {
      Object.assign(this, args)
    }
  }

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string

  @ApiProperty({ enum: TitleScope })
  @IsEnum(TitleScope)
  scope: TitleScope
}

export class UpdateTitleDTO {
  constructor(args?: Partial<UpdateTitleDTO>) {
    if (args) {
      Object.assign(this, args)
    }
  }

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string

  @ApiProperty({ enum: TitleScope })
  @IsEnum(TitleScope)
  scope: TitleScope
}

export class TitleOut {
  constructor(args?: Required<TitleOut>) {
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

  @ApiProperty({ enum: TitleScope })
  @IsEnum(TitleScope)
  scope: TitleScope

  static fromTitle(title: Title) {
    return new TitleOut(title)
  }
}

export class TitlesQuery extends PaginationQuery {
  constructor(args?: Partial<TitlesQuery>) {
    super()
    if (args) {
      Object.assign(this, args)
    }
  }

  @ApiProperty({
    description: 'Filter title by scope',
    enum: TitleScope,
    required: false,
  })
  @IsEnum(TitleScope)
  @IsOptional()
  scope?: TitleScope

  @ApiProperty({ description: 'Filter title by its name', required: false })
  @IsString()
  @IsOptional()
  search?: string
}
