import {
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
  ValidatorConstraint,
  type ValidatorConstraintInterface,
} from 'class-validator'

@ValidatorConstraint({ name: 'IsAfter', async: false })
export class IsAfterConstraint implements ValidatorConstraintInterface {
  validate(endDate: unknown, args: ValidationArguments): boolean {
    const [relatedPropertyName] = args.constraints as [string]
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

    return parsedEnd >= parsedStart
  }

  defaultMessage(args: ValidationArguments): string {
    const [relatedPropertyName] = args.constraints as [string]
    return `${args.property} must not be earlier than ${relatedPropertyName}`
  }
}

export function IsAfter(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [property],
      validator: IsAfterConstraint,
    })
  }
}
