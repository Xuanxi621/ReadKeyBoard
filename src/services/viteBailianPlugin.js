import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

export function readBailianLocalConfig() {
  const configPath = path.join(os.homedir(), '.bailian', 'config.json');
  if (!fs.existsSync(configPath)) {
    return null;
  }
  try {
    const raw = fs.readFileSync(configPath, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      available: !!(parsed && parsed.api_key),
      workspace_id: parsed.workspace_id || '',
      console_region: parsed.console_region || '',
      api_key: parsed.api_key || '',
      base_url: parsed.base_url || '',
      language: parsed.language || 'zh-CN',
      configPath
    };
  } catch (err) {
    console.warn('[vite-bailian-plugin] Failed to read ~/.bailian/config.json:', err.message);
    return null;
  }
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 5 * 1024 * 1024) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

export function createBailianMiddleware() {
  return async (req, res, next) => {
    const url = req.url || '';

    // Status endpoint
    if (req.method === 'GET' && url.startsWith('/api/bailian/status')) {
      const config = readBailianLocalConfig();
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      if (!config || !config.api_key) {
        res.end(JSON.stringify({
          connected: false,
          error: '未读取到本地 ~/.bailian/config.json 配置文件，请确认已运行 bl login 或 bl-cli 配置',
          model: 'qwen-plus'
        }));
      } else {
        res.end(JSON.stringify({
          connected: true,
          workspace_id: config.workspace_id,
          console_region: config.console_region,
          model: 'qwen-plus',
          hasApiKey: true,
          configPath: config.configPath
        }));
      }
      return;
    }

    // Chat completion endpoint
    if (req.method === 'POST' && url.startsWith('/api/bailian/chat')) {
      try {
        const config = readBailianLocalConfig();
        if (!config || !config.api_key) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({
            error: '本地 ~/.bailian/config.json 未找到有效的 API Key，请检查 bl-cli 登录状态'
          }));
          return;
        }

        const payload = await parseJsonBody(req);
        const targetUrl = (config.base_url || 'https://dashscope.aliyuncs.com') + '/compatible-mode/v1/chat/completions';

        const upstreamRes = await fetch(targetUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.api_key}`,
            'X-DashScope-WorkSpace': config.workspace_id || ''
          },
          body: JSON.stringify({
            model: payload.model || 'qwen-plus',
            messages: payload.messages || [],
            stream: !!payload.stream,
            temperature: payload.temperature ?? 0.7
          })
        });

        if (!upstreamRes.ok) {
          const errText = await upstreamRes.text();
          res.statusCode = upstreamRes.status;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({
            error: `Bailian 通义千问接口调用失败 (${upstreamRes.status}): ${errText}`
          }));
          return;
        }

        if (payload.stream) {
          res.writeHead(200, {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive'
          });

          const reader = upstreamRes.body.getReader();
          let closed = false;
          req.on('close', () => {
            closed = true;
            reader.cancel().catch(() => {});
          });

          while (!closed) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(Buffer.from(value));
          }
          res.end();
        } else {
          const data = await upstreamRes.json();
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify(data));
        }
      } catch (err) {
        console.error('[vite-bailian-plugin] Error:', err);
        if (!res.headersSent) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ error: err.message || '内部代理错误' }));
        }
      }
      return;
    }

    next();
  };
}

export function viteBailianPlugin() {
  const middleware = createBailianMiddleware();
  return {
    name: 'vite-plugin-bailian-cli',
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    }
  };
}
