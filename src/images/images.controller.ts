import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ImagesService } from './images.service';
// import { imageFileFilter } from './config/multer.config';
import { CreateImageDto } from './image-create.dto';
import { multerConfig, imageFileFilter } from './config/multer.config';

@Controller('images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) { }


  @UseGuards(JwtAuthGuard)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: CreateImageDto,
    @Req() req,
  ) {
    if (!file) throw new BadRequestException('Nenhum arquivo recebido');
    return this.imagesService.create(req.user.id, file, body);
  }
}