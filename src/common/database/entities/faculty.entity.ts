import { Column, Entity, OneToMany, type Relation } from 'typeorm'
import { AutoIdTimestampCreatedBy } from './common.entity.js'
import { Faculty } from '../../../organization/entities/faculty.entity.js'
import { ProgramDBEntity } from './program.entity.js'

@Entity('faculties')
export class FacultyDBEntity extends AutoIdTimestampCreatedBy {
  @Column()
  name: string

  @OneToMany(() => ProgramDBEntity, (program) => program.faculty, {
    cascade: ['soft-remove', 'recover'],
  })
  programs: Relation<ProgramDBEntity[]>

  toDomain(): Faculty {
    return new Faculty({
      id: this.id,
      name: this.name,
    })
  }
}
