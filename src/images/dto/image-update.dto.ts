import { PartialType } from '@nestjs/mapped-types';
import { CreateImageDto } from './image-create.dto';

export class UpdateImageDto extends PartialType(CreateImageDto) {}
