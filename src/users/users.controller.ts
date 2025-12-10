import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/user-create.dto';
import { UpdateUserDto } from './dto/user-update.dto';
import { LoggingInterceptor } from 'src/common/interceptors/logging.interceptor';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  // útil apenas para admin
  // @Post()
  // create(@Body() dto: CreateUserDto) {
  //   return this.usersService.create(dto);
  // }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get('/help')
  @UseInterceptors(LoggingInterceptor)
  help(@Req() req) {
    return "Info básica do user: ";
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}
