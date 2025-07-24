import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // This test is commented out because it requires a database connection
  // Uncomment and run manually when needed
  /*
  it('should connect to the database', async () => {
    // This will test the actual connection
    await expect(service.$connect()).resolves.not.toThrow();
  });
  */
});