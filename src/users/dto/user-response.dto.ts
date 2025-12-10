import { Exclude, Expose } from 'class-transformer';

enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}
export class UserResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  email: string;

  @Expose()
  role?: UserRole;

  @Exclude()
  password: string;
}
