import { Module } from '@nestjs/common';
import { SwiftCodesController } from './swift-codes.controller';
import { SwiftCodesService } from './swift-codes.service';
import { DrizzleProvider } from '../db/drizzle.provider';

@Module({
  controllers: [SwiftCodesController],
  providers: [SwiftCodesService, DrizzleProvider],
})
export class SwiftCodesModule {}
