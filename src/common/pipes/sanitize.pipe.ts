import {
  Injectable,
  PipeTransform,
  ArgumentMetadata,
  Type,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { sanitize } from 'class-sanitizer';

@Injectable()
export class SanitizePipe implements PipeTransform<unknown, unknown> {
  transform(value: any, { metatype }: ArgumentMetadata): unknown {
    if (!metatype || !this.toSanitize(metatype)) {
      return value;
    }

    const object = plainToInstance(metatype as Type<unknown>, value);
    sanitize(object);
    return object;
  }

  private toSanitize(metatype: Type<unknown>): boolean {
    const types: Type<unknown>[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
