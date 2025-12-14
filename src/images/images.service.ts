import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Express } from 'express';
import { CreateImageDto } from './image-create.dto';

@Injectable()
export class ImagesService {
    constructor(private prisma: PrismaService) { }

    async create(
        userId: number,
        file: Express.Multer.File,
        data: CreateImageDto,
    ) {
        // 1. Garantir que categoryId existe
        const category = await this.prisma.category.findUnique({
            where: { id: data.categoryId },
        });
        if (!category) throw new Error('Categoria inválida');

        // 2. Processar tags (criar se não existirem)
        const existingTags = await this.prisma.tag.findMany({
            where: { name: { in: data.tags } },
        });

        const existingTagNames = existingTags.map(t => t.name);
        const newTags = data.tags.filter(t => !existingTagNames.includes(t));

        const createdTags = await Promise.all(
            newTags.map(t =>
                this.prisma.tag.create({
                    data: { name: t },
                }),
            ),
        );

        const allTags = [...existingTags, ...createdTags];

        // 3. Criar imagem no banco
        const image = await this.prisma.image.create({
            data: {
                userId,
                categoryId: data.categoryId,
                fileName: file.originalname,
                filePath: file.path, // caminho do arquivo salvo
                mimeType: file.mimetype,
                size: file.size,
                description: data.description,
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
}
