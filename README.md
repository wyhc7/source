# Legado 书源生成器

> 为 [阅读](https://github.com/gedoor/legado) APP 生成书源规则的浏览器扩展

## 交流群

1101980180

## 演示视频

[![6分44秒生成完整书源并调试成功](https://socialify.git.ci/z1131392774/legado-source-generator/image?description=1&font=Inter&language=1&name=1&owner=1&theme=Auto)](https://www.bilibili.com/video/BV1ipDdBkEjA/)

> 点击观看完整演示视频

---

## 功能特性

### AI 书源生成（推荐）

输入小说网站 URL，AI 自动分析页面结构，一键生成完整书源规则。

1. 点击扩展图标打开侧边栏
2. 切换到 **AI 生成** 标签页
3. 在 **AI 设置** 中配置 LLM API Key（支持 DeepSeek、OpenAI 及任意兼容 OpenAI 格式的端点）
4. 输入小说网站 URL，点击 **AI 生成书源**
5. 查看生成的书源字段，可手动编辑后点击 **应用到规则页** 或 **复制 JSON**

### 可视化元素选择

通过点选页面元素自动生成 CSS 选择器，支持 keyboard 精确导航。

- **列表字段**：选择两个同列表元素，自动取交集生成稳定选择器
- **普通字段**：直接点击目标元素
- 键盘快捷键：`↑` 父元素、`↓` 子元素、`←` 前兄弟、`→` 后兄弟、`Enter` 确认、`Esc` 取消

### 搜索 URL 自动捕获

自动拦截页面搜索请求，生成带占位符的搜索 URL。

- 支持 GET / POST 两种请求方式
- 自动检测字符编码（UTF-8 / GBK / BIG5）
- 支持 `{{page}}` 分页占位符

### 发现页 URL 编辑

可视化卡片管理发现页导航，支持：

- 拖拽排序、拖拽调整宽度
- 批量 URL 替换（模板匹配 / 正则匹配）
- Flexbox 布局属性批量编辑
- 样式模板管理

### 其他功能

- **状态持久化**：所有填写内容自动保存
- **自动检查更新**：对比 GitHub 最新版本
- **快速插入片段**：自定义文本片段，一键插入任意输入框
- **调试面板**：连接阅读 APP 实时调试书源

---

## 安装

### Chrome / Edge

1. 打开 `chrome://extensions/`（Edge 为 `edge://extensions/`）
2. 开启**开发者模式**
3. 点击**加载已解压的扩展程序**，选择 `dist/chrome` 目录
4. 建议固定扩展图标

> Edge 基于 Chromium 内核，直接兼容 Chrome (MV3) 扩展。

### Firefox

> ⚠️ Firefox 版本（MV2）为适配移植版本，如遇问题请优先使用 Chrome / Edge。

#### 方式一：从扩展商店安装（推荐）

1. 访问 [Firefox 扩展商店](https://addons.mozilla.org/)
2. 搜索 **Legado Source Generator**
3. 点击"添加到 Firefox"

#### 方式二：临时加载（开发/测试）

1. 访问 `about:debugging#/runtime/this-firefox`
2. 点击**临时载入附加组件**
3. 选择 `dist/firefox/manifest.json`

---

## AI 书源生成详解

### 支持的 LLM 提供商

| 提供商 | Base URL | 推荐模型 |
|--------|----------|---------|
| DeepSeek | `https://api.deepseek.com/v1` | `deepseek-chat` / `deepseek-reasoner` |
| OpenAI | `https://api.openai.com/v1` | `gpt-4o` / `gpt-4o-mini` |
| 自定义 | 任意兼容 OpenAI 格式的端点 | 按需填写 |

### AI 设置步骤

1. 打开侧边栏 → **AI 设置** 标签
2. 填入 **API Key**（仅本地存储，不上传）
3. 填入 **Base URL**（默认 DeepSeek）
4. 填入 **模型名**（默认 `deepseek-chat`）
5. 点击 **保存设置**

### 使用流程

1. 在浏览器中打开目标小说网站
2. 打开扩展侧边栏 → **AI 生成** 标签
3. URL 输入框会自动填充当前页面地址（可手动修改）
4. 点击 **AI 生成书源**
5. 等待 AI 分析页面并返回结果（约 10-30 秒）
6. 查看生成的各字段，可点击 **Edit** 手动修改
7. 点击 **应用到规则页** 将结果填入当前规则类型，或 **复制 JSON** 导出

---

## 使用方法

### 规则页（搜索 / 书籍信息 / 目录 / 正文）

1. 点击扩展图标打开侧边栏
2. 选择规则类型标签（搜索规则 / 书籍信息 / 目录规则 / 内容规则）
3. 点击 **选择列表** 选择书籍列表/章节列表元素（可选）
4. 按步骤填写各字段，点击 **选择元素** 后在页面上点选目标元素
5. 完成后点击 **导出** 获取书源 JSON
6. 导入到阅读 APP

### 调试

#### 连接设置

阅读 APP → 我的 → Web服务 → 填入 IP 和端口号。

#### 调试关键字

| 格式 | 说明 |
|------|------|
| 普通文本 | 搜索 |
| 分类名::URL | 发现 |
| URL | 详情 |
| ++URL | 目录 |
| --URL | 正文 |

留空时默认关键字为"我的"。

#### 日志调试

**看输入** — 加在规则最前面：
```
<js>java.log("输入" + result);</js>你的原规则
```

**看输出** — 加在规则最后面：
```
你的原规则<js>java.log("输出" + result);</js>
```

### webView 说明

webView 让规则在渲染后的页面中执行，适合动态加载的网站。

- **建议开启**：规则看起来没错但结果一直空、目录/正文抓不到、翻页不生效
- **不建议开启**：已能正常抓取的字段（开启会变慢）
- **新手顺序**：先全部不开，有问题再精准开启

### 过 Cloudflare 盾

部分网站有 CF 5 秒盾，直接请求会 403。扩展提供"开启过 Cloudflare 盾"选项，勾选后自动注入 `loginCheckJs` 处理 CF 验证。

---

## 错误提示

选择器会自动检测潜在问题：
- **Shadow DOM**：元素在 Shadow DOM 内，选择器可能不生效
- **Iframe**：跨域限制可能影响选择
- **动态 Class**：自动生成的 class 名称可能不稳定
- **空选择器**：未选择有效元素
- **无匹配**：选择器返回零个元素

---

## 项目结构

```
src/
├── manifest.json              # 扩展配置 (MV3)
├── background/                # Service Worker
├── content/                   # Content Script
├── core/
│   ├── ai-fetch.ts            # AI 爬取与 LLM 调用
│   ├── ai-parser.ts           # AI 响应解析
│   ├── check-update.ts        # 版本检查
│   ├── explore-url.ts         # 探索 URL 管理
│   ├── import-export.ts       # 书源导入导出
│   ├── indexed-rule.ts        # 索引规则生成
│   ├── quick-snippet.ts       # 快速片段
│   ├── search-capture.ts      # 搜索 URL 捕获
│   └── selector-generator.ts  # CSS 选择器生成
├── injected/                  # 页面注入脚本
├── platform/                  # 平台抽象层
├── popup/                     # Popup 入口
├── sidepanel/                 # SidePanel 入口
├── store/                     # Zustand 状态管理
├── types/                     # TypeScript 类型定义
└── ui/
    ├── components/
    │   ├── AiPanel.tsx        # AI 生成面板
    │   ├── AiSettings.tsx     # AI 设置面板
    │   ├── CategoryTree.tsx   # 分类树编辑器
    │   ├── DebugPanel.tsx     # 调试面板
    │   ├── ExploreCardGrid.tsx # 发现页 URL 卡片网格
    │   ├── FieldEditor.tsx    # 单字段编辑器
    │   └── common/            # 通用 UI 组件
    └── pages/
        ├── Popup.tsx          # Popup 主页面
        └── SidePanel.tsx      # 侧边栏主页面

tests/
└── unit/
    └── ai-fetch.test.ts       # AI 功能单元测试
```

---

## 开发

```bash
# 安装依赖
pnpm install

# 开发模式（同时启动 Chrome 和 Firefox 构建）
pnpm dev

# 构建
pnpm build:chrome   # Chrome MV3
pnpm build:firefox  # Firefox MV2

# 代码检查
pnpm lint
pnpm typecheck
pnpm test:unit
```
