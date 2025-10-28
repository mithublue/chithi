import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { UserService } from '../user/user.service';
import { RegisterUserDto } from '../../common/dto/register-user.dto';
import * as bcrypt from 'bcrypt';
import { LoginUserDto } from '../../common/dto/login-user.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {}

  private async generateAnonymousTag(): Promise<string> {
    let tag: string;
    let isUnique = false;
    while (!isUnique) {
      const randomNumber = Math.floor(1000 + Math.random() * 9000);
      tag = `Mom#${randomNumber}`;
      const existingUser = await this.prisma.user.findUnique({
        where: { anonymousTag: tag },
      });
      if (!existingUser) {
        isUnique = true;
      }
    }
    return tag;
  }

  async register(registerUserDto: RegisterUserDto) {
    const { email, password } = registerUserDto;

    const existingUser = await this.userService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const anonymousTag = await this.generateAnonymousTag();

    const user = await this.userService.create({
      email,
      password: hashedPassword,
      anonymousTag,
    });

    const tokens = await this._generateTokens({ userId: user.id, email: user.email });
    // In a real app, you would securely store the refresh token hash
    return tokens;
  }

  async login(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;
    const user = await this.userService.findByEmail(email);

    if (user && (await bcrypt.compare(password, user.password))) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });
      const tokens = await this._generateTokens({ userId: user.id, email: user.email });
      // In a real app, you would securely store the refresh token hash
      return tokens;
    }

    throw new UnauthorizedException('Invalid credentials');
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new ForbiddenException('Access Denied');
    }
    
    // In a real app, you'd compare the provided refreshToken with a stored hash
    // For this MVP, we trust the validated payload from the guard
    
    return this._generateTokens({ userId: user.id, email: user.email });
  }

  private async _generateTokens(payload: { userId: string; email: string }) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
}
