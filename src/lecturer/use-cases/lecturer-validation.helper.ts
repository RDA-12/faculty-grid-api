import {
  InvalidRequestError,
  InvalidRequestException,
} from '../../common/app-exception.js'
import { AppResult } from '../../common/app-result.js'
import { EmploymentStatus } from '../entities/lecturer.entity.js'
import { RankType } from '../entities/rank.entity.js'
import type { RankRepository } from '../repositories/rank.repository.js'
import type { FunctionalRankRepository } from '../repositories/functional-rank.repository.js'

type LecturerReferenceParams = {
  employmentStatus: EmploymentStatus
  rankId: string | null
  functionalRankId: string | null
}

/**
 * Validates lecturer rank and functional rank constraints against employmentStatus
 */
export async function validateLecturerReferences(
  params: LecturerReferenceParams,
  rankRepository: RankRepository,
  functionalRankRepository: FunctionalRankRepository,
): Promise<AppResult<null>> {
  const requiresRank =
    params.employmentStatus === EmploymentStatus.asn ||
    params.employmentStatus === EmploymentStatus.military

  if (requiresRank && !params.rankId) {
    return AppResult.failed(
      new InvalidRequestException([
        new InvalidRequestError({
          property: 'rankId',
          value: params.rankId,
          constraints: [
            `rankId is required when employmentStatus is ${params.employmentStatus}`,
          ],
        }),
      ]),
    )
  }

  if (params.rankId) {
    const rankResult = await rankRepository.getById(params.rankId)
    if (rankResult.exception) {
      return AppResult.failed(rankResult.exception)
    }
    const rank = rankResult.data!
    const typeMatches =
      (params.employmentStatus === EmploymentStatus.asn &&
        rank.type === RankType.asn) ||
      (params.employmentStatus === EmploymentStatus.military &&
        rank.type === RankType.military) ||
      params.employmentStatus === EmploymentStatus.contract

    if (!typeMatches) {
      return AppResult.failed(
        new InvalidRequestException([
          new InvalidRequestError({
            property: 'rankId',
            value: params.rankId,
            constraints: [
              `rank type ${rank.type} does not match employmentStatus ${params.employmentStatus}`,
            ],
          }),
        ]),
      )
    }
  }

  if (params.functionalRankId) {
    const functionalRankResult = await functionalRankRepository.getById(
      params.functionalRankId,
    )
    if (functionalRankResult.exception) {
      return AppResult.failed(functionalRankResult.exception)
    }
  }

  return AppResult.success(null)
}
