import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { AgendaTemplateService } from './agenda-template.service';
import { CreateAgendaTemplateDto } from './dtos/create-agenda-template.dto';
import { UpdateAgendaTemplateDto } from './dtos/update-agenda-template.dto';
import { AgendaTemplateResponseDto } from './dtos/agenda-template-response.dto';
import { MembershipGuard } from 'src/common/guards/membership.guard';
import { Roles } from 'src/common/decorators/role.decorator';
import { ClubRole } from '../club/enum/club-role.enum';
import { Public } from 'src/common/decorators/public.decorator';
import { AgendaTemplateItemDto } from './dtos/agenda-item.dto';
import {
  DuplicateTemplateDto,
  ReorderItemsDto,
} from './dtos/template-actions.dto';

@ApiTags('Agenda Templates - System')
@Controller('agenda-templates')
export class SystemTemplateController {
  constructor(private readonly templateService: AgendaTemplateService) {}

  @Public()
  @Get('system')
  @ApiOperation({ summary: 'Get all system templates (public)' })
  @ApiResponse({ status: 200, type: [AgendaTemplateResponseDto] })
  getSystemTemplates() {
    return this.templateService.getSystemTemplates();
  }

  @Public()
  @Get('system/:id')
  @ApiOperation({ summary: 'Get system template by ID (public)' })
  @ApiResponse({ status: 200, type: AgendaTemplateResponseDto })
  getSystemTemplateById(@Param('id') id: string) {
    return this.templateService.getTemplateById(id);
  }
}

@ApiTags('Agenda Templates - Club')
@ApiBearerAuth()
@UseGuards(MembershipGuard)
@Controller('clubs/:clubId/agenda-templates')
export class ClubTemplateController {
  constructor(private readonly templateService: AgendaTemplateService) {}

  @Get()
  @ApiOperation({ summary: 'Get templates for club' })
  @ApiQuery({
    name: 'includeSystem',
    required: false,
    type: Boolean,
    description: 'Include system templates in response',
  })
  @ApiResponse({ status: 200, type: [AgendaTemplateResponseDto] })
  getTemplates(
    @Param('clubId') clubId: string,
    @Query('includeSystem') includeSystem?: string,
  ) {
    if (includeSystem === 'true') {
      return this.templateService.getAvailableTemplatesForClub(clubId);
    }
    return this.templateService.getClubTemplates(clubId);
  }

  @Get('default')
  @ApiOperation({ summary: 'Get default template for club' })
  @ApiResponse({ status: 200, type: AgendaTemplateResponseDto })
  getDefaultTemplate(@Param('clubId') clubId: string) {
    return this.templateService.getDefaultTemplateForClub(clubId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get template by ID' })
  @ApiResponse({ status: 200, type: AgendaTemplateResponseDto })
  getTemplateById(@Param('id') id: string) {
    return this.templateService.getTemplateById(id);
  }

  @Roles(ClubRole.OWNER, ClubRole.ADMIN)
  @Post()
  @ApiOperation({ summary: 'Create a new template for club' })
  @ApiResponse({ status: 201, type: AgendaTemplateResponseDto })
  createTemplate(
    @Param('clubId') clubId: string,
    @Body() dto: CreateAgendaTemplateDto,
  ) {
    return this.templateService.createTemplate(dto, clubId);
  }

  @Roles(ClubRole.OWNER, ClubRole.ADMIN)
  @Patch(':id')
  @ApiOperation({ summary: 'Update template' })
  @ApiResponse({ status: 200, type: AgendaTemplateResponseDto })
  updateTemplate(
    @Param('clubId') clubId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAgendaTemplateDto,
  ) {
    return this.templateService.updateTemplate(id, dto, clubId);
  }

  @Roles(ClubRole.OWNER, ClubRole.ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete template' })
  @ApiResponse({ status: 200 })
  async deleteTemplate(
    @Param('clubId') clubId: string,
    @Param('id') id: string,
  ) {
    await this.templateService.deleteTemplate(id, clubId);
    return { message: 'Template deleted successfully' };
  }

  @Roles(ClubRole.OWNER, ClubRole.ADMIN)
  @Patch(':id/set-default')
  @ApiOperation({ summary: 'Set template as default' })
  @ApiResponse({ status: 200, type: AgendaTemplateResponseDto })
  setAsDefault(@Param('clubId') clubId: string, @Param('id') id: string) {
    return this.templateService.setAsDefault(id, clubId);
  }

  @Roles(ClubRole.OWNER, ClubRole.ADMIN)
  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate a template (system or club)' })
  @ApiResponse({ status: 201, type: AgendaTemplateResponseDto })
  duplicateTemplate(
    @Param('clubId') clubId: string,
    @Param('id') id: string,
    @Body() dto: DuplicateTemplateDto,
  ) {
    return this.templateService.duplicateTemplate(id, dto.name, clubId);
  }

  @Roles(ClubRole.OWNER, ClubRole.ADMIN)
  @Post(':id/items')
  @ApiOperation({ summary: 'Add item to template' })
  @ApiResponse({ status: 201, type: AgendaTemplateResponseDto })
  addItem(
    @Param('clubId') clubId: string,
    @Param('id') templateId: string,
    @Body() dto: AgendaTemplateItemDto,
  ) {
    return this.templateService.addItem(templateId, dto, clubId);
  }

  @Roles(ClubRole.OWNER, ClubRole.ADMIN)
  @Patch(':id/items/:itemId')
  @ApiOperation({ summary: 'Update single item in template' })
  @ApiResponse({ status: 200, type: AgendaTemplateResponseDto })
  updateItem(
    @Param('clubId') clubId: string,
    @Param('id') templateId: string,
    @Param('itemId') itemId: string,
    @Body() dto: Partial<AgendaTemplateItemDto>,
  ) {
    return this.templateService.updateItem(templateId, itemId, dto, clubId);
  }

  @Roles(ClubRole.OWNER, ClubRole.ADMIN)
  @Delete(':id/items/:itemId')
  @ApiOperation({ summary: 'Remove item from template' })
  @ApiResponse({ status: 200, type: AgendaTemplateResponseDto })
  removeItem(
    @Param('clubId') clubId: string,
    @Param('id') templateId: string,
    @Param('itemId') itemId: string,
  ) {
    return this.templateService.removeItem(templateId, itemId, clubId);
  }

  @Roles(ClubRole.OWNER, ClubRole.ADMIN)
  @Patch(':id/items/reorder')
  @ApiOperation({ summary: 'Reorder items in template' })
  @ApiResponse({ status: 200, type: AgendaTemplateResponseDto })
  reorderItems(
    @Param('clubId') clubId: string,
    @Param('id') templateId: string,
    @Body() dto: ReorderItemsDto,
  ) {
    return this.templateService.reorderItems(templateId, dto.itemIds, clubId);
  }
}
