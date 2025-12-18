import { Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateImageDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoryId: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Type(() => String)
  tags?: string[];

  @IsOptional()
  @IsString()
  description?: string;
}
