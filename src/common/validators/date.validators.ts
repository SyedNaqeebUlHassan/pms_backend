import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
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
