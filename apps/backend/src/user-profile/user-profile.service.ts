import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UserProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const profile = await this.prisma.userProfile.findUnique({
      where: { user_id: userId },
    });
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    return profile;
  }

  async createProfile(userId: string, email: string) {
    return this.prisma.userProfile.upsert({
      where: { user_id: userId },
      update: {},
      create: {
        user_id: userId,
        email: email,
      },
    });
  }

  async updateProfile(userId: string, data: UpdateProfileDto) {
    return this.prisma.userProfile.update({
      where: { user_id: userId },
      data,
    });
  }
}
