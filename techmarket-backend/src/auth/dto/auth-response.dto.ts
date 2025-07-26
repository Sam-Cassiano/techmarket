import { Role } from '@prisma/client';

export class AuthUserDto {
  id: number;
  username: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

export class AuthResponseDto {
  access_token: string;
  user: AuthUserDto;
}
