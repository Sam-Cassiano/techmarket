import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { HashService } from '../common/hash/hash.service';
import { Role, User } from '@prisma/client';
import { LoginDto } from './dto/login.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockHashService = {
    hash: jest.fn(),
    compare: jest.fn(),
  };

  const mockPrismaService = {};

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: HashService, useValue: mockHashService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return a token and user when login is successful', async () => {
    const mockLoginDto: LoginDto = {
      username: 'admin',
      password: 'admin123',
    };

    const mockUser: Omit<User, 'password'> = {
      id: 1,
      username: 'admin',
      role: Role.admin,
      createdAt: new Date(),
    };

    const mockToken = {
      access_token: 'mock-token',
      user: mockUser,
    };

    jest.spyOn(authService, 'validateUser').mockResolvedValue(mockUser as any);
    jest.spyOn(authService, 'login').mockResolvedValue(mockToken);

    const result = await controller.login(mockLoginDto);

    expect(result).toEqual(mockToken);
    expect(authService.login).toHaveBeenCalledWith(mockUser);
  });
});
