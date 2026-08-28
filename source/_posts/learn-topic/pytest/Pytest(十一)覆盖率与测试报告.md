---
title: Pytest(十一)覆盖率与测试报告
tags:
  - Pytest
  - 覆盖率
  - 测试报告
categories:
  - Learn Topic
  - Pytest
description: 能把测试结果、覆盖率和诊断附件组织成可追溯且不泄密的质量证据
cover: /img/picgo-images/pytest-course-cover.png
series: Pytest
series_order: 11
published: true
abbrlink: 51d93cec
date: 2026-04-29 00:00:00
---

{% course_series %}

{% note primary flat %}
本节要解决的是“测试结果如何被 CI、开发者和审计者分别消费”。从终端结果出发，生成 JUnit XML、语句/分支覆盖率和 Allure 结果，比较它们的证据边界，再故意把敏感参数放进附件并修复。覆盖率是结构指标，不是正确性证明；报告是产物，不是秘密保险箱。
{% endnote %}

## 证据模型

{% note info flat %}
一份可交付测试证据至少包含结果、范围、环境和可追溯标识：Node ID、退出码、收集数量、失败回溯、覆盖率版本和报告产物。终端输出适合即时诊断，JUnit XML 适合 CI 测试结果，覆盖率适合代码路径缺口，Allure 适合带步骤和附件的人工分析。
{% endnote %}

{% mermaid %}
flowchart TD
  A[测试输入与环境] --> B[Pytest 结果]
  B --> C[JUnit XML]
  B --> D[覆盖率数据]
  B --> E[Allure 结果]
  C --> F[CI 汇总]
  D --> F
  E --> G[人工诊断]
  F --> H[门禁与复现]
  G --> H
{% endmermaid %}

| 证据 | 主要消费者 | 能回答 | 不能回答 |
| --- | --- | --- | --- |
| 终端 | 开发者 | 哪个 Node 现在失败 | 长期趋势 |
| JUnit XML | CI 平台 | 哪些套件通过、失败、跳过 | 代码未覆盖原因 |
| 覆盖率 | 维护者 | 哪些语句/分支没有执行 | 断言是否正确 |
| Allure | 人工诊断 | 步骤、标签、附件和历史 | 附件内容天然安全 |

## JUnit XML

{% note success flat %}
使用 Pytest 内置的 junitxml 生成机器可读结果，并把它当作测试结果交换格式。报告路径、suite 名称和属性字段要保持稳定；不要把完整请求体、令牌或本机路径作为属性写入 XML。
{% endnote %}

```bash
python -m pytest tests/unit --junitxml=artifacts/junit.xml
```

{% note info flat %}
测试可以用 record_property 写入小而稳定的属性，用 record_testsuite_property 写入套件级信息；属性应是版本、区域或业务场景等非敏感元数据。CI 消费 XML 前先检查文件是否存在、解析是否成功，以及失败节点是否包含 Node ID。
{% endnote %}

| 字段 | 用途 | 安全边界 |
| --- | --- | --- |
| testcase name | 定位测试实例 | 不嵌入用户输入全文 |
| classname | 组织套件 | 使用稳定模块名 |
| failure/error | 诊断失败 | 清理秘密和隐私 |
| properties | 机器筛选 | 只写低敏元数据 |
| timestamp/time | 趋势和慢测 | 不作为唯一复现依据 |

## 覆盖率门禁

{% note primary flat %}
覆盖率门禁必须同时看指标口径和未覆盖代码。语句覆盖率只说明行被执行，分支覆盖率才进一步检查条件路径；阈值是风险预算，不是质量分数。先看缺口报告，再决定是否新增测试或明确排除生成代码。
{% endnote %}

```bash
python -m pytest tests/unit --cov=src --cov-report=term-missing --cov-report=xml:artifacts/coverage.xml
python -m pytest tests/unit --cov=src --cov-branch --cov-fail-under=85
```

{% note info flat %}
xdist 下使用 pytest-cov 时要确认各 worker 的数据被合并；子进程启动的代码需要单独配置覆盖率启动方式。不要只在本地运行一条覆盖率命令就宣称 CI 门禁一致，固定插件版本、配置文件和命令行覆盖范围。
{% endnote %}

| 指标 | 适合发现 | 限制 |
| --- | --- | --- |
| statement | 未执行的语句 | 看不到条件另一分支 |
| branch | 未走到的条件边 | 仍不检查断言质量 |
| missing lines | 下一条测试线索 | 可能是故意不可达代码 |
| fail-under | 自动门禁 | 阈值本身不代表风险合理 |

## Allure 报告

{% note info flat %}
Allure 将 Pytest 结果写入结果目录，再由报告工具生成静态站点。步骤、标签、链接和附件可以帮助人工诊断；结果目录应视为构建产物，生命周期、访问权限和清理策略要与 JUnit/覆盖率分开管理。
{% endnote %}

![Allure 测试报告的套件、用例状态与步骤概览](/img/learn-topic/pytest/allure-report-overview.png "Allure 报告概览")

{% note info flat %}
报告界面适合快速定位失败步骤与历史趋势，但页面上的通过状态仍要回到原始 Node、退出码、环境和附件验证。示例报告中的业务名称仅用于演示，真实项目应先脱敏再上传。
{% endnote %}

```bash
python -m pytest tests/integration --alluredir=artifacts/allure-results
allure generate artifacts/allure-results --clean -o artifacts/allure-report
```

{% note info flat %}
动态元数据要从测试输入产生，避免把真实用户数据直接写入 title、attachment 或 step。附件优先使用经过裁剪和脱敏的响应摘要；若必须保存原始文件，放在受控存储并缩短保留时间。
{% endnote %}

## 报告安全

{% note danger flat %}
HIDDEN 或 MASKED 只影响 Allure 的展示，不会自动删除结果文件中的原始参数。任何写入 JUnit、Allure、日志或覆盖率上下文的字符串都必须先脱敏；真实令牌、Cookie、Authorization 头和用户隐私不应进入测试产物。
{% endnote %}

```python
from allure_commons.types import AttachmentType
import allure


def attach_safe_summary(order_id: str, status: str) -> None:
    allure.attach(
        f"order={order_id}; status={status}",
        name="order-summary",
        attachment_type=AttachmentType.TEXT,
    )
```

{% note info flat %}
上例只附加低敏摘要。若测试失败信息来自异常对象，先建立安全格式化函数，删除请求头、令牌、邮箱和完整响应体，再传给报告插件。产物上传前可以扫描关键词，但扫描不能替代源头约束。
{% endnote %}

{% folding open red, 产物清理清单 %}
1. 固定 artifacts 目录并在每次构建前清理旧结果。
2. 检查 JUnit 属性、Allure 附件和终端重定向是否含秘密。
3. 给报告设置最小访问权限与保留期限。
4. 失败时保留 Node ID、退出码和脱敏回溯，删除原始请求内容。
{% endfolding %}

## 质量判断

{% note success flat %}
交付判断按证据链而不是单一数字：收集数量正确、关键测试通过、失败退出码正确、覆盖率口径明确、报告可解析、产物无敏感信息，并且命令可在相同版本和配置下复现。趋势下降是调查信号，不应自动放宽门禁。
{% endnote %}

| 检查 | 通过条件 | 失败后动作 |
| --- | --- | --- |
| 结果 | 目标 Node 和退出码符合预期 | 回到断言/Fixture |
| JUnit | XML 可解析且套件完整 | 检查路径和报告插件 |
| 覆盖率 | 指标与范围明确、缺口已解释 | 补测试或记录排除 |
| Allure | 结果可生成、步骤可读 | 清理附件和元数据 |
| 安全 | 无令牌和隐私泄露 | 立即撤销/清理并修复采集点 |

## 常见问题

{% flashcard basic id:pytest-coverage-not-correctness deck:"Pytest" priority:1 tags:"质量证据" %}
--- question
覆盖率高为什么不等于测试正确？
--- answer
覆盖率只说明代码路径被执行，不说明断言是否有效、输入是否代表真实边界或结果是否正确。
--- explanation
覆盖率记录的是执行路径，不是断言质量。下面两条测试都可能增加语句覆盖率，但第一条没有证明结果：

```python
def test_runs():
    calculate_discount(100)  # 执行了代码，却没有观察结果


def test_boundary():
    assert calculate_discount(100) == 90  # 才形成行为证据
```

分支覆盖率也不能证明外部协议、数据质量或错误消息符合业务契约。应把覆盖率当作查找未触达路径的导航，再和边界断言、集成测试、失败回溯及业务验收一起判断质量。
{% endflashcard %}

{% flashcard basic id:pytest-junit-vs-allure deck:"Pytest" priority:2 tags:"报告格式" %}
--- question
JUnit XML 与 Allure 分别服务什么消费者？
--- answer
JUnit XML 是 CI 读取的机器结果交换格式；Allure 是面向人工诊断的步骤、标签和附件报告。
--- explanation
两者的消费路径不同，产物也不应互相替代：

| 产物 | 主要消费者 | 关注点 |
| --- | --- | --- |
| JUnit XML | CI、测试平台 | 稳定字段、状态、耗时、退出结果 |
| Allure 结果 | 开发者和诊断者 | 步骤、标签、附件、可视化关联 |

JUnit 的机器可读不代表安全，Allure 的漂亮页面也不代表完整。上传前仍要检查 XML、结果目录、附件权限和保留策略，并为两种产物分别保留失败时的文字兜底。
{% endflashcard %}

{% flashcard basic id:pytest-allure-hidden-secret deck:"Pytest" priority:1 tags:"报告安全" %}
--- question
Allure 的 HIDDEN/MASKED 参数为什么仍可能泄密？
--- answer
它们可能只改变页面展示，原始值仍保存在结果文件、附件或日志中。
--- explanation
展示层的隐藏不等于删除原始数据。敏感值可能同时出现在参数、步骤上下文、附件、JUnit 属性和终端日志中，因此脱敏应发生在采集点：

```python
def safe_headers(headers: dict[str, str]) -> dict[str, str]:
    return {
        key: ("***" if key.lower() in {"authorization", "cookie"} else value)
        for key, value in headers.items()
    }
```

上传前搜索所有报告目录和日志，确认没有原始令牌、完整请求体或个人数据；`HIDDEN`/`MASKED` 只能改变展示，不能替代撤销已泄露凭据和收紧访问权限。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link JUnit XML, https://docs.pytest.org/en/stable/how-to/usage.html#creating-junitxml-format-files, https://docs.pytest.org/en/stable/_static/favicon.png %}
{% link pytest-cov, https://pytest-cov.readthedocs.io/en/latest/, https://pytest-cov.readthedocs.io/favicon.ico %}
{% link Allure pytest, https://allurereport.org/docs/pytest/, https://allurereport.org/favicon.ico %}
{% endlinkgroup %}
