import { Test, TestingModule } from '@nestjs/testing';
import { SwiftCodesController } from './swift-codes.controller';

describe('SwiftCodesController', () => {
  let controller: SwiftCodesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SwiftCodesController],
    }).compile();

    controller = module.get<SwiftCodesController>(SwiftCodesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
