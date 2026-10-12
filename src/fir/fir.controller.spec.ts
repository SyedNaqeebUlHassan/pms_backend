import { Test, TestingModule } from '@nestjs/testing';
import { FirController } from './fir.controller';

describe('FirController', () => {
  let controller: FirController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FirController],
    }).compile();

    controller = module.get<FirController>(FirController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
