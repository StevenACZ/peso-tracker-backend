import { IsNumber, IsDateString, IsString, IsIn, IsOptional, Min, Max } from 'class-validator';

export class CreateGoalDto {
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(1)
  @Max(999.9)
  targetWeight: number;

  @IsDateString()
  targetDate: string;

  @IsOptional()
  @IsString()
  @IsIn(['main', 'milestone'])
  type?: string;

  parentGoalId?: number;

  milestoneNumber?: number;
}