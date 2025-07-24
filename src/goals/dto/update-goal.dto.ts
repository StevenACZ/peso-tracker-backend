import { IsOptional, IsNumber, IsDateString, IsString, IsIn, Min, Max, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateGoalDto {
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(1)
  @Max(999.9)
  @Type(() => Number)
  targetWeight?: number;

  @IsOptional()
  @IsDateString()
  targetDate?: string;

  @IsOptional()
  @IsString()
  @IsIn(['main', 'milestone'])
  type?: string;

  @IsOptional()
  @ValidateIf((o) => o.parentGoalId !== undefined && o.parentGoalId !== null && o.parentGoalId !== '')
  @IsNumber()
  @Type(() => Number)
  parentGoalId?: number;

  @IsOptional()
  @ValidateIf((o) => o.milestoneNumber !== undefined && o.milestoneNumber !== null && o.milestoneNumber !== '')
  @IsNumber()
  @Type(() => Number)
  milestoneNumber?: number;
}