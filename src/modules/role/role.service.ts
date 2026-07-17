import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { RoleCategory } from './enum/role-category.enum';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
  ) {}

  async getRolesByCategory(category: RoleCategory): Promise<Role[]> {
    return this.roleRepo.find({
      where: { category },
      order: { createdAt: 'ASC' },
    });
  }

  async getAgendaRoles(): Promise<Role[]> {
    return this.getRolesByCategory(RoleCategory.AGENDA);
  }

  async getRoleByKey(key: string): Promise<Role | null> {
    return this.roleRepo.findOne({ where: { key } });
  }

  async getRoleById(id: string): Promise<Role | null> {
    return this.roleRepo.findOne({ where: { id } });
  }

  async getAgendaRoleByName(name: string): Promise<Role | null> {
    return this.roleRepo.findOne({
      where: { type: name, category: RoleCategory.AGENDA },
    });
  }

  async getRolesByKeys(keys: string[]): Promise<Role[]> {
    if (keys.length === 0) return [];
    return this.roleRepo.find({ where: { key: In(keys) } });
  }

  async getAgendaRoleNamesByKeys(keys: string[]): Promise<string[]> {
    const roles = await this.roleRepo.find({
      where: { category: RoleCategory.AGENDA },
    });
    return roles.filter((r) => keys.includes(r.key)).map((r) => r.type);
  }
}
