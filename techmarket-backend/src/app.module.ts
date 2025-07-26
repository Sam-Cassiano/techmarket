import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';
import { AuthModule } from './auth/auth.module';
import { ProductModule } from './modules/products/product.module';
import { ProtectedModule } from './modules/protected/protected.module';
import { SaleModule } from './modules/sales/sale.module';
import { UserModule } from './modules/users/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        store: redisStore as any,
        host: config.get<string>('REDIS_HOST', 'localhost'),
        port: config.get<number>('REDIS_PORT', 6379),
        ttl: 300,
      }),
    }),
    AuthModule,
    ProductModule,
    ProtectedModule,
    SaleModule,
    UserModule,
  ],
})
export class AppModule {}
