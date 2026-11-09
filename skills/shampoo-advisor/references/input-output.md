# 输入与结果约定

## 命令

```text
node scripts/analyze.mjs --input input.json
node scripts/analyze.mjs --stdin
node scripts/analyze.mjs --input input.json --full --pretty
node scripts/analyze.mjs --lookup "月桂醇硫酸酯钠" --pretty
```

路径相对于 skill 目录；实际调用可用绝对路径。`--stdin` 从标准输入读取同样的 JSON。默认只输出一行 JSON；错误输出到 stderr 并返回非零退出码。JSON 文件可带 UTF-8 BOM。没有自动 OCR 或图片网络上传。

## 单款与批量

单款为 `profile`、`ingredients`、可选 `label`、`avoidIngredients`、`name`。`ingredients` 必须为有序数组，每项为非空字符串或 `{ "name": "…", "uncertain": true, "section": "其他微量成分" }`。确定可读的条目省略 `uncertain`。脚本拒绝不认识的字段和属性值，避免静默丢弃输入。

`label.complete`、`label.orderPreserved` 为布尔值，缺省时结果保留为 `null`（未知），不默认完整。分组内的展示位置仅表示转录顺序。OCR 文字里的换行、顿号、逗号、斜杠不由脚本拆分，因为 `1,2-己二醇`、`辛基/辛酸基葡糖苷` 等本来就含分隔符。AI 根据图上真正的条目边界生成数组。

多款共享一个用户 profile，且每款独立保留标签与覆盖范围：

```json
{
  "profile": {"scalp": "oily", "hair": "fine", "states": []},
  "avoidIngredients": ["甲基异噻唑啉酮"],
  "products": [
    {"name": "A款", "label": {"complete": true, "orderPreserved": true}, "ingredients": ["水", "SLES", "CAPB", "泛醇"]},
    {"name": "B款", "label": {"complete": false}, "ingredients": ["水", "SCI", {"name": "甲基异噻…", "uncertain": true}]}
  ]
}
```

`profile` 可省略，做一般资料检索；有用户已知条件时应填写。`scalp`、`hair` 可为空字符串；`states` 可为 `[]`。脚本不从自由文本推断个人状态。

## 输出

- `database`: 记录数、数据 SHA-256、快照版本；`profile`: 实际用于匹配的属性。
- `products[]`: 每款 `name`、`label`、`summary`、`rows`、`explicitAvoidStatus`、`limitations`。
- `summary`: 总条目、已确认入库数、未收录数、模糊／歧义数、support／caution／neutral 数。重复标签保留原位置，匹配数量按条目计数而非独立成分；`uniqueMatched` 单列去重数量。
- `rows[]`: `position`、`input`、可选 `section`。已确认记录有 `status: matched`、规范 `id` / `cn` / `inci`、模块、`signal`、`matchedTags`、`func`、`synergy`、`src`，以及 `refs`、`evidence`、`cautions`、`regulatory`、`isDrug`、`consumerMatch`、`typicalProduct`。`--full` 额外返回规范记录。schemaVersion 2 移除了无依据的 `sourceGrade`；来源核实进度不等于功效等级。
- 未确认行的 `status` 为 `uncertain`、`ambiguous` 或 `unlisted`，`candidates` 仅为核对候选，不纳入命中或匹配。名称统一全半角、空格与常用连字符；字母大小写不敏感；数字及逗号、斜杠等语义仍保留。
- `explicitAvoidStatus`: 用户具体避开名的确认出现位置、疑似位置，以及 `present` / `uncertain` / `not_confirmed`。未入库的避开名称也进行**完整名称**比较；“香精”不会靠子串命中“乙基香精”或自动扩展到精油。对于照片里的不确定条目，仍返回可能相关的位置。
- `limitations`: 按实际缺口给出条件，包含标签不完整／未知、条目未覆盖、没有用户条件和单成分标签不等于配方结论。始终披露文献尚未逐条核验。不会生成整瓶评分或强制二选一。

`--lookup` 对完整名称先作精确检索；未命中只返回最多三个拼写邻近或局部包含的候选，不视为匹配。不要将建议候选直接加入配方。
