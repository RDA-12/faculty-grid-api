export enum CourseType {
  mandatory = 'mandatory',
  elective = 'elective',
}

type CourseConstructor = {
  id: string
  code: string
  name: string
  credits: number
  semester: number
  courseType: CourseType
  programId: string
}

/**
 * Representing a course offered by a program per semester
 */
export class Course {
  constructor({
    id,
    code,
    name,
    credits,
    semester,
    courseType,
    programId,
  }: CourseConstructor) {
    this.id = id
    this.code = code
    this.name = name
    this.credits = credits
    this.semester = semester
    this.courseType = courseType
    this.programId = programId
  }

  readonly id: string
  readonly code: string
  readonly name: string
  readonly credits: number
  readonly semester: number
  readonly courseType: CourseType
  readonly programId: string
}
