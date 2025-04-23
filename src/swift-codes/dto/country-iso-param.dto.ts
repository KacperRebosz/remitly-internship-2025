import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, Length, Matches } from 'class-validator';

export class CountryIsoParamDto {
  @ApiProperty({
    description: 'ISO 3166-1 alpha-2 country code (2 uppercase letters)',
    example: 'PL',
  })
  @IsString()
  @Length(2, 2, { message: 'Country ISO code must be exactly 2 characters' })
  @Matches(/^[A-Z]{2}$/, {
    message: 'Country ISO code must be 2 uppercase letters',
  })
  @Transform(({ value }) => String(value).toUpperCase())
  countryISO2code: string;
}
