import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { promises as fs } from 'fs';
import { join } from 'path';

@Injectable()
export class ImagesService {
  constructor(private prisma: PrismaService) {}

  async saveImage(userId: number, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Nenhum arquivo recebido');

    const image = await this.prisma.image.create({
      data: {
        userId,
        fileName: file.filename,
        filePath: file.path,
        mimeType: file.mimetype,
        size: file.size,
      },
    });

    return {
      message: 'Upload concluído',
      image,
    };
  }

  // para várias imagens
  //   async uploadMultiple(userId: number, files: Express.Multer.File[]) {
  //   const saved = [];

  //   for (const file of files) {
  //     const img = await this.prisma.image.create({
  //       data: {
  //         userId,
  //         fileName: file.filename,
  //         filePath: file.path,
  //         mimeType: file.mimetype,
  //         size: file.size,
  //       },
  //     });
  //     saved.push(img);
  //   }

  //   return { message: 'Upload múltiplo concluído', images: saved };
  // }

  async findAllByUser(userId: number) {
    return this.prisma.image.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async restore(userId: number, imageId: number) {
    // buscar imagem no Trash
    const trashed = await this.prisma.trash.findFirst({
      where: {
        entity: 'image',
        entityId: imageId,
      },
      orderBy: { deletedAt: 'desc' },
    });

    if (!trashed) {
      throw new BadRequestException('Imagem não encontrada no Trash');
    }

    // restaurar imagem
    const restored = await this.prisma.image.update({
      where: { id: imageId },
      data: { deletedAt: null },
    });

    return {
      message: 'Imagem restaurada',
      restored,
    };
  }

  async softDelete(userId: number, imageId: number) {
    // checar se a imagem existe e pertence ao usuário
    const image = await this.prisma.image.findFirst({
      where: {
        id: imageId,
        userId,
        deletedAt: null,
      },
    });

    if (!image) {
      throw new BadRequestException('Imagem não encontrada ou já deletada');
    }

    // soft delete
    const deleted = await this.prisma.image.update({
      where: { id: imageId },
      data: { deletedAt: new Date() },
    });

    // opcional: salvar no Trash
    await this.prisma.trash.create({
      data: {
        entity: 'image',
        entityId: imageId,
        data: deleted,
        deletedAt: new Date(),
      },
    });

    return {
      message: 'Imagem removida (soft delete)',
      deleted,
    };
  }

  async deletePhysical(userId: number, imageId: number) {
    // verificar se a imagem pertence ao usuário
    const image = await this.prisma.image.findFirst({
      where: {
        id: imageId,
        userId,
      },
    });

    if (!image) {
      throw new BadRequestException('Imagem não encontrada');
    }

    // remover arquivo do disco
    try {
      await fs.unlink(join(process.cwd(), image.filePath));
    } catch (err) {
      // se não existir no disco, só loga, não quebra
      console.warn('Arquivo não encontrado no disco:', image.filePath);
    }

    // remover do banco
    await this.prisma.image.delete({
      where: { id: imageId },
    });

    return { message: 'Imagem removida permanentemente' };
  }
}
