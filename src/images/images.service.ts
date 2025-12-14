import {
  BadRequestException,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateImageDto } from './dto/image-create.dto';
import { promises as fs } from 'fs';
import { join, resolve } from 'path';

@Injectable()
export class ImagesService {
  constructor(private prisma: PrismaService) { }

  async create(
    userId: number,
    file: Express.Multer.File,
    data: CreateImageDto,
  ) {
    // 1️⃣ Garantir que categoryId existe
    const category = await this.prisma.category.findUnique({
      where: { id: data.categoryId },
    });
    if (!category) throw new Error('Categoria inválida');

    // 2️⃣ Processar tags (criar se não existirem)
    const tagsArray: string[] = data.tags?.map(t => t.trim()).filter(Boolean) ?? [];

    // Pegar apenas tags existentes no banco que correspondem às do request
    const existingTags = await this.prisma.tag.findMany({
      where: { name: { in: tagsArray } },
    });

    const existingTagNames = existingTags.map(t => t.name);

    // Criar apenas as tags que não existem
    const newTags = await Promise.all(
      tagsArray
        .filter(t => !existingTagNames.includes(t))
        .map(name =>
          this.prisma.tag.create({ data: { name } })
        ),
    );

    // Todas as tags que serão conectadas à imagem
    const allTags = [...existingTags, ...newTags];

    // 3️⃣ Criar imagem no banco
    const image = await this.prisma.image.create({
      data: {
        userId,
        categoryId: data.categoryId,
        fileName: file.originalname,
        filePath: file.path,
        mimeType: file.mimetype,
        size: file.size,
        description: data.description ?? null,
        tags: {
          connect: allTags.map(tag => ({ id: tag.id })),
        },
      },
      include: {
        category: true,
        tags: true,
      },
    });

    console.log('Arquivo recebido:', file);
    console.log('file.path:', file.path);

    return image;
  }

  async findAll() {
    return this.prisma.image.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: { category: true, tags: true },
    });
  }

  async findAllByUser(userId: number) {
    return this.prisma.image.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: { category: true, tags: true },
    });
  }

  async restore(userId: number, imageId: number) {
    const image = await this.prisma.image.findUnique({
      where: { id: imageId },
    });

    if (!image) throw new BadRequestException('Imagem não encontrada');
    if (image.userId !== userId) throw new ForbiddenException('Não autorizado');
    if (image.deletedAt === null)
      throw new BadRequestException('Imagem já está ativa');

    const restored = await this.prisma.image.update({
      where: { id: imageId },
      data: { deletedAt: null },
      include: { category: true, tags: true },
    });

    return {
      message: 'Imagem restaurada com sucesso',
      restored,
    };
  }

  async softDelete(userId: number, imageId: number) {
    const image = await this.prisma.image.findFirst({
      where: { id: imageId, userId, deletedAt: null },
    });

    if (!image)
      throw new BadRequestException('Imagem não encontrada ou já deletada');

    const deleted = await this.prisma.image.update({
      where: { id: imageId },
      data: { deletedAt: new Date() },
      include: { category: true, tags: true },
    });

    return {
      message: 'Imagem removida (soft delete)',
      deleted,
    };
  }

  async deletePhysical(userId: number, imageId: number) {
    const image = await this.prisma.image.findFirst({
      where: { id: imageId, userId },
    });
    if (!image) throw new BadRequestException('Imagem não encontrada');

    // Remover arquivo do disco
    try {
      await fs.unlink(resolve(image.filePath));
    } catch (err) {
      console.warn('Arquivo não encontrado no disco:', image.filePath);
    }

    // Remover do banco
    await this.prisma.image.delete({ where: { id: imageId } });

    return { message: 'Imagem removida permanentemente' };
  }
}
