import { Test, TestingModule } from '@nestjs/testing';
import { QueueAgentController } from './queue-agent.controller';

describe('QueueAgentController', () => {
  let controller: QueueAgentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QueueAgentController],
    }).compile();

    controller = module.get<QueueAgentController>(QueueAgentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
