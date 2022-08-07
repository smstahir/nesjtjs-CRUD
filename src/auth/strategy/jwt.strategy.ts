import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(private configService: ConfigService, private prismaService: PrismaService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: configService.get("JWT_SECRET"),
        })
    }

    async validate(payload: { sub: number, email: string }): Promise<any> {
        const user = await this.prismaService.user.findUnique({
            where: {
                id: payload.sub,
                email: payload.email,
            },
        });
        delete user.hash
        return user;
    }
}