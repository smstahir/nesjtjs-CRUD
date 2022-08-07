import {
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import * as argon from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { AuthDto } from './dto';

@Injectable({})
export class AuthService {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService
  ) { }

  async signup(dto: AuthDto) {
    try {
      // generate the password hash
      const hash = await argon.hash(dto.password);
      // save the new user to the database
      const user =
        await this.prismaService.user.create({
          data: {
            email: dto.email,
            hash,
          },
        });
      return this.signToken(user.id, user.email);
    } catch (error) {
      if (
        error instanceof
        PrismaClientKnownRequestError
      ) {
        if (error.code === 'P2002') {
          throw new ForbiddenException(
            'Credentials taken',
          );
        }
      }
    }
  }

  async signin(dto: AuthDto) {
    const user =
      await this.prismaService.user.findUnique({
        where: {
          email: dto.email,
        },
      });
    if (!user) {
      throw new ForbiddenException(
        'Credentials invalid',
      );
    }
    const valid = await argon.verify(
      user.hash,
      dto.password,
    );
    if (!valid) {
      throw new ForbiddenException(
        'Credentials invalid',
      );
    }
    return this.signToken(user.id, user.email);
  }

  async signToken(userId: number, email: string) {
    const payload = { userId, email };
    const token = await this.jwtService.signAsync(payload, {
      expiresIn: '15m',
      secret: this.configService.get('JWT_SECRET'),
    });
    return {
      access_token: token
    };
  }
}
