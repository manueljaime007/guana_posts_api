import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ImagesService } from './images.service';
import { multerConfig } from './config/multer.config';
import { CreateImageDto } from './dto/image-create.dto';

@Controller('images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

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

  @Get('all')
  async list() {
    return this.imagesService.findAll();
  }

  // rota pública
  @Get('user/:id')
  async listPublic(@Param('id') id: string) {
    const images = await this.imagesService.findAllByUser(Number(id));
    return { total: images.length, images };
  }

  // rota privada
  @UseGuards(JwtAuthGuard)
  @Get('me/images')
  async listMine(@Req() req) {
    const userId = (req.user as any).id;
    const images = await this.imagesService.findAllByUser(userId);
    return { total: images.length, images };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('restore/:id')
  async restore(@Param('id') id: string, @Req() req) {
    const userId = (req.user as any).id;
    return this.imagesService.restore(userId, Number(id));
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async softDelete(@Param('id') id: string, @Req() req) {
    const userId = (req.user as any).id;
    return this.imagesService.softDelete(userId, Number(id));
  }

  @UseGuards(JwtAuthGuard)
  @Delete('permanent/:id')
  async deletePermanent(@Param('id') id: string, @Req() req) {
    const userId = (req.user as any).id;
    return this.imagesService.deletePhysical(userId, Number(id));
  }
}
