import { IsOptional, IsString, IsEnum, MinLength, MaxLength } from 'class-validator';
import { Role } from '@prisma/client';

export class UpdateUserDto {
  @IsOptional()
  @IsString({ message: 'O nome de usuário deve ser uma string' })
  @MinLength(3, { message: 'O nome de usuário deve ter pelo menos 3 caracteres' })
  @MaxLength(50, { message: 'O nome de usuário deve ter no máximo 50 caracteres' })
  username?: string;

  @IsOptional()
  @IsString({ message: 'A senha deve ser uma string' })
  @MinLength(6, { message: 'A senha deve ter pelo menos 6 caracteres' })
  @MaxLength(100, { message: 'A senha deve ter no máximo 100 caracteres' })
  password?: string;

  @IsOptional()
  @IsEnum(Role, { message: 'Role inválido. Os valores permitidos são: admin ou client' })
  role?: Role;
}
