// Client-side AI service connected to local bl-cli (Bailian Qwen)

export async function fetchBailianStatus() {
  try {
    const res = await fetch('/api/bailian/status');
    if (!res.ok) {
      return { connected: false, error: `状态检查失败 (${res.status})` };
    }
    return await res.json();
  } catch (err) {
    return { connected: false, error: err.message || '网络连接异常' };
  }
}

export function buildReadingPrompt({ currentDoc, currentPage, pageText, userQuestion }) {
  const docTitle = currentDoc?.fileName || '未命名文档';
  const totalPages = currentDoc?.pages || 1;
  const cleanText = (pageText || '').trim();

  const systemContent = [
    `你是一位专业的学术研究与智能文档研读专家（已接入本地 bl-cli，模型：通义千问 Qwen）。`,
    `当前用户正在精读文档《${docTitle}》（共 ${totalPages} 页），当前停留在第 ${currentPage} 页。`,
    cleanText
      ? `【当前第 ${currentPage} 页提取出的原文文本片段】：\n"""\n${cleanText.slice(0, 3000)}\n"""`
      : `【提示】：当前页暂无提取到纯文本，可能为纯扫描图片或图表。请结合文档主题及用户问题进行解答。`,
    `【研读回答规范】：`,
    `1. 优先紧密结合当前第 ${currentPage} 页原文内容回答。如有直接依据，请在回答中明确注明“（参考第 ${currentPage} 页）”。`,
    `2. 条理分明，用词专业通俗兼备，善用要点列表或分段。`,
    `3. 若用户询问延展问题，基于你掌握的专业知识进行客观延伸，并说明属于延展背景。`,
    `4. 回复使用规范流畅的中文。`
  ].join('\n\n');

  return {
    systemMessage: { role: 'system', content: systemContent },
    userMessage: { role: 'user', content: userQuestion }
  };
}

export async function parseSseStream(response, onChunk) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let accumulated = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || ''; // Keep incomplete trailing line

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || !line.startsWith('data:')) continue;

      const dataStr = line.slice(5).trim();
      if (dataStr === '[DONE]') {
        return accumulated;
      }

      try {
        const parsed = JSON.parse(dataStr);
        const delta = parsed.choices?.[0]?.delta?.content || '';
        if (delta) {
          accumulated += delta;
          if (onChunk) {
            onChunk(delta, accumulated);
          }
        }
      } catch (err) {
        // Skip unparseable heartbeat or malformed SSE line
      }
    }
  }

  return accumulated;
}

export async function streamReadingQA({
  currentDoc,
  currentPage,
  pageText,
  userQuestion,
  chatHistory = [],
  onChunk,
  signal
}) {
  const { systemMessage, userMessage } = buildReadingPrompt({
    currentDoc,
    currentPage,
    pageText,
    userQuestion
  });

  // Keep last 4 conversational turns to retain context without exceeding token window
  const recentHistory = chatHistory
    .slice(-6)
    .filter(m => m.sender === 'user' || m.sender === 'ai')
    .map(m => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text
    }));

  const messages = [
    systemMessage,
    ...recentHistory,
    userMessage
  ];

  const response = await fetch('/api/bailian/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'qwen-plus',
      messages,
      stream: true,
      temperature: 0.6
    }),
    signal
  });

  if (!response.ok) {
    let errorMsg = `请求失败 (${response.status})`;
    try {
      const errJson = await response.json();
      if (errJson.error) errorMsg = errJson.error;
    } catch (_) {}
    throw new Error(errorMsg);
  }

  return await parseSseStream(response, onChunk);
}

export async function generateQuickSummary({ currentDoc, pageText }) {
  const docTitle = currentDoc?.fileName || '文档';
  const cleanText = (pageText || '').trim().slice(0, 2000);

  const messages = [
    {
      role: 'system',
      content: '你是一位高效的文献总结专家。请基于用户提供的文档标题及片段，输出精炼的摘要总结。'
    },
    {
      role: 'user',
      content: `请对文档《${docTitle}》进行快速提炼，生成：\n1. 一句话核心结论 (不超过 80 字)\n2. 两个关键论点 (每个不超过 50 字)\n\n参考文本片段：\n${cleanText}`
    }
  ];

  const response = await fetch('/api/bailian/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'qwen-plus',
      messages,
      stream: false,
      temperature: 0.5
    })
  });

  if (!response.ok) {
    throw new Error(`总结请求失败: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

export async function generateMindmapStructure({ currentDoc, pageText }) {
  const docTitle = currentDoc?.fileName ? currentDoc.fileName.replace(/\.pdf$/i, '') : '核心主题';
  const cleanText = (pageText || '').trim().slice(0, 2000);

  const prompt = `请基于文档《${docTitle}》的内容，提炼 3-4 个主要结构分支，每个分支包含 2-3 个关键子概念。直接返回标准 JSON 数组格式（不要附带任何 markdown 标记或解释文字），格式如下：
[
  { "title": "分支名称1", "children": ["子概念1", "子概念2"] },
  { "title": "分支名称2", "children": ["子概念3", "子概念4"] }
]

文档片段参考：\n${cleanText}`;

  const response = await fetch('/api/bailian/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'qwen-plus',
      messages: [{ role: 'user', content: prompt }],
      stream: false,
      temperature: 0.3
    })
  });

  if (!response.ok) {
    throw new Error(`脑图生成失败: ${response.status}`);
  }

  const data = await response.json();
  const rawText = data.choices?.[0]?.message?.content || '[]';
  const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(cleanJson);
  } catch (err) {
    return [
      { title: docTitle, children: ['核心论点分析', '实验与实证结果', '结论与研究展望'] }
    ];
  }
}
