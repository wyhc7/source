# Requirements Document

## Introduction

URL AI 生成器是 Legado Source Generator 的新增功能，允许用户输入小说网站 URL，扩展自动爬取页面结构并调用 LLM API 生成完整的书源规则（搜索 URL、列表选择器、详情/目录/正文规则），用户验证后可直接导出。

## Glossary

- **AI 生成模式**：用户输入 URL，扩展自动爬取并生成书源规则的交互模式
- **书源规则**：Legado APP 使用的 JSON 格式书源配置，包含搜索、详情、目录、正文等字段
- **LLM**：大型语言模型，通过兼容 OpenAI 格式的 API 调用
- **爬取**：扩展向目标 URL 发起 HTTP 请求获取页面 HTML
- **规则验证**：用户对 AI 生成的书源规则进行预览、修改、确认的过程

## Requirements

### Requirement 1: AI 设置管理

**User Story:** AS 用户，I want 在扩展内配置 LLM API Key 和 Base URL，so that 能够调用第三方 AI 生成书源。

#### Acceptance Criteria

1. THE 设置页 SHALL 提供 "AI 生成" 配置区域，包含 API Key、Base URL、模型名三个字段。
2. WHEN 用户保存设置，THE 扩展 SHALL 将 API Key 和 Base URL 存储到 chrome.storage.local。
3. IF API Key 为空，THE 扩展 SHALL 在点击"AI 生成"时提示用户先配置 API Key，不发起请求。
4. THE Base URL SHALL 默认为 `https://api.openai.com/v1`，用户可自定义为任何兼容 OpenAI 格式的端点。
5. THE 模型名 SHALL 默认为 `deepseek-chat`。
6. THE API Key SHALL 以密文形式显示（`••••••••`），提供"显示/隐藏"切换按钮。

### Requirement 2: AI 生成入口

**User Story:** AS 用户，I want 在侧边栏顶部有一个"AI 生成"入口按钮，so that 能够快速进入 URL 输入界面。

#### Acceptance Criteria

1. THE 侧边栏 SHALL 在主 Tab 栏上方显示"AI 生成"按钮，按钮图标为 ✨ 或 🤖。
2. WHEN 用户点击"AI 生成"按钮，THE 侧边栏 SHALL 切换到 AI 生成模式。
3. WHILE 在 AI 生成模式，THE 原有规则 Tab  SHALL 被隐藏，界面显示 URL 输入框和生成按钮。
4. IF 当前浏览器标签页已有活跃 URL，THE URL 输入框 SHALL 自动填充该 URL。

### Requirement 3: URL 爬取与 AI 请求

**User Story:** AS 用户，I want 输入 URL 后点击生成，AI 自动爬取页面并生成书源，so that 无需手动点选元素。

#### Acceptance Criteria

1. WHEN 用户点击"生成书源"按钮，THE 扩展 SHALL 向目标 URL 发起 HTTP GET 请求获取页面 HTML。
2. WHEN 页面内容获取成功，THE 扩展 SHALL 截取前 15000 字符的 HTML 作为上下文发送给 LLM。
3. WHEN 调用 LLM API，THE 请求 SHALL 使用 JSON 格式，包含页面 HTML、URL、书源生成指令。
4. IF HTTP 请求失败（网络错误、403、超时），THE 扩展 SHALL 显示错误提示，不进入加载状态。
5. IF LLM API 调用失败，THE 扩展 SHALL 显示对应错误信息（认证失败、配额不足、格式错误等）。
6. WHILE LLM 正在生成，THE 界面 SHALL 显示加载动画和"正在分析页面结构..."提示。

### Requirement 4: 生成结果展示

**User Story:** AS 用户，I want 查看 AI 生成的书源规则并可以应用或修改，so that 可以快速获得可用的书源。

#### Acceptance Criteria

1. WHEN LLM 返回生成结果，THE 扩展 SHALL 解析 JSON 响应并展示书源字段预览。
2. THE 结果展示 SHALL 以表单形式呈现各字段（名称、搜索 URL、列表选择器、详情/目录/正文规则等）。
3. WHEN 用户点击"应用到规则页"，THE 生成的书源 SHALL 填充到当前激活的规则类型 Tab。
4. WHEN 用户点击"复制 JSON"，THE 完整书源 JSON SHALL 复制到剪贴板并显示成功提示。
5. WHILE 结果展示，THE 用户 SHALL 可以手动修改任意字段。
6. IF 响应不是合法 JSON，THE 扩展 SHALL 显示原始文本并提示用户手动整理。

### Requirement 5: 安全与隐私

**User Story:** AS 用户，I want API Key 仅存储在本地，so that 不会泄露到第三方服务器（除 LLM API 本身）。

#### Acceptance Criteria

1. THE API Key SHALL 仅存储在 chrome.storage.local，不上传到任何中间服务器。
2. THE API Key SHALL 不在日志、错误信息或网络请求 URL 中明文显示。
3. IF 用户清除扩展数据，THE API Key SHALL 被同步清除。
