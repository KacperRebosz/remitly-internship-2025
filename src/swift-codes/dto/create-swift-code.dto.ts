import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  Length,
  Matches,
  IsOptional,
  IsBoolean,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  MaxLength,
} from 'class-validator';

@ValidatorConstraint({ name: 'IsHeadquarterMatchingSwiftCode', async: false })
export class IsHeadquarterMatchingSwiftCodeConstraint
  implements ValidatorConstraintInterface
{
  validate(isHeadquarter: boolean, args: ValidationArguments): boolean {
    const object = args.object as CreateSwiftCodeDto;
    const swiftCode = object.swiftCode;

    if (!swiftCode) {
      return false;
    }

    const endsWithXXX = swiftCode.toUpperCase().endsWith('XXX');
    return isHeadquarter === endsWithXXX;
  }

  defaultMessage(args: ValidationArguments): string {
    const isHeadquarter = (args.object as CreateSwiftCodeDto).isHeadquarter;
    if (isHeadquarter) {
      return 'isHeadquarter is true, but SWIFT code must end with XXX';
    } else {
      return 'isHeadquarter is false, but SWIFT code must not end with XXX';
    }
  }
}

export class CreateSwiftCodeDto {
  @ApiProperty({
    description: 'The 11-character alphanumeric SWIFT/BIC code.',
    example: 'DEUTDEFFXXX',
    minLength: 11,
    maxLength: 11,
    pattern: '^[A-Za-z0-9]{11}$',
  })
  @IsString({ message: 'SWIFT code must be a string.' })
  @Length(11, 11, { message: 'SWIFT code must be exactly 11 characters long.' })
  @Matches(/^[A-Za-z0-9]{11}$/, { message: 'SWIFT code must be alphanumeric.' })
  @Transform(({ value }: { value: string }) => value.toUpperCase())
  swiftCode: string;

  @ApiProperty({
    description: 'The name of the bank or financial institution.',
    example: 'Deutsche Bank AG',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty({ message: 'Bank name cannot be empty.' })
  bankName: string;

  @ApiProperty({
    description: 'The street address of the bank branch or headquarters.',
    example: 'Taunusanlage 12',
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string | null;

  @ApiProperty({
    description: 'The town or city name.',
    example: 'Frankfurt am Main',
    required: false,
  })
  @IsOptional()
  @IsString()
  townName?: string | null;

  @ApiProperty({
    description: 'The full name of the country.',
    example: 'GERMANY',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty({ message: 'Country name cannot be empty.' })
  @Transform(({ value }: { value: string }) => value.toUpperCase())
  countryName: string;

  @ApiProperty({
    description: 'The 2-character uppercase ISO 3166-1 alpha-2 country code.',
    example: 'DE',
    minLength: 2,
    maxLength: 2,
    pattern: '^[A-Za-z]{2}$',
  })
  @IsString()
  @Length(2, 2, { message: 'Country ISO2 code must be exactly 2 characters.' })
  @Matches(/^[A-Za-z]{2}$/, {
    message: 'Country ISO2 code must contain only letters.',
  })
  @Transform(({ value }: { value: string }) => value.toUpperCase())
  countryISO2: string;

  @ApiProperty({
    description:
      'Flag indicating if this SWIFT code represents a headquarters (true) or a branch (false). Must align with the SWIFT code ending (XXX for true).',
    example: true,
  })
  @IsBoolean({
    message: 'isHeadquarter must be a boolean value (true or false).',
  })
  @Validate(IsHeadquarterMatchingSwiftCodeConstraint)
  isHeadquarter: boolean;

  @ApiProperty({
    description: 'The IANA time zone identifier.',
    example: 'Europe/Berlin',
    required: false,
  })
  @IsOptional()
  @IsString()
  timeZone?: string | null;

  @ApiProperty({
    description: 'The type of the code (e.g., BIC11). Max 5 chars.',
    example: 'BIC11',
    maxLength: 5,
  })
  @IsString()
  @IsNotEmpty({ message: 'Code type cannot be empty.' })
  @MaxLength(5, { message: 'Code type cannot exceed 5 characters.' })
  codeType: string;
}
