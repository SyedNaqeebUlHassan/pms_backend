import { Test, TestingModule } from '@nestjs/testing';
import { PrisonerController } from './prisoner.controller';

describe('PrisonerController', () => {
  let controller: PrisonerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PrisonerController],
    }).compile();

    controller = module.get<PrisonerController>(PrisonerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
