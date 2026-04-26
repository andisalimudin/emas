import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
// import { Role } from '@prisma/client'; // Removed as enum is not supported in SQLite

export enum Role {
  ADMIN = 'ADMIN',
  CUSTOMER = 'CUSTOMER',
  PARTNER = 'PARTNER',
  VENDOR = 'VENDOR',
}

function normalizeRole(input: any): Role {
  const role = typeof input === 'string' ? input.trim().toUpperCase() : '';

  if (role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'FINANCE' || role === 'AGENT_MANAGER' || role === 'VIEWER') {
    return Role.ADMIN;
  }
  if (role === 'PARTNER' || role === 'FUNDER') {
    return Role.PARTNER;
  }
  if (role === 'VENDOR' || role === 'AGENT') {
    return Role.VENDOR;
  }
  return Role.CUSTOMER;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const role = normalizeRole(user.role);
    const payload = { email: user.email, sub: user.id, role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role,
      }
    };
  }

  async register(data: any) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const normalizedRole = normalizeRole(data.role);
    const role = normalizedRole === Role.ADMIN ? Role.CUSTOMER : normalizedRole;

    const user = await this.usersService.create({
      ...data,
      password: hashedPassword,
      role,
    });
    
    const { password, ...result } = user;
    return result;
  }
}
