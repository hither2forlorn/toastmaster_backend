import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class AssignRoleDto {
  @ApiProperty({
    description: 'Role to assign to agenda item',
    example: 'TOASTMASTER',
  })
  roleName: string;
}

export class ReorderAgendaDto {
  @ApiProperty({
    description: 'Array of agenda IDs in new order',
    example: ['agenda-123'],
  })
  @IsArray()
  @IsString({ each: true })
  agendaOrder: string[];

  @ApiProperty({
    description: 'Club ID',
    example: 'club-123',
  })
  @IsString()
  clubId: string;
}
