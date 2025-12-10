import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserResponseDto } from './dto/user-response.dto';
import { CreateUserDto } from './dto/user-create.dto';

import { plainToInstance } from 'class-transformer';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/user-update.dto';
import { Role } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

// import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // útil apenas para ADMIN
  // async create(dto: CreateUserDto) {
  //   try {
  //     const exisitingEmail = await this.prisma.user.findUnique({
  //       where: { email: dto.email },
  //     });

  //     if (exisitingEmail) {
  //       throw new BadRequestException('This email is already in use');
  //     }

  //     const hashed = await bcrypt.hash(dto.password, 10);

  //     const user = await this.prisma.user.create({
  //       data: {
  //         ...dto,
  //         password: hashed,
  //         role: 'USER',
  //       },
  //     });

  //     return plainToInstance(UserResponseDto, user, {
  //       excludeExtraneousValues: true,
  //     });
  //   } catch (error) {
  //     // se já é exceção HTTP, reenvia
  //     if (error instanceof BadRequestException) throw error;

  //     throw new BadRequestException('Erro ao criar usuário');
  //   }
  // }

  async findAll() {
    try {
      const users = await this.prisma.user.findMany({
        where: { deletedAt: null, role: Role.USER },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

      return plainToInstance(UserResponseDto, users, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      throw new BadRequestException('Erro ao buscar usuários');
    }
  }

  async findOne(id: number) {
    try {
      const user = await this.prisma.user.findFirst({
        where: { id, role: Role.USER, deletedAt: null },
      });

      if (!user) {
        throw new NotFoundException('Usuário não encontrado.');
      }

      return plainToInstance(UserResponseDto, user, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      throw new BadRequestException('Erro ao buscar usuário');
    }
  }

  async findByEmail(email: string) {
    const user = await this.prisma.user.findFirst({
      where: { email, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    return user;
  }

  async update(id: number, dto: UpdateUserDto) {
    try {
      await this.findOne(id);

      const updated = await this.prisma.user.update({
        where: { id, role: Role.USER },
        data: {
          ...dto,
          role: Role.USER,
          ...(dto.password && {
            password: await bcrypt.hash(dto.password, 10),
          }),
        },
      });

      return plainToInstance(UserResponseDto, updated, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      throw new BadRequestException('Erro ao atualizar usuário');
    }
  }

  // SOFT DELETE ------------------------------------------------------
  async remove(id: number) {
    try {
      await this.findOne(id);

      return await this.prisma.user.update({
        where: { id, role: Role.USER },
        data: {
          deletedAt: new Date(),
        },
        select: {
          id: true,
          deletedAt: true,
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      throw new BadRequestException('Error ao remover usuário');
    }
  }
}
