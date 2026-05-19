import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';
import { AuthResponse, AuthUser } from '@academania/shared';
import { PrismaService } from '@/prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

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

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
    });

    return this.issueTokens(user);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.usersService.findByEmail(dto.email);
    let valid = false;

    if (user?.passwordHash) {
      valid = await bcrypt.compare(dto.password, user.passwordHash);
    } else {
      // Dummy compare to mitigate timing attacks for email enumeration
      await bcrypt.compare(dto.password, '$2b$10$dummySaltToSimulateDelay123456789012345678901');
    }

    if (!user || !valid) throw new UnauthorizedException('Invalid credentials');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.issueTokens(this.toAuthUser(user as any));
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const payload = await this.jwt.verifyAsync(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user || !user.refreshToken) throw new UnauthorizedException('Invalid refresh token');

      const isTokenValid = await bcrypt.compare(refreshToken, user.refreshToken);
      if (!isTokenValid) throw new UnauthorizedException('Invalid refresh token');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return this.issueTokens(this.toAuthUser(user as any));
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string): Promise<{ message: string }> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
    return { message: 'Logged out successfully' };
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      // Do not reveal that the user does not exist (mitigate email enumeration)
      return { message: 'If the email exists, a reset link has been sent' };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hour expiration

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: hashedToken,
        resetExpires: expires,
      },
    });

    await this.prisma.passwordResetLog.create({
      data: {
        userId: user.id,
      },
    });

    const transporter = nodemailer.createTransport({
      host: this.config.get<string>('SMTP_HOST', 'smtp.gmail.com'),
      port: Number(this.config.get<number>('SMTP_PORT', 465)),
      secure: Number(this.config.get<number>('SMTP_PORT', 465)) === 465,
      auth: {
        user: this.config.get<string>('SMTP_USER', 'jaforsadakdiu4159@gmail.com'),
        pass: this.config.get<string>('SMTP_PASS', 'fxzdaftokguwtjxt'),
      },
    });

    const resetLink = `http://localhost:3000/reset-password?token=${token}`;

    const mailOptions = {
      from: this.config.get<string>('EMAIL_FROM', 'jaforsadakdiu4159@gmail.com'),
      to: dto.email,
      subject: 'Password Reset Request — Academania',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #0f172a; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em;">Academania</h1>
            <p style="color: #64748b; margin: 4px 0 0 0; font-size: 14px;">Your Academic Research Companion</p>
          </div>
          
          <div style="margin-bottom: 24px;">
            <p style="font-size: 16px; color: #334155; line-height: 1.6; margin: 0 0 16px 0;">Hello,</p>
            <p style="font-size: 16px; color: #334155; line-height: 1.6; margin: 0 0 24px 0;">We received a request to reset your Academania account password. Click the secure link below to update your password. This reset link is valid for <strong>1 hour</strong>.</p>
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetLink}" style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; border-radius: 8px; font-size: 15px; font-weight: 600; text-decoration: none; display: inline-block; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">Reset My Password</a>
          </div>

          <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
            <p style="font-size: 14px; color: #64748b; line-height: 1.6; margin: 0 0 8px 0;">If you did not request a password reset, you can safely ignore this email; your password will remain unchanged.</p>
            <p style="font-size: 13px; color: #94a3b8; line-height: 1.6; margin: 0;">If the button above does not work, copy and paste this URL into your browser:</p>
            <p style="font-size: 13px; color: #2563eb; word-break: break-all; margin: 8px 0 0 0;"><a href="${resetLink}" style="color: #2563eb; text-decoration: underline;">${resetLink}</a></p>
          </div>

          <div style="text-align: center; margin-top: 40px; font-size: 12px; color: #94a3b8;">
            <p style="margin: 0 0 4px 0;">© ${new Date().getFullYear()} Academania. All rights reserved.</p>
            <p style="margin: 0;">This is an automated system notification.</p>
          </div>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`[SMTP] Success: Password reset email sent to ${dto.email}`);
    } catch (mailError) {
      console.error('[SMTP] Error: Failed to send password reset email:', mailError);
    }

    return {
      message: 'If the email exists, a reset link has been sent',
    };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const token = dto.token;
    const newPassword = dto.password || dto.newPassword;

    if (!token) {
      throw new BadRequestException('Reset token is required');
    }

    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters long');
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await this.prisma.user.findFirst({
      where: {
        resetToken: hashedToken,
        resetExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetExpires: null,
        refreshToken: null,
      },
    });

    return { message: 'Password updated successfully' };
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.passwordHash) {
      throw new NotFoundException('User not found');
    }

    const valid = await bcrypt.compare(dto.oldPassword, user.passwordHash);
    if (!valid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
      },
    });

    return { message: 'Password updated successfully' };
  }

  private async issueTokens(user: AuthUser): Promise<AuthResponse> {
    const payload = { sub: user.id, email: user.email, role: user.role, name: user.name };
    const accessToken = await this.jwt.signAsync(payload);
    const refreshToken = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d') as any,
    });

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefreshToken },
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
