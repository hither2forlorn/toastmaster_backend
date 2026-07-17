import { Controller, Get, Query } from '@nestjs/common';
import { RoleService } from './role.service';
import { RoleCategory } from './enum/role-category.enum';

@Controller('roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  async getRoles(@Query('category') category?: RoleCategory) {
    const roles = category
      ? await this.roleService.getRolesByCategory(category)
      : await this.roleService.getRolesByCategory(RoleCategory.AGENDA);
    return roles.map((role) => ({
      id: role.id,
      key: role.key,
      type: role.type,
      category: role.category,
      isAdmin: role.isAdmin,
    }));
  }
}
