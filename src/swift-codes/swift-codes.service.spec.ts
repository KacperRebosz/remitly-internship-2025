import { Test, TestingModule } from '@nestjs/testing';
import { SwiftCodesService } from './swift-codes.service';

describe('SwiftCodesService', () => {
  let service: SwiftCodesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SwiftCodesService],
    }).compile();

    service = module.get<SwiftCodesService>(SwiftCodesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
