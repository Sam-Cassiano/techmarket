import { Test, TestingModule } from '@nestjs/testing'
import { AuthService } from './auth.service'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '../../prisma/prisma.service'
import { HashService } from '../common/hash/hash.service'
import { Role, User } from '@prisma/client'

describe('AuthService', () => {
  let authService: AuthService
  let prisma: Partial<Record<keyof PrismaService, any>>
  let mockHashService: { hash: jest.Mock; compare: jest.Mock }

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
      },
    }

    mockHashService = {
      hash: jest.fn(),
      compare: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        JwtService,
        { provide: PrismaService, useValue: prisma },
        { provide: HashService, useValue: mockHashService },
      ],
    }).compile()

    authService = module.get<AuthService>(AuthService)
  })

  it('should be defined', () => {
    expect(authService).toBeDefined()
  })

  it('should return null if user is not found', async () => {
    prisma.user.findUnique.mockResolvedValue(null)

    const result = await authService.validateUser('nonexistent', 'any')
    expect(result).toBeNull()
  })

  it('should return user if credentials are correct', async () => {
    const mockUser: User = {
      id: 1,
      username: 'admin',
      password: 'hashed-password',
      role: Role.admin,
      createdAt: new Date(),
    }

    prisma.user.findUnique.mockResolvedValue(mockUser)
    mockHashService.compare.mockResolvedValue(true)

    const result = await authService.validateUser('admin', 'password')

    expect(result).toMatchObject({
      id: 1,
      username: 'admin',
      role: Role.admin,
    })
  })

  it('should return null if password is incorrect', async () => {
    const mockUser: User = {
      id: 1,
      username: 'admin',
      password: 'hashed-password',
      role: Role.admin,
      createdAt: new Date(),
    }

    prisma.user.findUnique.mockResolvedValue(mockUser)
    mockHashService.compare.mockResolvedValue(false)

    const result = await authService.validateUser('admin', 'wrong-password')

    expect(result).toBeNull()
  })
})
