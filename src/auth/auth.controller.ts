import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Headers,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.name, dto.email, dto.password);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() dto: LoginDto) {
    const { email, password } = dto;
    return this.authService.login(email, password);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refresh(refreshToken);
  }

  // Se for para fazer logout enviando refreshToken no header de requisição
  @Post('logout')
  @HttpCode(200)
  async logout(@Headers('authorization') authHeader: string) {
    if (!authHeader) throw new BadRequestException('Refresh token obrigatório');
    const refreshToken = authHeader.replace('Bearer ', '').trim();
    return this.authService.logout(refreshToken);
  }

  // Se for para fazer logout enviando refreshToken no body
  // @Post('logout')
  // @HttpCode(200)
  // async logout(@Body() body: any) {
  //   const refreshToken = body?.refreshToken;
  //   return this.authService.logout(refreshToken);
  // }

  // Exemplo: rota protegida
  @UseGuards(JwtAuthGuard)
  @Post('me/test')
  test(@Req() req) {
    return { user: req.user };
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @Post('upload')
  uploadImage(@Req() req, @UploadedFile() file) {
    const userId = req.user.id;
    // grava na DB com userId
  }
}
