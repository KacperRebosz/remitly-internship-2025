import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SwiftCodesModule } from './swift-codes/swift-codes.module';
import { DrizzleProvider } from './db/drizzle.provider';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    SwiftCodesModule,
  ],
  controllers: [AppController],
  providers: [AppService, DrizzleProvider],
})
export class AppModule {}
