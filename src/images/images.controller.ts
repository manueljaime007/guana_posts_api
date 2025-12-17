import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
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
import { UpdateImageDto } from './dto/image-update.dto';

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

  @Get('all')
  async list() {
    const images = await this.imagesService.findAll();
    return { total: images.length, images };
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

  // 🔹 RESTORE (mais específico)
  @UseGuards(JwtAuthGuard)
  @Patch('restore/:id')
  async restore(@Param('id') id: string, @Req() req) {
    const userId = (req.user as any).id;
    return this.imagesService.restore(userId, Number(id));
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @UseInterceptors(FileInterceptor('file'))
  update(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
    @Req() req,
  ) {
    const userId = req.user.id;

    let tags: string[] | undefined;

    if (body.tags) {
      try {
        // tenta JSON (["a","b"])
        tags = JSON.parse(body.tags);
      } catch {
        // fallback: string simples ("bonho")
        tags = [body.tags];
      }
    }

    const dto: UpdateImageDto = {
      description: body.description,
      categoryId: body.categoryId ? Number(body.categoryId) : undefined,
      tags,
    };

    console.log('DTO FINAL:', dto);

    return this.imagesService.update(userId, id, dto, file);
  }




  // 🔹 DELETE PERMANENTE (mais específico)
  @UseGuards(JwtAuthGuard)
  @Delete('permanent/:id')
  async deletePermanent(@Param('id') id: string, @Req() req) {
    const userId = (req.user as any).id;
    return this.imagesService.deletePhysical(userId, Number(id));
  }

  // 🔹 SOFT DELETE (genérico)
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async softDelete(@Param('id') id: string, @Req() req) {
    const userId = (req.user as any).id;
    return this.imagesService.softDelete(userId, Number(id));
  }
}
