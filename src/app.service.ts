import { Injectable } from '@nestjs/common';
// import { LangflowClient } from '@datastax/langflow-client';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { MessageContent } from 'openai/resources/beta/threads/messages';
import { getThreadForUser, saveThreadForUser } from './utils/thread-storage';
import { buscarPacotesViagemdoSite, getWeather } from './utils/functions';

interface ToolCall {
  id: string;
  function: {
    name: string;
    arguments: any;
  };
}

interface RequiredAction {
  submit_tool_outputs: {
    tool_calls: ToolCall[];
  };
}

@Injectable()
export class AppService {
  private openai: OpenAI;
  private assistantId: any;
  private DEMO_USER_ID = 'user-123';

  constructor(private readonly configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
    this.assistantId = this.configService.get<string>('ASSISTANT_ID');
  }

  private buscarPacotesViagemdoSite = buscarPacotesViagemdoSite;
  private getWeather = getWeather;

  async chatWithOpenAIAssistant(
    input: string,
  ): Promise<string | MessageContent[]> {
    try {
      // Reuse or create a thread
      let threadId = getThreadForUser(this.DEMO_USER_ID);

      if (!threadId) {
        const thread = await this.openai.beta.threads.create();
        threadId = thread.id;
        saveThreadForUser(this.DEMO_USER_ID, threadId);
        console.log('Nova thread criada:', threadId);
      } else {
        console.log('Thread existente encontrada:', threadId);
      }

      // Add user message
      await this.openai.beta.threads.messages.create(threadId, {
        role: 'user',
        content: input,
      });

      // Process and return response
      return await this.processThread(threadId);
    } catch (error) {
      console.error('Erro ao processar a conversa:', error);
      return 'Ocorreu um erro ao processar sua solicitação. Tente novamente mais tarde.';
    }
  }

  private async processThread(
    threadId: string,
  ): Promise<string | MessageContent[]> {
    // Iniciar a execução da thread
    const run = await this.openai.beta.threads.runs.create(threadId, {
      assistant_id: this.assistantId,
    });

    // Monitorar até que a resposta seja finalizada
    while (true) {
      const updatedRun = await this.openai.beta.threads.runs.retrieve(
        threadId,
        run.id,
      );

      if (updatedRun.status === 'completed') {
        break;
      } else if (
        updatedRun.status === 'requires_action' &&
        updatedRun.required_action
      ) {
        // Se o assistente chamar uma função, processamos
        await this.handleFunctionCalls(
          threadId,
          run.id,
          updatedRun.required_action,
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 1000)); // Aguarda um pouco antes de checar novamente
    }

    // Obter a resposta do assistente
    const messages = await this.openai.beta.threads.messages.list(threadId);

    console.log('Mensagens:', messages.data);
    const lastMessage = messages.data.find((m) => m.role === 'assistant');

    return lastMessage?.content || 'Não entendi sua pergunta.';
  }

  private async handleFunctionCalls(
    threadId: string,
    runId: string,
    requiredAction: RequiredAction,
  ) {
    for (const toolCall of requiredAction.submit_tool_outputs.tool_calls) {
      const functionName: string = toolCall.function.name;
      let functionResponse = '';

      console.log('Chamando função:', functionName);

      // if (functionName === 'buscar_pacotes_viagem') {
      //   functionResponse = this.buscarPacotesViagem();
      //   console.log('Pacotes de viagem:', functionResponse);
      // } else if (functionName === 'prever_clima_checkin') {
      //   functionResponse = this.preverClimaCheckin();
      // }

      if (functionName === 'buscarPacotesViagem') {
        const args = JSON.parse(toolCall.function.arguments);
        console.log('arguments', args);
        console.log(
          'toolCall.function.arguments typeof',
          typeof toolCall.function.arguments,
        );
        functionResponse = await this.buscarPacotesViagemdoSite(
          args.cidade,
          args.dataIda,
          args.dataVolta,
        );

        functionResponse = JSON.stringify(functionResponse, null, 2);
        console.log('retorno da função:', functionResponse);
      }

      if (functionName === 'getWeather') {
        const args = JSON.parse(toolCall.function.arguments);
        console.log('arguments', args);
        console.log(
          'toolCall.function.arguments typeof',
          typeof toolCall.function.arguments,
        );
        functionResponse = await this.getWeather(args.latitude, args.longitude);
        functionResponse = JSON.stringify(functionResponse, null, 2);
      }

      // Responder à chamada da função com os dados
      await this.openai.beta.threads.runs.submitToolOutputs(threadId, runId, {
        tool_outputs: [{ tool_call_id: toolCall.id, output: functionResponse }],
      });
    }
  }
}
