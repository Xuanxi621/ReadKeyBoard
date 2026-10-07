# PDF 智能星轨系统 — EasyInput 硬件联动版

## 🌟 核心特性

### 1. EasyInput 硬件直连 (ESP32-S3 / COM3 串口直通)
适配 [CY-CHENYUE/easy-input-maker](https://github.com/CY-CHENYUE/easy-input-maker) 与 [CY-CHENYUE/easyinput-board-cy](https://github.com/CY-CHENYUE/easyinput-board-cy)：
- **Web Serial COM3 直连**：
  - 点击「按键设置」中的 **「连接 COM3 串口」**，即可通过浏览器 Web Serial API 直接握手 ESP32-S3（默认 115200 波特率）。
  - 支持实时报文过滤与解析（`KEY1`~`KEY8`、`S1`~`S8`、`ENC_LEFT`、`ENC_RIGHT`、`ENC_PRESS`、JSON 等）。
  - 内置 **串口实时监控终端**，可展开查看 COM3 原始通信日志。
- **8 独立按键 + 1 旋转编码器硬件级映射**：
  - 🔄 **旋转编码器**：
    - `ENC_RIGHT (顺时针旋转 CW)` ➔ 默认 **翻到下一页 (Next Page)**
    - `ENC_LEFT (逆时针旋转 CCW)` ➔ 默认 **翻到上一页 (Prev Page)**
    - `ENC_PRESS (旋钮按压 Click)` ➔ 默认 **全屏研读 / 返回星轨 (Toggle View)**
  - 🎹 **8 个物理机械按键 (S1 ~ S8)**：
    - `S1 (KEY1 · GPIO2)` ➔ 默认 **上传本地 PDF 文档 (Upload PDF)**
    - `S2 (KEY2 · GPIO47)` ➔ 默认 **翻到下一页 (Next Page)**
    - `S3 (KEY3 · GPIO38)` ➔ 默认 **放大文档 (Zoom In)**
    - `S4 (KEY4 · GPIO41)` ➔ 默认 **缩小文档 (Zoom Out)**
    - `S5 (KEY5 · GPIO1)` ➔ 默认 **AI 核心要点提炼 (AI Summary)**
    - `S6 (KEY6 · GPIO6)` ➔ 默认 **深度精读模式切换 (Toggle Deep Mode)**
    - `S7 (KEY7 · GPIO7)` ➔ 默认 **翻到上一页 (Prev Page)**
    - `S8 (KEY8 · GPIO48)` ➔ 默认 **自适应宽度 / 重置缩放 (Fit Width)**
- **即时触觉与视觉反馈 (HUD)**：
  - 外设按键或旋钮触发时，屏幕中央弹出半透明胶囊 HUD（如 `S2 ➔ 翻到下一页`），研读交互极速响应。
- **免驱与键盘/HID 双轨兼容**：
  - 若 EasyInput 运行于 USB HID 键盘/鼠标模式或蓝牙模式，无需串口也能免驱自动响应关联快捷键及滚轮事件。
- **按键模拟测试**：
  - 面板内置「按键测试模拟」工具条，无需插入硬件也可提前一键校验所有按键和旋钮交互。

---

### 2. 本地真实 PDF 星轨与持久化
- **IndexedDB 本地存储**：
  - 上传的真实 PDF 文件在本地浏览器 IndexedDB 数据库安全保存，刷新页面不丢失。
- **智能防重拦截**：
  - 上传已有同名文件时即刻预警并拦截，保持文档库纯净。
- **单文档单星轨**：
  - 严格保持 1 份 PDF = 唯一 1 张环绕卡片。
- **零碎纸片 3D 星轨**：
  - 不规则倾角、真实纸质阴影、随鼠标拖拽与惯性动态公转。

---

## 🚀 启动与使用方式

在终端运行以下标准命令之一即可启动 React 开发服务：

```bash
# 推荐：启动 Vite 快速热重载开发服务器 (默认端口 3000，自动打开浏览器)
npm run dev

# 或者
npm start
```

### 生产打包构建
```bash
npm run build
```

---

## 🔌 硬件连接流程
1. 启动项目后，将 EasyInput 开发板通过 USB 插入电脑（设备管理器中识别为 COM3）。
2. 点击主页或阅读界面的 **「按键设置」** 按钮，点击 **「连接 USB 串口 (COM3)」** 并在浏览器弹窗中选中该端口。
3. 即可使用 EasyInput 的旋钮快速翻页、8 个按键控制 AI 总结、缩放和全屏！
