# 成分名称与别名核查

核查日期：2026-11-09。范围：原始 152 条记录的名称、现有 skill 别名及审查报告第 4 节；本记录不评估这些成分的安全性或功效。

## 主要依据

- [Commission Implementing Decision (EU) 2025/1175](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32025D1175)，Annex：用于化妆品标签的通用成分名称词汇表。
- 该决定第 4 条规定从 **2026-07-30** 起适用。它替代的 [2022/677](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022D0677) 已于 2026-07-29 终止效力，因此本次以新表为核对依据。
- 该词汇表的名称并非使用许可清单，收录名称也不代表获准用于普通化妆品；例如本次新表中可以查到 KETOCONAZOLE，不能据此推导酮康唑是普通化妆品成分。
- 词汇表的植物名经常省略英文俗名括号。`Simmondsia Chinensis Seed Oil` 与同物种、同部位的 `Simmondsia Chinensis (Jojoba) Seed Oil` 作为名称及精确标签别名并存；不把所有不含 Seed 的名称概括为任意种子油。

## 实测报告中的漏识别说法

在修改前的 `lookup()` 上实测：

| 输入 | 实际原状态 |
| --- | --- |
| `Simmondsia Chinensis (Jojoba) Seed Oil` | unlisted，无候选 |
| `Rosmarinus Officinalis (Rosemary) Leaf Oil` | unlisted，无候选 |
| `Centella Asiatica Extract` | **matched**；规范化后的 `centella-asiatica-extract` id 本来就能命中，因此报告此项判断不成立 |
| `Serenoa Serrulata Fruit Extract` | unlisted，无候选 |
| `互生叶白千层(MELALEUCA ALTERNIFOLIA)叶油` | unlisted |
| `积雪草(CENTELLA ASIATICA)提取物` | unlisted |
| `蓝桉(EUCALYPTUS GLOBULUS)叶油` | unlisted |
| `白柳(SALIX ALBA)树皮提取物` | unlisted |
| `辣薄荷(MENTHA PIPERITA)油` | unlisted |
| `瓜儿胶羟丙基三甲基氯化铵` | unlisted，有旧「瓜尔胶」条目候选，尚不是精确命中 |
| `PEG/PPG-17/18 Dimethicone` | unlisted；不得自动当作 PEG-12 Dimethicone |
| `PEG-12 Dimethicone` / `Dimethicone Copolyol` | 分别 matched 到两个不同条目 |

## 本次名称修正

INCI 栏去除明确的缩写或维生素说明后缀，植物条目采用已在当前欧盟词汇表找到的名称。旧完整中文名、旧英文名与已有别名保留。下表的编号是该词汇表的名称编号，不是 CAS、证据等级或法规限用编号。

| id | 原英文显示 | 规范化名称 | 词汇表编号 |
| --- | --- | --- | --- |
| `sodium-laureth-sulfate` | Sodium Laureth Sulfate (SLES) | Sodium Laureth Sulfate | 26714 |
| `sodium-lauryl-sulfate` | Sodium Lauryl Sulfate (SLS) | Sodium Lauryl Sulfate | 26768 |
| `ammonium-laureth-sulfate` | Ammonium Laureth Sulfate (ALES) | Ammonium Laureth Sulfate | 1795 |
| `ammonium-lauryl-sulfate` | Ammonium Lauryl Sulfate (ALS) | Ammonium Lauryl Sulfate | 1803 |
| `cocamidopropyl-betaine` | Cocamidopropyl Betaine (CAPB) | Cocamidopropyl Betaine | 7071 |
| `sodium-cocoyl-isethionate` | Sodium Cocoyl Isethionate (SCI) | Sodium Cocoyl Isethionate | 26538 |
| `sodium-lauroyl-methyl-isethionate` | Sodium Lauroyl Methyl Isethionate (SLMI) | Sodium Lauroyl Methyl Isethionate | 26751 |
| `lauramidopropyl-betaine` | Lauramidopropyl Betaine (LAPB) | Lauramidopropyl Betaine | 14913 |
| `sodium-methyl-cocoyl-taurate` | Sodium Methyl Cocoyl Taurate (SMCT) | Sodium Methyl Cocoyl Taurate | 26803 |
| `cyclopentasiloxane` | Cyclopentasiloxane (D5) | Cyclopentasiloxane | 7871 |
| `cyclohexasiloxane` | Cyclohexasiloxane (D6) | Cyclohexasiloxane | 7853 |
| `behentrimonium-methosulfate` | Behentrimonium Methosulfate (BTMS) | Behentrimonium Methosulfate | 3162 |
| `panthenol` | Panthenol (Pro-Vitamin B5) | Panthenol | 19012 |
| `piroctone-olamine` | Piroctone Olamine (OCT) | Piroctone Olamine | 21249 |
| `zinc-pyrithione` | Zinc Pyrithione (ZPT) | Zinc Pyrithione | 30346 |
| `tea-tree-oil` | Melaleuca Alternifolia (Tea Tree) Oil | Melaleuca Alternifolia Leaf Oil | 16116 |
| `peppermint-oil` | Peppermint (Mentha Piperita) Oil | Mentha Piperita Oil | 16219 |
| `copper-tripeptide-1` | Copper Tripeptide-1 (GHK-Cu) | Copper Tripeptide-1 | 7399 |
| `centella-asiatica-extract` | Centella Asiatica (Cica) Extract | Centella Asiatica Extract | 5725 |
| `saw-palmetto-extract` | Saw Palmetto Fruit Extract | Serenoa Serrulata Fruit Extract | 25611 |
| `salix-alba-bark-extract` | Salix Alba (Willow) Bark Extract | Salix Alba Bark Extract | 25098 |
| `methylchloroisothiazolinone` | Methylchloroisothiazolinone (CMIT) | Methylchloroisothiazolinone | 16610 |
| `methylisothiazolinone` | Methylisothiazolinone (MIT) | Methylisothiazolinone | 16644 |
| `dehydroacetic-acid` | Dehydroacetic Acid (DHA) | Dehydroacetic Acid | 8294 |
| `tocopherol` | Tocopherol (Vitamin E) | Tocopherol | 28929 |
| `bht` | BHT (Butylated Hydroxytoluene) | BHT | 3371 |
| `ascorbic-acid` | Ascorbic Acid (Vitamin C) | Ascorbic Acid | 2414 |
| `gluconolactone` | Gluconolactone (PHA) | Gluconolactone | 11012 |
| `hydroxyethylcellulose` | Hydroxyethylcellulose (HEC) | Hydroxyethylcellulose | 13278 |
| `argan-oil` | Argania Spinosa (Argan) Oil | Argania Spinosa Kernel Oil | 2221 |
| `jojoba-oil` | Simmondsia Chinensis (Jojoba) Oil | Simmondsia Chinensis Seed Oil | 26176 |
| `coconut-oil` | Cocos Nucifera (Coconut) Oil | Cocos Nucifera Oil | 7174 |

## 精确别名与未采纳的建议

- 为报告涉及的植物条目补齐已知的中文「名称（拉丁物种）部位」完整标签形式；英文俗名括号仅在同物种、同部位且与当前条目对象一致时作为显式别名。
- 「瓜儿胶」作为「瓜尔胶」拼写差异的显式别名。SLS/ALS 的带「酯」中文名称沿用已有别名记录。未取得中国《已使用化妆品原料目录》原始附件全文，因此**不宣称已经将全部中文名校正为中国法定目录名**；本次中文显示修改只移除空格分隔的说明性后缀。
- 不实施“任意删除中文内部拉丁名”。例如 `蓝桉(MENTHA PIPERITA)叶油` 的物种与中文名冲突，应保留为不确定输入，不能靠去括号制造精确命中。
- 当前 2025/1175 词汇表仍收录 `ROSMARINUS OFFICINALIS LEAF OIL`，未找到 `SALVIA ROSMARINUS LEAF OIL`；本次不自动加后者为已核实别名。植物学同物异名与具体 INCI 标签名称的接受情况需要分别核实。
- `Dimethicone Copolyol` 是旧式泛类称呼，不能等同于某一个 PEG/PPG 编号的具体硅油。保留原泛类记录，**不合并**到 PEG-12；未知 PEG/PPG 编号仍不能精确识别。
- `APG`、`BHA`、`PHA` 是类别称呼；`DHA` 也可能指 Dihydroxyacetone，`Vitamin E` 涉及多种形式。本次不新增这些字符串作为单一条目的唯一精确缩写。旧完整显示名称仍可保留供回溯。
- 既有 `茶树精油` 条目在原别名中已指定“互生叶白千层叶油”，故采用 Leaf Oil 作为其规范标签对象；不据此把 Flower/Leaf/Stem Oil 或提取物并入。`Mentha Piperita Oil` 不与 Flower/Leaf Oil 或任意植物部位的油自动合并。

JSON 补丁位于 `data-review/name-corrections.json`。每项 verified reference 的 scope 仅支持英文名称核对；中文目录、成分功效或安全性不因该 reference 被视为已验证。
