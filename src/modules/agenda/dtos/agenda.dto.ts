import { ApiProperty } from '@nestjs/swagger';

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
  agendaOrder: string[];
}
