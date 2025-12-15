import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, ArrayMinSize } from 'class-validator';

export class DuplicateTemplateDto {
  @ApiProperty({ example: 'My Custom Meeting Template' })
  @IsString()
  name: string;
}

export class ReorderItemsDto {
  @ApiProperty({
    example: ['item-id-1', 'item-id-2', 'item-id-3'],
    description: 'Array of item IDs in the desired order',
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  itemIds: string[];
}
