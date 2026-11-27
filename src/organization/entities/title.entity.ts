export enum TitleScope {
  faculty = 'faculty',
  program = 'program',
}

type TitleConstructor = {
  id: string
  name: string
  scope: TitleScope
}

/**
 * Representing single structural title within the organization
 */
export class Title {
  constructor({ id, name, scope }: TitleConstructor) {
    this.id = id
    this.name = name
    this.scope = scope
  }

  readonly id: string
  readonly name: string
  readonly scope: TitleScope
}
