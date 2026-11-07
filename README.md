# 洗发水成分表

进入网站先显示插画首页，点击「查看成分表」平滑滑到资料页，点击左上角英文名称返回首页。按六大模块浏览 152 条成分，选择左侧头皮、发质和当前状态后，立即显示上方绿色「推荐」与下方红色「避开」。清空选择可恢复完整总表。支持成分搜索，所有状态使用相同六列和原始内容。

## 本地运行

需要 Node.js 22.12+。

```sh
npm ci
npm run dev
```

打开 http://127.0.0.1:5173/ 。

```sh
npm test
npm run build
npm run preview
```

构建结果在 `dist/`，可用于静态托管。

## Netlify 部署

关联 GitHub 仓库 `10522-x/shampoo-atlas`，部署分支选 `main`。根目录的 `netlify.toml` 指定 Node.js 22、构建命令 `npm run build` 和发布目录 `dist`。

手动上传时，先运行 `npm ci`、`npm run build`，再将生成的 `dist/` 文件夹拖入 Netlify 的部署区域。该文件夹根层包含 `index.html`、`assets/`、`fonts/` 和 `illustrations/`。

如果出现 JSX 模块 MIME 错误并伴随字体 404，请检查实际发布目录是否为 `dist`：构建后的首页加载 `/assets/*.js`，字体位于 `/fonts/`。

## 文件入口

- `AGENTS.md`：已确定的产品规则。
- `DESIGN.md`、`design-references/`：用户选定的外观与交互参考。
- `src/App.jsx`：页面状态、搜索与表格切换。
- `src/components/`：首页、常驻筛选栏与统一六列表格。
- `public/illustrations/hair-garden.svg`：原创首页矢量插画。
- `src/data/ingredients.json`：152 条原始数据，保留 `ai_studio_code.txt` 的记录内容。
- `src/data/modules.js`：六模块归属与展示顺序。
- `src/data/profile-options.js`：头皮、发质和状态选项。
- `src/lib/matching.js`：匹配规则；`test/matching.test.js`：数据完整性与关键规则验证。
- `public/fonts/`：成分表使用本地 Noto Sans SC；其他界面使用用户提供的王漢宗顏楷體繁，简体缺字由霞鹜文楷屏幕版补齐。保留相应许可／来源信息，无远程字体依赖。新增文字时需更新子集，设计细节见 `DESIGN.md`。

## 当前匹配范围

这是基于原始适合／避开标签的初版匹配。标签含多个明确条件时需同时满足，冲突时避开优先，未匹配成分不强制归类。未采集的浓度、pH、过敏史、疾病诊断、浅色漂发等不作推断。

配伍与条件原文仍显示在表格中；当前尚未实现完整配方中的多成分相互作用判断，也未逐条核实原始文献。页面无后端，用户选择只存在当前页面内存中。

## 洗发水分析 skill

`skills/shampoo-advisor/` 是可独立携带的技能包，包含同一份 152 条数据库、名称索引和网站匹配规则的快照。AI 读取成分表照片并转录，Node.js 脚本本地查库，再由 AI 结合头皮／发质解释。支持单款及多款批量输入；模糊名称只列候选，不自动当作已确认成分。用户明确提供的具体避开成分单独比较。它没有把网站升级为上传图片的在线服务。

脚本只需 Node.js 18+，无需 `npm install`、API key 或网络；网站仍需上述 Node.js 22.12+。完整用法见 `skills/shampoo-advisor/SKILL.md` 和 `references/input-output.md`。

```sh
npm run skill:sync
npm test
npm run skill:benchmark
node skills/shampoo-advisor/scripts/analyze.mjs --input input.json --pretty
```

`skill:sync` 从网站源文件重新生成技能内快照与 SHA-256 清单，修改源库、匹配规则或别名后应运行，再检查测试。基准分别报告同一进程内检索和新进程启动＋检索，不包含读图或 AI 回答。单成分线索不能替代完整配方判断，出处与原始分级也尚未逐条核验。

本次交付的 `releases/shampoo-advisor.zip` 内含 `shampoo-advisor/` 根文件夹。在支持本地技能与脚本的 AI 工具中，将该文件夹放入其技能目录即可。Codex 的用户目录为 `~/.agents/skills/`，本机安装位置为 `C:\Users\Admin\.agents\skills\shampoo-advisor`。在新聊天的技能选择器中选择它，或输入 `$shampoo-advisor`；如果列表未刷新，重新打开聊天或应用。仅创建在普通 `skills/` 源目录里不会自动注册；数据库更新后也需同步安装副本和 ZIP。

调用示例：“使用 $shampoo-advisor，我是油性头皮、细软发、染烫后容易毛躁，请结合上传的成分表照片判断这瓶洗发水是否适合。”
