import { Test, TestingModule } from '@nestjs/testing';
import { QueueAgentService } from './queue-agent.service';

describe('QueueAgentService', () => {
  let service: QueueAgentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QueueAgentService],
    }).compile();

    service = module.get<QueueAgentService>(QueueAgentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
