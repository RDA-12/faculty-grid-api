import { Column, Entity } from 'typeorm'
import { AutoIdTimestampCreatedBy } from './common.entity.js'
import { Faculty } from '../../../organization/entities/faculty.entity.js'

@Entity('faculties')
export class FacultyDBEntity extends AutoIdTimestampCreatedBy {
  @Column()
  name: string

  toDomain(): Faculty {
    return new Faculty({
      id: this.id,
      name: this.name,
    })
  }
}
