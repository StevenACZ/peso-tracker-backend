import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
  ValidationPipeOptions,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  constructor(private options?: ValidationPipeOptions) {}

  async transform(value: any, { metatype }: ArgumentMetadata) {
    // console.log('=== VALIDATION PIPE DEBUG ===');
    // console.log('Input value:', value);
    // console.log('Input type:', typeof value);
    // console.log('Metatype:', metatype?.name);
    // console.log('==============================');

    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    // ✅ Agrega enableImplicitConversion: true para habilitar transformaciones
    const object: object = plainToInstance(metatype, value, {
      enableImplicitConversion: true, // ← Esto es clave
      excludeExtraneousValues: false, // ← Cambiado a false para no excluir propiedades
    });

    // console.log('=== AFTER TRANSFORMATION ===');
    // console.log('Transformed object:', object);
    // console.log('=============================');

    const errors = await validate(object, this.options);

    if (errors.length > 0) {
      // console.log('=== VALIDATION ERRORS ===');
      // console.log('Errors:', errors);
      // console.log('=========================');

      const errorMessages = errors.map((error) => {
        return Object.values(error.constraints || {}).join(', ');
      });

      throw new BadRequestException({
        message: 'Datos de entrada inválidos',
        errors: errorMessages,
      });
    }

    return object;
  }

  private toValidate(metatype: { new (): any } | Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
