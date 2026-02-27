import { z } from "zod";
import {
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from "@langchain/core/messages";
import config from "../../config";
import { Logger } from "../../utils/logger";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { tool, StructuredTool } from "@langchain/core/tools";
import type { UvService } from "./uv";
import type { FileSystemService } from "./filesystem";
import { zModelSettings, type TModelSettings } from "../../types/config";

interface ToolHandler {
  execute: (args: Record<string, unknown>) => Promise<string>;
}

interface ToolConfig {
  name: string;
  description: string;
  schema: z.ZodObject<Record<string, z.ZodTypeAny>>;
  handler: ToolHandler;
}

export class LLMService {
  private tools: StructuredTool[];
  private toolHandlers: Map<string, ToolHandler>;
  private model: ReturnType<ChatGoogleGenerativeAI["bindTools"]>;
  private uvService: UvService;
  private fileSystemService: FileSystemService;
  private modelSettings: TModelSettings | null = null;

  constructor(uvService: UvService, fileSystemService: FileSystemService) {
    this.uvService = uvService;
    this.fileSystemService = fileSystemService;
    const toolConfigs = this.getToolConfigurations();
    this.tools = this.buildLangChainTools(toolConfigs);
    this.toolHandlers = this.buildToolHandlerMap(toolConfigs);
    this.model = new ChatGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
      model: config.MODEL_ID,
    }).bindTools(this.tools);
  }

  async start(firstCsvRows: string) {
    const messages = [
      new SystemMessage(config.PROMPT),
      new HumanMessage(firstCsvRows),
    ];

    let result = await this.model.invoke(messages, {
      tool_choice: "any",
    });

    return await this.processConversation(messages, result);
  }

  private async processConversation(
    messages: (SystemMessage | HumanMessage | ToolMessage)[],
    initialResult: unknown
  ) {
    let result = initialResult as {
      tool_calls?: {
        name: string;
        args: Record<string, unknown>;
        id?: string;
      }[];
    };
    const maxIterations = 15;
    let iteration = 0;

    while (
      result.tool_calls &&
      result.tool_calls.length > 0 &&
      iteration < maxIterations
    ) {
      iteration++;
      messages.push(result as SystemMessage);

      await this.executeToolCalls(result.tool_calls, messages);

      result = (await this.model.invoke(messages, {
        tool_choice: "auto",
      })) as {
        tool_calls?: {
          name: string;
          args: Record<string, unknown>;
          id?: string;
        }[];
      };
    }

    if (iteration >= maxIterations) {
      Logger.debug("Max iterations reached - stopping conversation");
    }

    Logger.debug("Conversation completed", { totalIterations: iteration });
    return result;
  }

  private async executeToolCalls(
    toolCalls: { name: string; args: Record<string, unknown>; id?: string }[],
    messages: (SystemMessage | HumanMessage | ToolMessage)[]
  ) {
    for (const toolCall of toolCalls) {
      Logger.debug("Executing tool", {
        toolName: toolCall.name,
        args: toolCall.args,
      });

      try {
        const toolResult = await this.executeTool(toolCall.name, toolCall.args);

        Logger.debug("Tool execution completed", {
          toolName: toolCall.name,
          result: toolResult,
        });

        messages.push(
          new ToolMessage({
            content: toolResult,
            tool_call_id: toolCall.id || "",
          })
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        Logger.debug("Tool execution failed", {
          toolName: toolCall.name,
          error: errorMessage,
        });

        messages.push(
          new ToolMessage({
            content: `Error: ${errorMessage}`,
            tool_call_id: toolCall.id || "",
          })
        );
      }
    }
  }

  private async executeTool(
    toolName: string,
    args: Record<string, unknown>
  ): Promise<string> {
    const handler = this.toolHandlers.get(toolName);
    if (!handler) {
      throw new Error(`Unknown tool: ${toolName}`);
    }

    return await handler.execute(args);
  }

  private getToolConfigurations(): ToolConfig[] {
    return [
      {
        name: "install_dependencies",
        description: "Installs dependencies using pip",
        schema: z.object({
          dependencies: z.string().describe("The dependencies to install"),
        }),
        handler: {
          execute: async (args: Record<string, unknown>) => {
            const dependencies = args.dependencies as string;
            Logger.debug("Installing dependencies", { dependencies });
            return await this.uvService.installReqs([dependencies]);
          },
        },
      },
      {
        name: "write_python_file",
        description: "Writes a Python file with the given code",
        schema: z.object({
          code: z.string().describe("The code to write"),
        }),
        handler: {
          execute: async (args: Record<string, unknown>) => {
            const code = args.code as string;
            Logger.debug("Writing Python file", { codeLength: code.length });
            await this.fileSystemService.writePythonFile(code);
            return `Python file written, total length: ${code.length}`;
          },
        },
      },
      {
        name: "run_python_file",
        description: "Runs the Python file",
        schema: z.object({}),
        handler: {
          execute: async (args: Record<string, unknown>) => {
            Logger.debug("Running Python file");
            return await this.uvService.runPythonFile();
          },
        },
      },
      {
        name: "save_model_settings",
        description: "Saves the model settings",
        schema: zModelSettings,
        handler: {
          execute: async (args: Record<string, unknown>) => {
            const accuracy = args.accuracy as number;
            const input = args.input as { type: string; name: string }[];
            Logger.debug("Saving model settings", { accuracy, input });
            this.modelSettings = args as unknown as TModelSettings;
            return `Model settings saved, accuracy: ${accuracy}, input: ${input}`;
          },
        },
      },
      {
        name: "thinking",
        description: "Think about the best approach to solve the problem",
        schema: z.object({
          thoughts: z.string().describe("What are you thinking? Only use once... make sure to explain why you chose that approach."),
        }),
        handler: {
          execute: async (args: Record<string, unknown>) => {
            return `Thinking about the question: ${args.thoughts}`;
          },
        }
      }
    ];
  }

  private buildLangChainTools(toolConfigs: ToolConfig[]): StructuredTool[] {
    return toolConfigs.map((config) =>
      tool(
        async () => {
          return "Tool executed";
        },
        {
          name: config.name,
          description: config.description,
          schema: config.schema,
        }
      )
    );
  }

  private buildToolHandlerMap(
    toolConfigs: ToolConfig[]
  ): Map<string, ToolHandler> {
    const handlerMap = new Map<string, ToolHandler>();
    for (const config of toolConfigs) {
      handlerMap.set(config.name, config.handler);
    }
    return handlerMap;
  }

 getModelSettings(): TModelSettings | null {
    return this.modelSettings;
  }
}
