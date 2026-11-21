import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsInt, IsOptional } from 'class-validator'

/**
 * Representing single pagination to filter out data
 */
export class Pagination {
  constructor({ page = 1, pageSize = 10 }: Partial<Pagination>) {
    this.page = page
    this.pageSize = pageSize
  }

  readonly page: number
  readonly pageSize: number
}

/**
 * Representing single pagination result
 */
export class PaginationResult extends Pagination {
  constructor({ page, pageSize, total }: Required<PaginationResult>) {
    super({ page: page, pageSize: pageSize })
    this.total = total
  }

  readonly total: number
}

export class PaginationOut {
  constructor(args: Required<PaginationOut>) {
    if (args) {
      Object.assign(this, args)
    }
  }

  @ApiProperty({ description: 'total data on database' })
  total: number

  @ApiProperty({ description: 'current page' })
  page: number

  @ApiProperty({ description: 'size of each page' })
  pageSize: number

  static fromPaginationResult(result: PaginationResult) {
    return new PaginationOut(result)
  }
}

/**
 * Add pagintaion into list data of T
 */
export class PaginatedResult<T> {
  constructor(args: Partial<PaginatedResult<T>>) {
    Object.assign(this, args)
  }

  readonly data: T[]
  readonly pagination: PaginationResult

  mapData<R>(fn: (it: T) => R): PaginatedResult<R> {
    return new PaginatedResult({
      data: this.data.map(fn),
      pagination: this.pagination,
    })
  }
}

export class PaginationQuery {
  @ApiProperty({ required: false, default: 1 })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  page?: number

  @ApiProperty({ required: false, default: 10 })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  pageSize?: number
}
