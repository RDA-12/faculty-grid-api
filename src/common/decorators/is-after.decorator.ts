import {
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
  ValidatorConstraint,
  type ValidatorConstraintInterface,
} from 'class-validator'

export type IsAfterOptions = ValidationOptions & { strict?: boolean }

@ValidatorConstraint({ name: 'IsAfter', async: false })
export class IsAfterConstraint implements ValidatorConstraintInterface {
  validate(endDate: unknown, args: ValidationArguments): boolean {
    const [relatedPropertyName, strict] = args.constraints as [string, boolean]
    const startDate = (args.object as Record<string, unknown>)[
      relatedPropertyName
    ]

    if (
      (typeof startDate !== 'string' && !(startDate instanceof Date)) ||
      (typeof endDate !== 'string' && !(endDate instanceof Date)) ||
      !startDate ||
      !endDate
    ) {
      return true
    }

    const parsedStart = new Date(startDate).getTime()
    const parsedEnd = new Date(endDate).getTime()
    if (Number.isNaN(parsedStart) || Number.isNaN(parsedEnd)) {
      return true
    }

    return strict ? parsedEnd > parsedStart : parsedEnd >= parsedStart
  }

  defaultMessage(args: ValidationArguments): string {
    const [relatedPropertyName, strict] = args.constraints as [string, boolean]
    return strict
      ? `${args.property} must be after ${relatedPropertyName}`
      : `${args.property} must not be earlier than ${relatedPropertyName}`
  }
}

export function IsAfter(property: string, options?: IsAfterOptions) {
  const { strict = false, ...validationOptions } = options ?? {}
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [property, strict],
      validator: IsAfterConstraint,
    })
  }
}
