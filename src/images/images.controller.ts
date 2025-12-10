import {
  Controller,
  Request,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ImagesService } from './images.service';
import { imageFileFilter } from './config/multer.config';

@Controller('images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  // para uma imagem
  @UseGuards(JwtAuthGuard)
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: imageFileFilter,
    }),
  )
  uploadImage(@UploadedFile() file: Express.Multer.File, @Req() req) {
    return this.imagesService.saveImage(req.user.id, file);
  }

  // para várias imagens
  // @UseGuards(JwtAuthGuard)
  // @Post('upload')
  // @UseInterceptors(
  //   FilesInterceptor('file', {
  //     fileFilter: imageFileFilter,
  //   }),
  // )
  // uploadImage(@UploadedFile() file: Express.Multer.File, @Req() req) {
  //   return this.imagesService.saveImage(req.user.id, file);
  // }

  @UseGuards(JwtAuthGuard)
  @Get()
  async list(@Request() req) {
    const userId = req.user.sub;

    const images = await this.imagesService.findAllByUser(userId);

    return {
      total: images.length,
      images,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('restore/:id')
  async restore(@Param('id') id: string, @Req() req) {
    return this.imagesService.restore(req.user.sub, Number(id));
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async softDelete(@Param('id') id: string, @Req() req) {
    return this.imagesService.softDelete(req.user.sub, Number(id));
  }

  @UseGuards(JwtAuthGuard)
  @Delete('permanent/:id')
  async deletePermanent(@Param('id') id: string, @Req() req) {
    return this.imagesService.deletePhysical(req.user.sub, Number(id));
  }
}
