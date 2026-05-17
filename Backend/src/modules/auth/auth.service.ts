import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthResponse, AuthUser } from '@academania/shared';
import { PrismaService } from '@/prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.usersService.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
    });

    return this.issueTokens(user);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user?.passwordHash) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.issueTokens(this.toAuthUser(user as any));
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const user = await this.prisma.user.findFirst({ where: { refreshToken } });
    if (!user) throw new UnauthorizedException('Invalid refresh token');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.issueTokens(this.toAuthUser(user as any));
  }

  async logout(userId: string): Promise<{ message: string }> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
    return { message: 'Logged out successfully' };
  }

  async forgotPassword(_dto: ForgotPasswordDto): Promise<{ message: string }> {
    // TODO: generate token, persist, send email via mail service
    return { message: 'If the email exists, a reset link has been sent' };
  }

  async resetPassword(_dto: ResetPasswordDto): Promise<{ message: string }> {
    // TODO: validate reset token and update password
    return { message: 'Password updated successfully' };
  }

  private async issueTokens(user: AuthUser): Promise<AuthResponse> {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = await this.jwt.signAsync(payload);
    const refreshToken = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d') as any,
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    return { user, accessToken, refreshToken };
  }

  private toAuthUser(user: {
    id: string;
    name: string;
    email: string;
    role: AuthUser['role'];
  }): AuthUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }
}
