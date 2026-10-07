// 预置学术论文与研报数据
const PRESET_DOCUMENTS = [
  {
    id: 'paper-transformer',
    title: 'Attention Is All You Need',
    authors: 'Ashish Vaswani, Noam Shazeer, Niki Parmar, et al. (Google Brain & Research)',
    year: '2017',
    venue: 'NeurIPS 2017',
    pages: 15,
    fileSize: '2.4 MB',
    coverImage: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
    oneLiner: '提出了首个完全基于注意力机制、无需任何循环（RNN）或卷积（CNN）的序列转导模型 Transformer，实现了机器翻译效率与质量的质的飞跃。',
    keyTakeaways: [
      {
        tag: '核心架构',
        text: '提出了 Encoder-Decoder 结构，完全依托 Multi-Head Attention（多头自注意力）与 Position-wise Feed-Forward 网络，实现全局信息的 O(1) 步长直接交互。'
      },
      {
        tag: '并行化优势',
        text: '彻底打破 RNN 的时序递归依赖瓶颈，前向计算在时序维度上可完全并行化，在大规模 GPU 集群上的训练吞吐量提升了数个数量级。'
      },
      {
        tag: '实证效果',
        text: '在 WMT 2014 英德翻译任务上达到 28.4 BLEU，刷新 SOTA 并减少了数倍的训练成本；在英法任务上达到 41.8 BLEU。'
      },
      {
        tag: '机制设计',
        text: '引入 Scaled Dot-Product Attention 以防止因向量维度过高导致梯度消失；设计 Positional Encoding 解决位置感知问题。'
      }
    ],
    outline: [
      { page: 1, title: '1. Introduction (引言与背景)' },
      { page: 2, title: '2. Background (循环与卷积时序模型困境)' },
      { page: 3, title: '3. Model Architecture (Transformer 总体架构)' },
      { page: 4, title: '3.2 Multi-Head Attention (多头注意力数学定义)' },
      { page: 6, title: '3.5 Positional Encoding (正弦位置编码)' },
      { page: 8, title: '4. Why Self-Attention (计算复杂度与最大路径长度比较)' },
      { page: 10, title: '5. Training & Regularization (训练细节与标签平滑)' },
      { page: 12, title: '6. Results (机器翻译与英语解析评测结果)' },
      { page: 14, title: '7. Conclusion (结论与泛化能力展望)' }
    ],
    mindmap: [
      {
        title: 'Transformer Architecture',
        children: [
          {
            title: '1. Attention Mechanism',
            children: [
              'Scaled Dot-Product: QK^T / sqrt(d_k)',
              'Multi-Head Attention (h=8 heads)',
              'Self-Attention vs Cross-Attention'
            ]
          },
          {
            title: '2. Positional Encoding',
            children: [
              'Sinusoidal functions: sin & cos',
              'Relative position invariance'
            ]
          },
          {
            title: '3. Sublayers & Norm',
            children: [
              'Residual Connections (x + Sublayer(x))',
              'Layer Normalization',
              'Position-wise Feed-Forward Network'
            ]
          },
          {
            title: '4. Experimental Gains',
            children: [
              'WMT 2014 En-De: 28.4 BLEU',
              'Training speed: 3.5 days on 8 P100 GPUs'
            ]
          }
        ]
      }
    ],
    defaultQuestions: [
      {
        q: '为什么论文中缩放点击注意力的除数是 sqrt(d_k)？',
        a: '论文指出，当向量维度 $d_k$ 很大时，点积的结果数量级会变大，从而将 Softmax 函数推入梯度极小的饱和区（Vanishing Gradient）。通过除以 $\\sqrt{d_k}$ 进行尺度缩放，能将方差稳定在 1 左右，确保反向传播梯度充沛稳定。'
      },
      {
        q: 'Transformer 相比 LSTM 有何本质优势？',
        a: '1. **计算并行性**：LSTM 必须等 $t-1$ 步计算完才能算 $t$ 步；Transformer 的自注意力矩阵是全序列矩阵乘法，一次性并行完成。\n2. **解决长程遗忘**：两个任意距离单词之间的路径长度从 LSTM 的 $O(n)$ 缩减为 $O(1)$，无长程梯度衰减。\n3. **多模态可拓展性**：自注意力计算对序列格式通用，为后来的 Vision Transformer 与大语言模型打下坚实基石。'
      }
    ],
    mockPages: [
      {
        pageNum: 1,
        title: 'Attention Is All You Need',
        content: `Abstract
The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.

Experiments on two machine translation tasks show these models to be superior in quality while being more parallelizable and requiring significantly less time to train. Our model achieves 28.4 BLEU on the WMT 2014 English-to-German translation task, improving over the existing best results, including ensembles, by over 2 BLEU. On the WMT 2014 English-to-French translation task, our model establishes a new single-model state-of-the-art BLEU score of 41.8 after training for 3.5 days on eight GPUs, a small fraction of the training costs of the best models from the literature.

1. Introduction
Recurrent neural networks, especially long short-term memory (LSTM) and gated recurrent (GRU) neural networks, have been firmly established as state-of-the-art approaches in sequence modeling and transduction problems such as language modeling and machine translation. Subsequent efforts have since continued to push the boundaries of recurrent language models and encoder-decoder architectures.`
      },
      {
        pageNum: 2,
        title: '2. Background & Limitations of RNNs',
        content: `Recurrent models typically factor computation along the symbol positions of the input and output sequences. Aligning the positions to steps in computation time, they generate a sequence of hidden states h_t, as a function of the previous hidden state h_{t-1} and the input for position t.

This inherently sequential nature precludes parallelization within training examples, which becomes critical at longer sequence lengths, as memory constraints limit batching across examples. Recent work has achieved significant improvements in computational efficiency through factorization tricks and conditional computation, while also improving model performance in case of the latter. Fundamentally, the constraint of sequential computation remains.

Attention mechanisms have become an integral part of compelling sequence modeling and transduction models in various tasks, allowing modeling of dependencies without regard to their distance in the input or output sequences.`
      },
      {
        pageNum: 3,
        title: '3. Model Architecture',
        content: `Most competitive neural sequence transduction models have an encoder-decoder structure. Here, the encoder maps an input sequence of symbol representations (x_1, ..., x_n) to a sequence of continuous representations z = (z_1, ..., z_n). Given z, the decoder then generates an output sequence (y_1, ..., y_m) of symbols one element at a time. At each step the model is auto-regressive, consuming the previously generated symbols as additional input when generating the next.

The Transformer follows this overall architecture using stacked self-attention and point-wise, fully connected layers for both the encoder and decoder, shown in the left and right halves of Figure 1, respectively.

Encoder: The encoder is composed of a stack of N = 6 identical layers. Each layer has two sub-layers. The first is a multi-head self-attention mechanism, and the second is a simple, position-wise fully connected feed-forward network.`
      }
    ]
  },
  {
    id: 'report-ai-2026',
    title: 'Global AI Landscape 2026: Multimodal Reasoning & World Models',
    authors: 'Enter Frontier Research Institute',
    year: '2026',
    venue: 'Global AI Trends Whitepaper',
    pages: 28,
    fileSize: '4.8 MB',
    coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
    oneLiner: '全景评估 2026 年生成式人工智能从“语言理解”向“多模态具身推理与世界物理模型”跨越的关键演进路径。',
    keyTakeaways: [
      {
        tag: '世界模型成熟',
        text: '模型开始真正掌握物理因果律与三维时空仿真，不再局限于静态 token 关联预测。'
      },
      {
        tag: '端侧推理突破',
        text: '千亿级混合专家架构（MoE）在端侧 NPU 上的功耗优化达到可用阈值，实现 100% 离线自主研读与思考。'
      },
      {
        tag: 'Agent 协同生态',
        text: '由单一 Agent 转向专业化多 Agent 群体协作体系，研发与知识工作流自动化率突破 75%。'
      }
    ],
    outline: [
      { page: 1, title: '1. 执行摘要与核心洞察' },
      { page: 5, title: '2. 多模态物理世界模型架构演进' },
      { page: 12, title: '3. 长上下文与外部向量知识库技术' },
      { page: 19, title: '4. 具身智能硬件落地与算力趋势' },
      { page: 25, title: '5. 风险防范与安全对齐' }
    ],
    mindmap: [
      {
        title: 'Global AI Landscape 2026',
        children: [
          { title: 'World Models', children: ['Physics Simulation', 'Spatial Reasoning', 'Video Causality'] },
          { title: 'Agents Ecosystem', children: ['Autonomous Collaboration', 'Memory Persistence', 'Self-Refinement'] },
          { title: 'Compute & Edge', children: ['Specialized Silicon', 'Quantized Inference', 'Sub-1W Execution'] }
        ]
      }
    ],
    defaultQuestions: [
      {
        q: '报告对于 2026 年企业端部署的核心建议是什么？',
        a: '优先推进企业专有数据的动态向量知识库治理，并采用“小型特定领域专家模型 + 通用大模型编排调度”的混合架构，降低 60% 的推理成本并保障数据隐私。'
      }
    ],
    mockPages: [
      {
        pageNum: 1,
        title: 'Global AI Landscape 2026',
        content: `Executive Summary:
The paradigm of artificial intelligence has decisively shifted from statistical text interpolation to embodied multimodal reasoning and continuous physical world simulation. 
As models ingest synchronized spatial-temporal video streams and sensor telemetry, the boundary between sensory perception and semantic reasoning has dissolved.`
      }
    ]
  },
  {
    id: 'paper-embodied-ai',
    title: 'Embodied AI Architecture: Systems, Sensors, and Real-Time Planning',
    authors: 'Robotics & Vision Consortium',
    year: '2026',
    venue: 'IEEE Robotics & Automation',
    pages: 20,
    fileSize: '3.1 MB',
    coverImage: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=600&auto=format&fit=crop&q=80',
    oneLiner: '探讨具身机器人如何在开放真实环境中通过闭环感知、视听触融合及毫秒级轨迹规划实现自适应作业。',
    keyTakeaways: [
      {
        tag: '实时端到端控制',
        text: '采用 Vision-Language-Action (VLA) 模型架构，将视觉输入直接映射至关节力矩与六自由度位姿。'
      },
      {
        tag: '环境容错性',
        text: '在动态光照与未知碰撞扰动下，动作恢复成功率达 94.2%。'
      }
    ],
    outline: [
      { page: 1, title: '1. Introduction to Embodied Systems' },
      { page: 6, title: '2. Sensor Fusion & Calibration' },
      { page: 11, title: '3. Real-Time Action Prediction (VLA)' },
      { page: 17, title: '4. Experimental Deployments' }
    ],
    mindmap: [
      {
        title: 'Embodied AI Architecture',
        children: [
          { title: 'Perception', children: ['RGB-D Depth', 'Tactile Arrays', 'LiDAR SLAM'] },
          { title: 'Planning', children: ['Hierarchical Pathing', 'Dynamic Obstacle Avoidance'] },
          { title: 'Execution', children: ['Sub-10ms Feedback', 'Impedance Control'] }
        ]
      }
    ],
    defaultQuestions: [
      {
        q: '本文提到的 VLA 模型响应延迟是多少？',
        a: '通过端侧张量并行与量化加速，系统端到端推理与反馈延迟控制在 12ms 以内，满足高动态控制要求。'
      }
    ],
    mockPages: [
      {
        pageNum: 1,
        title: 'Embodied AI Architecture',
        content: `1. Introduction
Embodied Artificial Intelligence situates cognitive systems within physical agents capable of interacting with the real world. Unlike purely disembodied models, an embodied agent must navigate noise, latency, physical constraints, and safety-critical margins in dynamic human environments.`
      }
    ]
  }
];
