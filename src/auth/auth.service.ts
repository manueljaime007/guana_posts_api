import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
// import { addSeconds } from 'date-fns'; // opcional, pode calcular manualmente

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  private async hashData(data: string) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(data, salt);
  }

  async register(name: string, email: string, password: string) {
    const exists = await this.prisma.user.findUnique({ where: { email } });
    if (exists) throw new BadRequestException('Email já registado');

    const passwordHash = await this.hashData(password);

    const user = await this.prisma.user.create({
      data: { name, email, password: passwordHash },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    const tokens = await this.getTokensAndStoreRefresh(user.id);
    return { user, tokens };
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return null;
    // Return non-sensitive fields
    const { password: _p, ...rest } = user as any;
    return rest;
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Credenciais inválidas');
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Credenciais inválidas');

    const publicUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const tokens = await this.getTokensAndStoreRefresh(user.id);
    return { user: publicUser, tokens };
  }

  private async signAccessToken(userId: number, role: string) {
    const payload = { sub: userId, role };
    return this.jwtService.signAsync(payload, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: `${this.config.get('JWT_ACCESS_EXPIRATION')}s`,
    });
  }

  private async signRefreshToken(userId: number) {
    const payload = { sub: userId };
    return this.jwtService.signAsync(payload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: `${this.config.get('JWT_REFRESH_EXPIRATION')}s`,
    });
  }

  private async getTokensAndStoreRefresh(userId: number) {
    // busca user role para payload do access (ou podes passar role como argumento)
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Usuário não encontrado');

    const accessToken = await this.signAccessToken(userId, user.role);
    const refreshToken = await this.signRefreshToken(userId);

    // hash do refresh token antes de guardar
    const tokenHash = await this.hashData(refreshToken);
    const expiresAt = new Date(
      Date.now() + Number(this.config.get('JWT_REFRESH_EXPIRATION')) * 1000,
    );

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  async refresh(refreshToken: string) {
    try {
      const payload: any = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
      const userId = payload.sub;

      // buscar tokens na BD para esse user e comparar hashes
      const tokens = await this.prisma.refreshToken.findMany({
        where: { userId, revoked: false, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });

      let matched: { id: number } | null = null;
      for (const t of tokens) {
        const match = await bcrypt.compare(refreshToken, t.tokenHash);
        if (match) {
          matched = t;
          break;
        }
      }
      if (!matched) throw new UnauthorizedException('Refresh token inválido');

      // opcional: revogar token antigo (rotating)
      await this.prisma.refreshToken.update({
        where: { id: matched.id },
        data: { revoked: true },
      });

      // gerar novos tokens e guardar novo refresh
      const newTokens = await this.getTokensAndStoreRefresh(userId);
      return newTokens;
    } catch (e) {
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }
  }

  // async logout(refreshToken: string) {
  //   // find and revoke the refresh token
  //   const tokens = await this.prisma.refreshToken.findMany({
  //     where: { revoked: false },
  //   });
  //   for (const t of tokens) {
  //     const match = await bcrypt.compare(refreshToken, t.tokenHash);
  //     if (match) {
  //       await this.prisma.refreshToken.update({
  //         where: { id: t.id },
  //         data: { revoked: true },
  //       });
  //       return;
  //     }
  //   }
  // }

  async logout(refreshToken: string) {
    if (!refreshToken) {
      throw new BadRequestException('Refresh token obrigatório');
    }

    // pega todos os tokens não revogados
    const tokens = await this.prisma.refreshToken.findMany({
      where: { revoked: false },
    });

    let matched: { id: number } | null = null;

    for (const t of tokens) {
      if (!t.tokenHash) continue; // ignora tokens inválidos

      const isMatch = await bcrypt.compare(refreshToken, t.tokenHash);
      if (isMatch) {
        matched = t;
        break;
      }
    }

    if (!matched) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    // marca como revogado
    await this.prisma.refreshToken.update({
      where: { id: matched.id },
      data: { revoked: true },
    });
    
    return { ok: true };
  }
}
