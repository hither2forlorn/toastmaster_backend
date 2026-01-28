import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class PendingRequestDecisionDto {
    @ApiProperty({
        example: 'club-uuid-1234',
        description: 'The club ID for which the join request is pending',
    })
    @IsOptional()
    @IsString()
    clubId: string;

    @ApiProperty({
        example: 'member-uuid-1234',
        description: 'The member ID who has requested to join the club',
    })
    @IsOptional()
    @IsString()
    memberId: string;

    @ApiProperty({
        example: 'true',
        description: 'The decision for the pending request (true/false)',
    })
    @IsBoolean()
    decision: boolean;
}