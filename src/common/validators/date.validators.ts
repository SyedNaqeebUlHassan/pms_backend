import {
  registerDecorator,
  ValidateBy,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

// ── IsPastDate ─────────────────────────────────────────────────────────
// Ensures the date is strictly before today (for DOB — no future / current date)

@ValidatorConstraint({ name: 'IsPastDate', async: false })
class IsPastDateConstraint implements ValidatorConstraintInterface {
  validate(value: string): boolean {
    const date = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  }

  defaultMessage(): string {
    return 'Date must be a past date.';
  }
}

export function IsPastDate(options?: ValidationOptions) {
  return (object: object, propertyName: string) =>
    registerDecorator({
      target: object.constructor,
      propertyName,
      options,
      constraints: [],
      validator: IsPastDateConstraint,
    });
}

// ── IsFutureDate ────────────────────────────────────────────────────────
// Ensures the date is strictly after today (for punishment end_date)

@ValidatorConstraint({ name: 'IsFutureDate', async: false })
class IsFutureDateConstraint implements ValidatorConstraintInterface {
  validate(value: string): boolean {
    const date = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date > today;
  }

  defaultMessage(): string {
    return 'Date must be a future date.';
  }
}

export function IsFutureDate(options?: ValidationOptions) {
  return (object: object, propertyName: string) =>
    registerDecorator({
      target: object.constructor,
      propertyName,
      options,
      constraints: [],
      validator: IsFutureDateConstraint,
    });
}

// IsNotFutureDateTime — full datetime must not be in the future (for incident_date_time)
@ValidatorConstraint({ name: 'IsNotFutureDateTime', async: false })
class IsNotFutureDateTimeConstraint implements ValidatorConstraintInterface {
  validate(value: string): boolean {
    if (!value) return true; // let @IsDateString / @IsNotEmpty handle empty
    return new Date(value) <= new Date(); // compares full datetime including time
  }
  defaultMessage(): string {
    return 'Incident date and time cannot be in the future.';
  }
}

export function IsNotFutureDateTime(
  options?: ValidationOptions,
): PropertyDecorator {
  return ValidateBy(
    {
      name: 'IsNotFutureDateTime',
      validator: new IsNotFutureDateTimeConstraint(),
    },
    options,
  );
}

export function IsAfterTime(
  property: string,
  options?: ValidationOptions,
): PropertyDecorator {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'IsAfterTime',
      target: object.constructor,
      propertyName,
      constraints: [property],
      options,
      validator: {
        validate(value: string, args: ValidationArguments): boolean {
          const [relatedPropertyName] = args.constraints as [string];
          const relatedValue = (args.object as Record<string, string>)[
            relatedPropertyName
          ];
          if (!value || !relatedValue) return true; // let other validators handle empty
          return value > relatedValue; // "14:00" > "08:00" works because HH:MM string comparison is lexicographic
        },
        defaultMessage(args: ValidationArguments): string {
          const [relatedPropertyName] = args.constraints as [string];
          return `${args.property} must be later than ${relatedPropertyName}.`;
        },
      },
    });
  };
}
