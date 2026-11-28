import { Module } from '@nestjs/common'
import { RankController } from './controllers/rank.controller.js'
import { FunctionalRankController } from './controllers/functional-rank.controller.js'
import { RankRepository } from './repositories/rank.repository.js'
import { FunctionalRankRepository } from './repositories/functional-rank.repository.js'
import { CreateRankUseCase } from './use-cases/create-rank.use-case.js'
import { GetRanksUseCase } from './use-cases/get-ranks.use-case.js'
import { GetRankByIdUseCase } from './use-cases/get-rank-by-id.use-case.js'
import { UpdateRankUseCase } from './use-cases/update-rank.use-case.js'
import { DeleteRankUseCase } from './use-cases/delete-rank.use-case.js'
import { CreateFunctionalRankUseCase } from './use-cases/create-functional-rank.use-case.js'
import { GetFunctionalRanksUseCase } from './use-cases/get-functional-ranks.use-case.js'
import { GetFunctionalRankByIdUseCase } from './use-cases/get-functional-rank-by-id.use-case.js'
import { UpdateFunctionalRankUseCase } from './use-cases/update-functional-rank.use-case.js'
import { DeleteFunctionalRankUseCase } from './use-cases/delete-functional-rank.use-case.js'

/**
 * Handle lecturer master data and academic profiles
 */
@Module({
  controllers: [RankController, FunctionalRankController],
  providers: [
    RankRepository,
    FunctionalRankRepository,
    CreateRankUseCase,
    GetRanksUseCase,
    GetRankByIdUseCase,
    UpdateRankUseCase,
    DeleteRankUseCase,
    CreateFunctionalRankUseCase,
    GetFunctionalRanksUseCase,
    GetFunctionalRankByIdUseCase,
    UpdateFunctionalRankUseCase,
    DeleteFunctionalRankUseCase,
  ],
})
export class LecturerModule {}
