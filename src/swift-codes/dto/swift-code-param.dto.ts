import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, Length, Matches } from 'class-validator';

export class SwiftCodeParamDto {
  @ApiProperty({
    description: 'The 11-character SWIFT code parameter.',
    example: 'DEUTDEFFXXX',
    minLength: 11,
    maxLength: 11,
    pattern: '^[A-Za-z0-9]{11}$',
  })
  @IsString()
  @Length(11, 11)
  @Matches(/^[A-Za-z0-9]{11}$/)
  @Transform(({ value }) => String(value).toUpperCase())
  swiftCode: string;
}
