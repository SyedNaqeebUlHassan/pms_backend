import { Test, TestingModule } from '@nestjs/testing';
import { FirService } from './fir.service';

describe('FirService', () => {
  let service: FirService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FirService],
    }).compile();

    service = module.get<FirService>(FirService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
