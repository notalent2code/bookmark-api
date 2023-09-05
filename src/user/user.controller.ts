import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { User as UserEntity } from '@prisma/client';
import { User } from 'src/auth/decorator';
import { UserService } from './user.service';
import { JwtGuard } from 'src/auth/guard';
import { EditUserDto } from './dto';

@UseGuards(JwtGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  getMe(@User() user: UserEntity) {
    return user;
  }

  @Patch()
  editUser(@User('id') userId: number, @Body() dto: EditUserDto) {
    return this.userService.editUser(userId, dto);
  }
}
