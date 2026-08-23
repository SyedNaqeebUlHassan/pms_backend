import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const databaseUrl = config.get<string>('DATABASE_URL');

        // for live backend
        if (databaseUrl) {
          return {
            type: 'postgres',
            url: config.get('DATABASE_URL'),
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            synchronize: config.get('DB_SYNC') === 'true',
            logging: config.get('NODE_ENV') === 'development',
            ssl: {
              rejectUnauthorized: false,
            },
          };
        }

        return {
          type: 'postgres',
          host: config.get('DB_HOST') || 'localhost',
          port: Number(config.get('DB_PORT')) || 5432,
          username: config.get('DB_USERNAME') || 'postgres',
          password: config.get('DB_PASSWORD'),
          database: config.get('DB_DATABASE'),
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: config.get('DB_SYNC') === 'true',
          logging: config.get('NODE_ENV') === 'development',
          ssl: false, // No SSL for local development
        };
      },
    }),
    AuthModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
