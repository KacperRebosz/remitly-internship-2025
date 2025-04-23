import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { SwiftCodeListItemDto } from './swift-code-list-item.dto';
import { BranchDetailResponseDto } from './branch-detail-response.dto';

export class HeadquarterDetailResponseDto extends BranchDetailResponseDto {
  @ApiProperty({
    type: [SwiftCodeListItemDto],
    description: 'List of associated branch SWIFT codes.',
  })
  @Type(() => SwiftCodeListItemDto)
  branches: SwiftCodeListItemDto[];
}
