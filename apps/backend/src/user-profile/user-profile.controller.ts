import { Controller, Get, Patch, Body, UseGuards, Post } from '@nestjs/common';
import { UserProfileService } from './user-profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { UserId } from '../common/decorators/user.decorator';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('User Profile')
@UseGuards(AuthGuard)
@Controller('user-profile')
export class UserProfileController {
  constructor(private readonly userProfileService: UserProfileService) {}

  @Get()
  @ApiOperation({ summary: 'Obter perfil do usuário atual' })
  getProfile(@UserId() userId: string) {
    return this.userProfileService.getProfile(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Criar perfil (Onboarding)' })
  createProfile(@UserId() userId: string, @Body('email') email: string) {
    return this.userProfileService.createProfile(userId, email);
  }

  @Patch()
  @ApiOperation({ summary: 'Atualizar perfil' })
  updateProfile(
    @UserId() userId: string,
    @Body() updateData: UpdateProfileDto,
  ) {
    return this.userProfileService.updateProfile(userId, updateData);
  }
}
