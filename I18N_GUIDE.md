# 项目国际化 (i18n) 使用指南

这个是一套适用于长期运行、功能不断增加、涉及多人员协作开发的 Web 应用的国际化方案最佳实践。

本文档详细说明了本项目国际化方案的架构、使用方法及开发流程。

## 1. 架构概览

本项目采用了现代化的 React 国际化技术栈：

*   **核心库**: `react-i18next` (React 绑定) + `i18next` (核心逻辑)
*   **资源加载**: `i18next-http-backend`
    *   *特点*: 语言包作为静态资源（JSON）存放在 `public/locales` 目录，按需异步请求，减少主包体积。
    *   *懒加载*: 默认只加载 `common` 命名空间，其他业务模块（如 `downloadCenter`）仅在进入对应页面时才加载。
*   **语言检测**: `i18next-browser-languagedetector`
    *   *策略*: 查询参数 (`?lang=`) > 本地存储 (`localStorage`) > 浏览器默认语言。
*   **自动化工具**: `i18next-parser`
    *   *功能*: 自动扫描代码中的 `t()` 调用，根据命名空间生成或更新 JSON 语言文件，彻底告别手动维护 Key 的繁琐。
*   **类型安全**: TypeScript
    *   *功能*: 利用 Module Augmentation 技术，提供 Key 的自动补全和拼写检查。

## 2. 目录结构

```text
root/
├── public/
│   └── locales/               # 静态语言包目录
│       ├── zh-CN/             # 中文资源
│       │   ├── common.json    # 公共命名空间
│       │   ├── profile.json   # 个人中心命名空间
│       │   └── ...
│       └── en-US/             # 英文资源
├── src/
│   ├── i18n/
│   │   ├── index.ts           # i18n 初始化与配置核心
│   │   ├── i18next.d.ts       # TypeScript 类型定义扩展
│   │   └── resources.ts       # 资源类型导出
│   └── ...
├── i18next-parser.config.js   # 自动提取工具配置文件
└── package.json               # 包含 i18n:extract 脚本
```

## 3. 基础用法

### 3.1 在组件中使用 Hook

这是最常用的方式。

```tsx
import { useTranslation } from 'react-i18next'

export default function UserProfile() {
  // 1. 加载 'profile' 和 'common' 命名空间
  // 第一个参数是主命名空间，t 函数默认会在这个空间查找
  const { t } = useTranslation(['profile', 'common'])

  return (
    <div>
      {/* 2. 使用 Key 获取翻译 */}
      <h1>{t('basicInfo')}</h1>
      
      {/* 3. 访问其他命名空间的 Key (需加前缀) */}
      <button>{t('common:save')}</button>

      {/* 4. 支持插值 */}
      <p>{t('welcomeUser', { name: 'John' })}</p>
    </div>
  )
}
```

### 3.2 切换语言

通常在设置或导航栏组件中调用：

```tsx
import i18n from '@/i18n'

// 切换为英文
const changeToEnglish = () => {
  i18n.changeLanguage('en-US')
}
```

## 4. 开发工作流 (自动化模式)

我们不再手动创建 JSON 文件中的 Key，而是采用 **"代码优先"** 的策略。

### 步骤 1: 在代码中编写 Key
在开发组件时，直接写好 Key。如果还没有 Key，可以先写这一行代码。

```tsx
// src/pages/NewFeature.tsx
const { t } = useTranslation('newFeature') // 定义一个新的命名空间

return <div>{t('pageTitle', '新功能标题')}</div> // 第二个参数是默认中文
```

### 步骤 2: 注册命名空间 (可选)
如果是全新的命名空间（如上面的 `newFeature`），建议在 `src/i18n/index.ts` 的 `ns` 数组中添加它，以便预加载（非强制，但推荐）。

```typescript
// src/i18n/index.ts
ns: ['common', 'profile', 'newFeature'], // 添加 'newFeature'
```

### 步骤 3: 运行提取脚本
在终端执行以下命令：

```bash
npm run i18n:extract
```

**执行结果**:
1.  工具会自动扫描 `src` 下的所有文件。
2.  自动在 `public/locales/zh-CN/` 和 `public/locales/en-US/` 下创建 `newFeature.json`。
3.  自动将 `pageTitle` 写入 JSON 文件。
    *   对于 `zh-CN`，如果代码里提供了默认值 `'新功能标题'`，它会直接填入。
    *   对于 `en-US`，它会生成 Key，值默认为空或 Key 本身（取决于配置），等待翻译。

### 步骤 4: 补充翻译
打开 `public/locales/en-US/newFeature.json`，填入对应的英文翻译即可。

## 5. 高级特性

### 5.1 动态加载与环境适配
配置位于 `src/i18n/index.ts`。
我们特别处理了 `loadPath`，使其支持非根目录部署（如部署在 `/hmdp/` 子路径下）：

```typescript
backend: {
  // 自动拼接 VITE_APP_CONTEXT_PATH，并添加版本号防止缓存
  loadPath: `${(import.meta.env.VITE_APP_CONTEXT_PATH || '/').replace(/\/$/, '')}/locales/{{lng}}/{{ns}}.json?v=${import.meta.env.VITE_APP_VERSION || '1.0.0'}`,
},
```

### 5.2 TypeScript 类型智能提示
由于 JSON 文件是动态生成的，我们通过 `src/i18n/i18next.d.ts` 和 `src/i18n/resources.ts` 实现了类型定义。
虽然目前主要依靠手动或半自动维护 `resources.ts`（或者利用 IDE 插件），但 `react-i18next` 结合 TS 可以防止低级拼写错误。

### 5.3 IDE 增强 (i18n Ally)
项目已配置 `.vscode/settings.json`。建议安装 VS Code 插件 **i18n Ally**。
*   **效果**: 代码中的 `t('login.title')` 旁边会直接显示 "登录"，鼠标悬停可修改翻译，无需在文件间来回跳转。

## 6. 常见问题

**Q: 页面显示 `login.title` 而不是 "登录"？**
A: 
1. 检查网络请求 (DevTools -> Network)，看 `.json` 文件是否加载失败（404）。
2. 检查 `public/locales/zh-CN/` 下对应的 JSON 文件中是否有该 Key。
3. 检查组件 `useTranslation('namespace')` 中的命名空间是否与 JSON 文件名一致。

**Q: 新加的 Key 没显示？**
A: 请务必运行 `npm run i18n:extract`，它会帮你同步 JSON 文件。

**Q: 修改了 JSON 但页面没变化？**
A: 浏览器可能会缓存 JSON 文件。尝试清除缓存或在开发模式下刷新页面（Vite 开发服务器通常会处理缓存）。
