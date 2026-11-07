# 王漢宗顏楷體繁字体输入

`HanWangYanKai.ttf` 是用户提供的原始 `王漢宗顏楷體繁.ttf`，字体数据未经修改。版权记录为 Dr. Hann-Tzong Wang，2002–2004；原文件声明允许按 GPL 2 或更新版本再分发和修改。许可全文见 [GPL-2.0-Wang-Han-Zong.txt](../public/fonts/GPL-2.0-Wang-Han-Zong.txt)。

原始文件 SHA-256：

```text
5567cc7ae20d11fd972a83daa0d364baba6867014a25a91b4aedcb0dbbdf1e55
```

网页使用 `public/fonts/wang-han-zong-yan-kai-subset.woff2`。本目录放在 `public/` 之外，便于保留字体原始输入，同时避免把完整 TTF 复制到网页生产目录。

## 构建网页子集

以下为从原始输入生成同一字符覆盖范围的子集方法。`hanwang-yan-kai-unicodes.txt` 记录当前 WOFF2 的 Unicode 字符集合；新增界面文字时可扩充该文件。工具版本和字体表处理选项可能影响生成文件的二进制哈希。

在仓库根目录执行：

```sh
python -m pip install "fonttools[woff]==4.57.0"
python -m fontTools.subset font-sources/HanWangYanKai.ttf --unicodes-file=font-sources/hanwang-yan-kai-unicodes.txt --flavor=woff2 --output-file=public/fonts/wang-han-zong-yan-kai-subset.woff2 --name-IDs="*" --name-languages="*" --name-legacy --layout-features="*"
```

这份繁体字库缺少的简体字继续由霞鹜文楷屏幕版补齐，不做繁简映射。其他两款字体的来源和许可见 [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md)。
