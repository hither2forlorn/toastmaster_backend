import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, IsNull, Not } from 'typeorm';
import { CreateAgendaTemplateDto } from './dtos/create-agenda-template.dto';
import { UpdateAgendaTemplateDto } from './dtos/update-agenda-template.dto';
import { AgendaTemplate } from './entity/agenda-template.entity';
import { AgendaTemplateItem } from './entity/agenda-item.entity';
import { AgendaTemplateItemDto } from './dtos/agenda-item.dto';

export interface TemplateFilter {
  clubId?: string;
  includeSystem?: boolean;
  onlyDefault?: boolean;
}

@Injectable()
export class AgendaTemplateService {
  constructor(
    @InjectRepository(AgendaTemplate)
    private templateRepo: Repository<AgendaTemplate>,
    @InjectRepository(AgendaTemplateItem)
    private itemRepo: Repository<AgendaTemplateItem>,
    private dataSource: DataSource,
  ) {}

  async getTemplates(filter: TemplateFilter): Promise<AgendaTemplate[]> {
    const { clubId, includeSystem = false, onlyDefault = false } = filter;

    const queryBuilder = this.templateRepo
      .createQueryBuilder('template')
      .leftJoinAndSelect('template.items', 'items')
      .orderBy('template.clubId', 'DESC')
      .addOrderBy('template.isDefault', 'DESC')
      .addOrderBy('template.name', 'ASC')
      .addOrderBy('items.sequence', 'ASC');

    if (clubId && includeSystem) {
      queryBuilder.where(
        '(template.clubId = :clubId OR template.clubId IS NULL)',
        { clubId },
      );
    } else if (clubId) {
      queryBuilder.where('template.clubId = :clubId', { clubId });
    } else {
      queryBuilder.where('template.clubId IS NULL');
    }

    if (onlyDefault) {
      queryBuilder.andWhere('template.isDefault = :isDefault', {
        isDefault: true,
      });
    }

    return queryBuilder.getMany();
  }

  async getSystemTemplates(): Promise<AgendaTemplate[]> {
    return this.getTemplates({ includeSystem: false });
  }

  async getAvailableTemplatesForClub(
    clubId: string,
  ): Promise<AgendaTemplate[]> {
    return this.getTemplates({ clubId, includeSystem: true });
  }

  async getClubTemplates(clubId: string): Promise<AgendaTemplate[]> {
    return this.getTemplates({ clubId, includeSystem: false });
  }

  async getDefaultTemplateForClub(
    clubId: string,
  ): Promise<AgendaTemplate | null> {
    let template = await this.templateRepo.findOne({
      where: { clubId, isDefault: true },
      relations: ['items'],
      order: { items: { sequence: 'ASC' } },
    });

    if (!template) {
      template = await this.templateRepo.findOne({
        where: { clubId: IsNull(), isDefault: true },
        relations: ['items'],
        order: { items: { sequence: 'ASC' } },
      });
    }

    return template;
  }

  async getTemplateById(id: string): Promise<AgendaTemplate> {
    const template = await this.templateRepo.findOne({
      where: { id },
      relations: ['items'],
      order: { items: { sequence: 'ASC' } },
    });

    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }

    return template;
  }

  async createTemplate(
    dto: CreateAgendaTemplateDto,
    clubId: string,
  ): Promise<AgendaTemplate> {
    return this.dataSource.transaction(async (manager) => {
      const templateRepo = manager.getRepository(AgendaTemplate);
      const itemRepo = manager.getRepository(AgendaTemplateItem);

      if (dto.isDefault) {
        await templateRepo.update({ clubId }, { isDefault: false });
      }

      const template = templateRepo.create({
        name: dto.name,
        description: dto.description,
        clubId,
        isDefault: dto.isDefault ?? false,
      });

      await templateRepo.save(template);

      if (dto.items && dto.items.length > 0) {
        const items = dto.items.map((item, index) =>
          itemRepo.create({
            ...item,
            sequence: item.sequence ?? index + 1,
            agendaTemplateId: template.id,
          }),
        );
        await itemRepo.save(items);
      }

      return this.getTemplateById(template.id);
    });
  }

  async updateTemplate(
    id: string,
    dto: UpdateAgendaTemplateDto,
    clubId: string,
  ): Promise<AgendaTemplate> {
    const template = await this.getTemplateById(id);

    if (!template.clubId) {
      throw new ForbiddenException('Cannot edit system templates');
    }

    if (template.clubId !== clubId) {
      throw new ForbiddenException('Cannot edit templates from another club');
    }

    return this.dataSource.transaction(async (manager) => {
      const templateRepo = manager.getRepository(AgendaTemplate);
      const itemRepo = manager.getRepository(AgendaTemplateItem);

      if (dto.isDefault && !template.isDefault) {
        await templateRepo.update(
          { clubId, id: Not(id) },
          { isDefault: false },
        );
      }

      if (dto.name !== undefined) template.name = dto.name;
      if (dto.description !== undefined) template.description = dto.description;
      if (dto.isDefault !== undefined) template.isDefault = dto.isDefault;

      await templateRepo.save(template);

      if (dto.items) {
        await itemRepo.delete({ agendaTemplateId: id });

        const newItems = dto.items.map((item, index) =>
          itemRepo.create({
            ...item,
            sequence: item.sequence ?? index + 1,
            agendaTemplateId: id,
          }),
        );
        await itemRepo.save(newItems);
      }

      return this.getTemplateById(id);
    });
  }

  async deleteTemplate(id: string, clubId: string): Promise<void> {
    const template = await this.getTemplateById(id);

    if (!template.clubId) {
      throw new ForbiddenException('Cannot delete system templates');
    }

    if (template.clubId !== clubId) {
      throw new ForbiddenException('Cannot delete templates from another club');
    }

    const clubTemplateCount = await this.templateRepo.count({
      where: { clubId },
    });

    if (clubTemplateCount === 1) {
      throw new BadRequestException(
        'Cannot delete the only template. Create another template first.',
      );
    }

    if (template.isDefault) {
      const anotherTemplate = await this.templateRepo.findOne({
        where: { clubId, id: Not(id) },
      });
      if (anotherTemplate) {
        await this.templateRepo.update(anotherTemplate.id, { isDefault: true });
      }
    }

    await this.templateRepo.delete(id);
  }

  async setAsDefault(id: string, clubId: string): Promise<AgendaTemplate> {
    const template = await this.getTemplateById(id);

    if (!template.clubId) {
      throw new BadRequestException(
        'Cannot set system templates as default. Duplicate it first.',
      );
    }

    if (template.clubId !== clubId) {
      throw new ForbiddenException('Cannot modify templates from another club');
    }

    await this.templateRepo.update(
      { clubId, id: Not(id) },
      { isDefault: false },
    );

    template.isDefault = true;
    await this.templateRepo.save(template);

    return this.getTemplateById(id);
  }

  async duplicateTemplate(
    id: string,
    name: string,
    clubId: string,
  ): Promise<AgendaTemplate> {
    const original = await this.getTemplateById(id);

    return this.dataSource.transaction(async (manager) => {
      const templateRepo = manager.getRepository(AgendaTemplate);
      const itemRepo = manager.getRepository(AgendaTemplateItem);

      const duplicate = templateRepo.create({
        name,
        description: original.description,
        clubId,
        isDefault: false,
      });

      await templateRepo.save(duplicate);

      if (original.items?.length > 0) {
        const items = original.items.map((item) =>
          itemRepo.create({
            title: item.title,
            systemRole: item.systemRole,
            customRole: item.customRole,
            duration: item.duration,
            sequence: item.sequence,
            agendaTemplateId: duplicate.id,
          }),
        );
        await itemRepo.save(items);
      }

      return this.getTemplateById(duplicate.id);
    });
  }

  async addItem(
    templateId: string,
    dto: AgendaTemplateItemDto,
    clubId: string,
  ): Promise<AgendaTemplate> {
    const template = await this.getTemplateById(templateId);

    if (!template.clubId) {
      throw new ForbiddenException('Cannot modify system templates');
    }

    if (template.clubId !== clubId) {
      throw new ForbiddenException('Cannot modify templates from another club');
    }

    const maxSequence =
      template.items.reduce((max, item) => Math.max(max, item.sequence), 0) + 1;

    const item = this.itemRepo.create({
      ...dto,
      sequence: dto.sequence ?? maxSequence,
      agendaTemplateId: templateId,
    });

    await this.itemRepo.save(item);

    return this.getTemplateById(templateId);
  }

  async updateItem(
    templateId: string,
    itemId: string,
    dto: Partial<AgendaTemplateItemDto>,
    clubId: string,
  ): Promise<AgendaTemplate> {
    const template = await this.getTemplateById(templateId);

    if (!template.clubId) {
      throw new ForbiddenException('Cannot modify system templates');
    }

    if (template.clubId !== clubId) {
      throw new ForbiddenException('Cannot modify templates from another club');
    }

    const item = template.items.find((i) => i.id === itemId);
    if (!item) {
      throw new NotFoundException(`Item with ID ${itemId} not found`);
    }

    await this.itemRepo.update(itemId, dto);

    return this.getTemplateById(templateId);
  }

  async removeItem(
    templateId: string,
    itemId: string,
    clubId: string,
  ): Promise<AgendaTemplate> {
    const template = await this.getTemplateById(templateId);

    if (!template.clubId) {
      throw new ForbiddenException('Cannot modify system templates');
    }

    if (template.clubId !== clubId) {
      throw new ForbiddenException('Cannot modify templates from another club');
    }

    const item = template.items.find((i) => i.id === itemId);
    if (!item) {
      throw new NotFoundException(`Item with ID ${itemId} not found`);
    }

    await this.itemRepo.delete(itemId);

    return this.getTemplateById(templateId);
  }

  async reorderItems(
    templateId: string,
    itemIds: string[],
    clubId: string,
  ): Promise<AgendaTemplate> {
    const template = await this.getTemplateById(templateId);

    if (!template.clubId) {
      throw new ForbiddenException('Cannot modify system templates');
    }

    if (template.clubId !== clubId) {
      throw new ForbiddenException('Cannot modify templates from another club');
    }

    // Validate all items belong to this template
    const templateItemIds = new Set(template.items.map((i) => i.id));
    for (const itemId of itemIds) {
      if (!templateItemIds.has(itemId)) {
        throw new BadRequestException(
          `Item ${itemId} does not belong to this template`,
        );
      }
    }

    await Promise.all(
      itemIds.map((itemId, index) =>
        this.itemRepo.update(itemId, { sequence: index + 1 }),
      ),
    );

    return this.getTemplateById(templateId);
  }
}
