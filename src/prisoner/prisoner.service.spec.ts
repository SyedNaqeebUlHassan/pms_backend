import { Test, TestingModule } from '@nestjs/testing';
import { PrisonerService } from './prisoner.service';

describe('PrisonerService', () => {
  let service: PrisonerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrisonerService],
    }).compile();

    service = module.get<PrisonerService>(PrisonerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
