import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Kacper Rębosz 2025 Remitly Internship Task Solution"', () => {
      expect(appController.getHello()).toBe(
        'Kacper Rębosz 2025 Remitly Internship Task Solution',
      );
    });
  });
});
