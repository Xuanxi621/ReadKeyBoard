import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readBailianLocalConfig, createBailianMiddleware } from '../src/services/viteBailianPlugin.js';
import { parseSseStream, buildReadingPrompt } from '../src/services/aiService.js';

test('readBailianLocalConfig reads local bl-cli configuration correctly', () => {
  const config = readBailianLocalConfig();
  assert.ok(config, 'Config should exist');
  assert.equal(config.available, true);
  assert.equal(config.workspace_id, 'llm-tm8v7reib6uot3u8');
  assert.ok(config.api_key.startsWith('sk-'));
  assert.ok(config.configPath.includes('.bailian'));
});

test('createBailianMiddleware returns connected status for /api/bailian/status', async () => {
  const middleware = createBailianMiddleware();
  let statusResponse = '';
  const req = {
    method: 'GET',
    url: '/api/bailian/status'
  };
  const res = {
    headers: {},
    setHeader(k, v) { this.headers[k] = v; },
    end(data) { statusResponse = data; }
  };
  let nextCalled = false;

  await middleware(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, false);
  const parsed = JSON.parse(statusResponse);
  assert.equal(parsed.connected, true);
  assert.equal(parsed.workspace_id, 'llm-tm8v7reib6uot3u8');
  assert.equal(parsed.model, 'qwen-plus');
});

test('buildReadingPrompt constructs context with doc metadata and page text', () => {
  const currentDoc = { fileName: 'Attention_Is_All_You_Need.pdf', pages: 15 };
  const prompt = buildReadingPrompt({
    currentDoc,
    currentPage: 3,
    pageText: 'Multi-Head Attention is computed as...',
    userQuestion: '解释这页的注意力机制'
  });

  assert.equal(prompt.userMessage.role, 'user');
  assert.equal(prompt.userMessage.content, '解释这页的注意力机制');
  assert.match(prompt.systemMessage.content, /Attention_Is_All_You_Need\.pdf/);
  assert.match(prompt.systemMessage.content, /第 3 页/);
  assert.match(prompt.systemMessage.content, /Multi-Head Attention/);
  assert.match(prompt.systemMessage.content, /bl-cli/);
});

test('parseSseStream accumulates text chunks correctly from readable stream', async () => {
  const sseData = [
    'data: {"choices":[{"delta":{"content":"你好"}}]}\n\n',
    'data: {"choices":[{"delta":{"content":"！我是"}}]}\n\n',
    'data: {"choices":[{"delta":{"content":"千问。"}}]}\n\n',
    'data: [DONE]\n\n'
  ].join('');

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(sseData));
      controller.close();
    }
  });

  const chunks = [];
  const fullText = await parseSseStream(
    { body: stream },
    (delta, accumulated) => {
      chunks.push({ delta, accumulated });
    }
  );

  assert.equal(fullText, '你好！我是千问。');
  assert.equal(chunks.length, 3);
  assert.equal(chunks[0].accumulated, '你好');
  assert.equal(chunks[2].accumulated, '你好！我是千问。');
});

test('SUPPORTED_BAILIAN_MODELS contains qwen-plus, qwen-max, qwen-flash, and qwen-long', async () => {
  const { SUPPORTED_BAILIAN_MODELS } = await import('../src/services/aiService.js');
  assert.ok(Array.isArray(SUPPORTED_BAILIAN_MODELS));
  const ids = SUPPORTED_BAILIAN_MODELS.map(m => m.id);
  assert.ok(ids.includes('qwen-plus'));
  assert.ok(ids.includes('qwen-max'));
  assert.ok(ids.includes('qwen-flash'));
  assert.ok(ids.includes('qwen-long'));
});

test('marked parses markdown headers, lists, and code blocks for optimized rendering', async () => {
  const { marked } = await import('marked');
  const markdown = '# 核心总结\n\n- 要点 1：**重要发现**\n- 要点 2：测试\n\n```python\nprint("hello")\n```';
  const html = marked.parse(markdown);
  assert.match(html, /<h1>核心总结<\/h1>/);
  assert.match(html, /<strong>重要发现<\/strong>/);
  assert.match(html, /<pre><code.*>print\(&quot;hello&quot;\)\n<\/code><\/pre>/);
});
