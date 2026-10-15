import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import fastifyStatic from '@fastify/static';
import path from 'path';
import fs from 'fs';
import { config } from './config.js';
import { sqlGuard } from './services/sql_guard.js';
import { irisService } from './services/iris.js';
import { terminalManager } from './services/terminal.js';
import { newmanService } from './services/newman_runner.js';
import { gitService } from './services/git_service.js';
import { quotaTracker } from './services/quota_tracker.js';
import { pipelineEngine, PipelineDefinition } from './services/pipeline_engine.js';
import { WebSocket } from 'ws';

const server = Fastify({
  logger: true,
});

async function main() {
  await server.register(cors, { origin: true });
  await server.register(websocket);

  // Serve client/dist static files if built
  const clientDist = path.resolve(config.workspaceDir, 'client/dist');
  if (fs.existsSync(clientDist)) {
    await server.register(fastifyStatic, {
      root: clientDist,
      prefix: '/',
    });
  }

  // -------------------------------------------------------------
  // REST API Routes
  // -------------------------------------------------------------

  // Health
  server.get('/api/health', async () => {
    return { status: 'ARES_ONLINE', timestamp: new Date() };
  });

  // Git & Files
  server.get('/api/git/status', async () => {
    return await gitService.getStatus();
  });

  server.get('/api/git/diff', async (req: any) => {
    const filePath = req.query?.file;
    return { diff: await gitService.getDiff(filePath) };
  });

  server.get('/api/git/files', async () => {
    return await gitService.getFileTree();
  });

  server.get('/api/git/file', async (req: any, reply) => {
    const filePath = req.query?.path;
    if (!filePath) {
      return reply.status(400).send({ error: 'Caminho do arquivo não fornecido.' });
    }
    const content = await gitService.readFile(filePath);
    return { path: filePath, content };
  });

  server.post('/api/git/file', async (req: any, reply) => {
    const { path: filePath, content } = req.body;
    if (!filePath || content === undefined) {
      return reply.status(400).send({ error: 'Parâmetros path e content são obrigatórios.' });
    }
    await gitService.writeFile(filePath, content);
    return { success: true, path: filePath };
  });

  // SQL Read-Only Guard
  server.post('/api/sql/validate', async (req: any) => {
    const { sql, filePath, limit } = req.body;
    if (filePath) {
      return await sqlGuard.validateFile(filePath);
    }
    const validation = sqlGuard.validate(sql || '');
    if (validation.valid && sql) {
      const targetLimit = limit !== undefined ? limit : config.defaultSqlLimit;
      validation.sanitizedSql = sqlGuard.applySafetyLimit(sql, targetLimit);
    }
    return validation;
  });

  // IRIS 2022 Telnet Automation
  server.post('/api/iris/command', async (req: any) => {
    const { command, namespace } = req.body;
    return await irisService.execute(command, namespace);
  });

  server.post('/api/iris/compile', async (req: any) => {
    const { filePath, overwrite, namespace } = req.body;
    return await irisService.compileFile(filePath, overwrite !== false, namespace);
  });

  // Newman Postman Runner
  server.post('/api/newman/run', async (req: any) => {
    const { collection, environment, folder } = req.body;
    return await newmanService.runCollection(collection, environment, folder);
  });

  // Telemetry & Quota
  server.get('/api/telemetry', async () => {
    return quotaTracker.getTelemetry();
  });

  server.post('/api/telemetry/record', async (req: any) => {
    const { model, promptTokens, completionTokens, contextTokens } = req.body;
    return quotaTracker.recordUsage(model, promptTokens || 0, completionTokens || 0, contextTokens);
  });

  // Pipelines
  server.post('/api/pipeline/run', async (req: any) => {
    const pipeline: PipelineDefinition = req.body.pipeline;
    const initialInput = req.body.input || {};
    return await pipelineEngine.executePipeline(pipeline, initialInput);
  });

  server.post('/api/pipeline/approve', async (req: any) => {
    const { executionId, approved } = req.body;
    const result = pipelineEngine.resolveApproval(executionId, !!approved);
    return { success: result };
  });

  // Terminals listing
  server.get('/api/terminals', async () => {
    return terminalManager.listSessions();
  });

  // -------------------------------------------------------------
  // WebSocket Multiplexer
  // -------------------------------------------------------------
  server.register(async function (fastify) {
    fastify.get('/ws', { websocket: true }, (connection: any, req) => {
      const ws = connection.socket || connection;

      // Handle incoming WS messages from frontend
      ws.on('message', (message: string) => {
        try {
          const payload = JSON.parse(message.toString());

          switch (payload.type) {
            case 'terminal_attach': {
              const { sessionId, cols, rows, command, args } = payload;
              terminalManager.createSession(sessionId, command, args, config.workspaceDir, cols, rows);
              terminalManager.attachClient(sessionId, ws);
              break;
            }

            case 'terminal_input': {
              const { sessionId, data } = payload;
              terminalManager.write(sessionId, data);
              break;
            }

            case 'terminal_resize': {
              const { sessionId, cols, rows } = payload;
              terminalManager.resize(sessionId, cols, rows);
              break;
            }

            case 'terminal_detach': {
              const { sessionId } = payload;
              terminalManager.detachClient(sessionId, ws);
              break;
            }

            case 'pipeline_subscribe': {
              const onUpdate = (exec: any) => {
                if (ws.readyState === WebSocket.OPEN) {
                  ws.send(JSON.stringify({ type: 'pipeline_update', execution: exec }));
                }
              };
              pipelineEngine.on('execution_update', onUpdate);
              ws.on('close', () => {
                pipelineEngine.off('execution_update', onUpdate);
              });
              break;
            }

            default:
              break;
          }
        } catch (e) {
          // ignore malformed ws messages
        }
      });
    });
  });

  // Start HTTP / WS Server
  await server.listen({ port: config.port, host: config.host });
  console.log(`\n======================================================`);
  console.log(`  [ARES DEV HUD SERVER ONLINE]`);
  console.log(`  Target: http://${config.host}:${config.port}`);
  console.log(`  Workspace: ${config.workspaceDir}`);
  console.log(`  IRIS Telnet Host: ${config.iris.host}:${config.iris.port}`);
  console.log(`======================================================\n`);
}

main().catch(err => {
  server.log.error(err);
  process.exit(1);
});
