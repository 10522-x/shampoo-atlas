# 科学文案核对与修订记录

日期：2026-11-09。对应《成分表审查报告.md》的科学事实、证据强度及夸大表述部分。

## 修订范围与结论

`data-review/science-corrections.json` 提供 145 条成分修订补丁；西曲氯铵、氯咪巴唑、吡硫翁锌、环五聚二甲基硅氧烷、环己硅氧烷、酮康唑与二硫化硒由法规核对记录另行处理。本记录没有修改页面布局，也没有改写原始导入文件 `ai_studio_code.txt`。

145 条成分的作用与复配说明统一收敛为基础角色、配方条件和证据边界。删除无出处的精确百分比、固定比例、永久修复、零堆积、必然温和及确定生发等承诺。**这属于保守的编辑修订，不表示已经对 145 条记录分别完成了原始文献核验。**

不将原有 A/B 分级机械转换为临床功效等级。安全评估、体外研究、动物研究、原料商测试与人体成品试验不能混为一种证据。未核实来源的记录明确保留 `unverified`；实际读到的 PubMed 记录以结构化 `refs` 记录，并注明该文献能够支持的范围。

## 已核对的具体问题

- **烷基葡糖苷**：接触过敏风险有文献依据。移除四种 APG 针对严重接触性皮炎或敏感头皮的确定推荐；已知葡糖苷过敏列入独立注意事项。敏感头皮不等于已知成分过敏，也不据此把所有敏感者自动列为避开人群。
- **CAPB、LAPB 与酰胺胺**：CAPB 制造中 DMAPA、酰胺胺杂质与接触过敏相关；未找到支持 LAPB 杂质控制普遍优于 CAPB 的依据。硬脂酰胺丙基二甲胺生产样品中可检测 DMAPA 残留，但这不能证明所有同类成分必然交叉过敏。注意事项提示核对个人已知过敏原，不作统一发生率或交叉反应判断。
- **BTMS**：将 Methosulfate 的错误释义修正为甲基硫酸根；不由阴离子名称推出必然温和。
- **水解小麦蛋白**：日本报告涉及特定酸水解原料 Glupearl 19S 的经皮致敏。补充已知小麦／水解小麦蛋白过敏及相关运动诱发过敏史的注意事项，不把个案系列推为所有蛋白水解物的统一风险。
- **水解大米蛋白、酵母蛋白、泛醇、氨基酸**：移除未经核实的相反电荷机制、发干合成代谢、发干内转化泛酸及深入发芯重建等结论。保留调理、成膜与保湿角色及其条件。
- **咖啡因、薄荷油、生物素、迷迭香油、锯叶棕**：区分体外、动物、口服及外用证据；不从这些资料推出未知浓度淋洗产品的生发效果。这五项设置 `consumerMatch: false`，不自动生成人群推荐。
- **茶树油与椰子油**：保留有明确研究对象的资料，同时注明 5% 茶树油特定洗发水试验，以及椰子油研究中的发束／洗前洗后用油场景，不能外推为任意含量洗发水均有同等效果。
- **柠檬酸与 pH**：不再称洗发水必然调到头发等电点；pH、配方和发丝摩擦有关，但没有一个适用于所有产品与发质的统一理想值。
- **其他夸大措辞**：去掉聚季铵盐梳理阻力降低 85%、泛醇弹性增加 10%、甘油在低于 35% 湿度时必然反抽水分、氨端硅油永不堆积、角蛋白矫正后必须避开氯化钠等没有在本轮定位到可靠支持的断言。

## 本轮实际读取的文献

以下题名和摘要通过 NCBI E-utilities 读取；PMID 28538011 没有摘要，只核对到题名。链接存在并不意味着它支持某成分的所有叙述。

| PMID | 文献 | 本轮采用的支持范围 |
|---|---|---|
| [27775979](https://pubmed.ncbi.nlm.nih.gov/27775979/) | Alkyl Glucosides in Contact Dermatitis | 烷基葡糖苷，尤其癸基／月桂基葡糖苷的接触过敏资料。 |
| [28538011](https://pubmed.ncbi.nlm.nih.gov/28538011/) | Alkyl Glucosides: 2017 “Allergen of the Year” | 核对 2017 年度过敏原题名，未据此推断人群发生率。 |
| [19134437](https://pubmed.ncbi.nlm.nih.gov/19134437/) | Eyelid dermatitis: contact allergy to 3-(dimethylamino)propylamine | DMAPA、CAPB 制造杂质与临床过敏的关系；不是全部同类成分的交叉反应证明。 |
| [22093346](https://pubmed.ncbi.nlm.nih.gov/22093346/) | Determination of trace impurities in cosmetic intermediates by ion mobility spectrometry | 硬脂酰胺丙基二甲胺生产样品的 DMAPA 残留检测；不是过敏发生率试验。 |
| [26096789](https://pubmed.ncbi.nlm.nih.gov/26096789/) | Eighteen cases of wheat allergy and wheat-dependent exercise-induced urticaria/anaphylaxis sensitized by hydrolyzed wheat protein in soap | 特定酸水解小麦蛋白 Glupearl 19S 相关的 18 例报告。 |
| [25842469](https://pubmed.ncbi.nlm.nih.gov/25842469/) | Rosemary oil vs minoxidil 2% for the treatment of androgenetic alopecia: a randomized comparative trial | 100 人、6 个月外用研究；比较头发计数，非洗发水试验。摘要未给出迷迭香油浓度，无显著组间差异不构成等效性证明。 |
| [25584150](https://pubmed.ncbi.nlm.nih.gov/25584150/) | Peppermint Oil Promotes Hair Growth without Toxic Signs | C57BL/6 小鼠使用 3% 薄荷油的实验；不是人体洗发水临床证据。 |
| [17214716](https://pubmed.ncbi.nlm.nih.gov/17214716/) | Effect of caffeine and testosterone on the proliferation of human hair follicles in vitro | 来自 14 名男性的离体毛囊培养；不证明成品洗发水生发效果。 |
| [28879195](https://pubmed.ncbi.nlm.nih.gov/28879195/) | A Review of the Use of Biotin for Hair Loss | 证据有限；病例多有潜在病理，不能用于证明外用洗发水功效。 |
| [33313047](https://pubmed.ncbi.nlm.nih.gov/33313047/) | Natural Hair Supplement: Friend or Foe? Saw Palmetto, a Systematic Review in Alopecia | 包含口服及部分外用研究；混合配方及总体证据强度限制了外推。 |
| [12451368](https://pubmed.ncbi.nlm.nih.gov/12451368/) | Treatment of dandruff with 5% tea tree oil shampoo | 126 人、4 周随机单盲研究，支持特定 5% 配方的研究描述。 |
| [12715094](https://pubmed.ncbi.nlm.nih.gov/12715094/) | Effect of mineral oil, sunflower oil, and coconut oil on prevention of hair damage | 发束及洗前／洗后用油中的蛋白流失研究，不能证明未知剂量洗发水同效。 |
| [25210332](https://pubmed.ncbi.nlm.nih.gov/25210332/) | The Shampoo pH can Affect the Hair: Myth or Reality? | 综述和 123 款洗发水调查，观察范围 pH 3.5–9.0；支持 pH 与发丝表面性质有关，不支持统一最优值。 |

## 审查报告中需要同时收敛的建议

1. 报告建议把 SLS 写成精确 CMC 与普遍刺激性排序。本轮没有补得足够精确的原始物性出处，因此只删除“极低 CMC”，不补一个未经核实的数字；刺激性仍取决于浓度、盐、复配与使用条件。
2. “通常 pH 4.5–5.5”不能作为所有洗发水的事实。报告建议的柠檬酸解释没有原样照搬为固定调节目标。
3. “迷迭香油与米诺地尔无显著差异”不能写为两者等效；对照的 2% 指米诺地尔，摘要没有给出迷迭香油百分比。
4. 锯叶棕系统综述包含部分外用研究，不能简化为完全没有外用证据；但也不能据此证明淋洗产品有效。
5. 不能用所谓 CGM 圈共识替代沉积／洗脱实验，也不能按单一硅油名称给出零堆积或必然堆积判断。
6. 安全评估不等于高等级功效证据；不采用把 SCCS／CIR 安全意见直接列为功效 A 级的通用评级。

## 尚未核实的来源

- 月桂酰甲基羟乙磺酸酯钠、聚季铵盐-47 和聚季铵盐-87 的原供应商／牌号归属没有可回溯引文；本轮供应商原始网页分别遇到 404 或 403，因此把来源标记为待核实，没有把报告给出的替代供应商直接标为已验证。
- 一批 CIR 泛称、无法定位的期刊／报告题名、BHT 意见编号和未经给出编号的原料商数据没有在本轮逐项建立完整书目；继续按待核实处理。
- 本轮没有验证所有原始成分中文名的国家目录拼写，也没有为全部基础成分角色新增独立文献。命名、别名、结构化匹配与快照同步属于主修复流程。

## 补丁数据约定

- 仅使用已有成分 ID 作为键，不覆盖 `id`、`cn` 或 `inci`。
- `func`／`synergy` 是可显示的成分资料，不包含修复过程口吻；修订理由保留在本记录。
- `refs[].verified: true` 仅表示本轮确实读到对应记录，适用范围由 `scope` 限定；它不是整条成分资料或成品功效已经验证的标记。
- `cautions` 供已知过敏史等独立提示使用，不把过敏史推断成当前筛选器的敏感属性。
- `best`／`avoid` 清空用于阻止 APG 继承不当人群推荐；其余受控适配规则由主修复流程人工维护。
