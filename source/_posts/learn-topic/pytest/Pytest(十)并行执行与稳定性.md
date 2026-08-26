---
title: Pytest(十)并行执行与稳定性
tags:
  - Pytest
  - pytest-xdist
  - 稳定性
categories:
  - Learn Topic
  - Pytest
description: 能选择 xdist 调度策略，隔离多进程资源并诊断 flaky 与有限重试
cover: /img/picgo-images/pytest-course-cover.png
series: Pytest
series_order: 10
published: false
abbrlink: 5497f9c8
date: 2026-08-26 09:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

{% note primary flat %}
本节要解决的是“测试在多个进程中仍能给出可重复证据”。先观察 controller 与 worker 的边界，再比较 load、loadscope、loadfile、loadgroup 和 worksteal 的调度粒度，随后为文件、端口和 session Fixture 建立 worker 隔离，最后把 flaky 诊断与有限重试分开。重跑通过不是稳定性证明。
{% endnote %}

## 进程模型

{% note info flat %}
pytest-xdist 由 controller 分发节点，worker 独立收集、执行并回传结果。每个 worker 都是独立 Python 进程，有自己的 session Fixture、缓存和环境；session 不等于整个命令只建立一次。
{% endnote %}

{% mermaid %}
flowchart TD
  A[Controller 收集与调度] --> B[Worker gw0 收集并执行]
  A --> C[Worker gw1 收集并执行]
  B --> D[结果与日志回传]
  C --> D
  D --> E[汇总退出码与报告]
{% endmermaid %}

```bash
python -m pytest -n 2 --dist=load
python -m pytest -n auto --collect-only -q
```

{% note info flat %}
第一次并行运行先保留 -vv 和 worker 标识，确认每个 Node 只被一个 worker 执行。若收集树在不同 worker 不一致，先修复导入、动态参数或环境差异，再讨论调度策略。
{% endnote %}

## 调度策略

{% note success flat %}
调度策略选择的是“节点如何分组和分发”，不是业务顺序。load 追求均衡，loadscope 尽量把同一类/模块放在一起，loadfile 按文件聚合，loadgroup 根据 xdist_group 标记聚合，worksteal 在 worker 空闲时窃取剩余工作。
{% endnote %}

| 模式 | 分组粒度 | 适用情况 | 代价 |
| --- | --- | --- | --- |
| load | 单个测试节点 | 测试耗时差异大 | 共享资源更难分组 |
| loadscope | 类或模块 | 同一 scope 共享资源 | 长模块可能成为慢点 |
| loadfile | 文件 | 文件级状态或缓存 | 文件之间负载可能不均 |
| loadgroup | 显式组标记 | 需要把相关节点放一起 | 标记错误会降低并行度 |
| worksteal | 动态窃取 | 长短任务混合 | 调度证据更复杂 |

```python
import pytest


@pytest.mark.xdist_group("payment")
def test_payment_timeout():
    assert True
```

{% note info flat %}
分组只解决调度，不会让共享文件自动安全；仍要用独立命名空间或锁保护外部资源。
{% endnote %}

## 资源隔离

{% note warning flat %}
worker 是进程边界。文件名、端口、数据库 schema 和外部队列如果仍使用固定值，就算 Fixture 是 session 作用域也会互相覆盖。优先使用 worker_id、tmp_path、随机但可记录的端口分配和显式清理。
{% endnote %}

```python
import pytest


@pytest.fixture
def worker_dir(tmp_path, worker_id):
    path = tmp_path / worker_id
    path.mkdir()
    return path


def test_worker_file(worker_dir):
    target = worker_dir / "result.txt"
    target.write_text("ok")
    assert target.read_text() == "ok"
```

{% note info flat %}
worker_id 由 xdist 提供；没有安装 xdist 时可以在兼容 Fixture 中返回 master。对于数据库和服务，命名空间应进入连接字符串或资源键，不能只写在日志里。跨进程共享的迁移或锁要有超时，超时后报告根因而不是无限等待。
{% endnote %}

## 确定性设计

{% note primary flat %}
并行稳定性的第一原则是测试顺序独立。每个测试都建立自己的输入和清理；随机数、当前时间和外部响应要使用冻结种子、可控时钟或固定 Fake；环境变量和缓存必须在测试结束后恢复。
{% endnote %}

| 不确定性 | 证据 | 设计方式 |
| --- | --- | --- |
| 共享文件 | worker 互相覆盖 | tmp_path/worker_id/锁 |
| 随机数据 | 失败无法复现 | 固定 seed 并记录参数 |
| 当前时间 | 跨午夜结果不同 | 注入时钟或冻结时间 |
| 外部列表 | 收集数量变化 | 快照、版本或 Fake |
| 测试顺序 | 单独通过、整套失败 | 去掉隐式前置，清理状态 |

```bash
python -m pytest -n 2 --randomly-seed=123
python -m pytest -n 2 -q --maxfail=1
```

{% note info flat %}
如果使用随机化插件，固定 seed 只是诊断工具；修复仍应移除顺序依赖。将 seed、worker、Node ID 和外部版本写入安全报告，避免把用户数据混进日志。
{% endnote %}

## flaky 诊断

{% note info flat %}
flaky 是同一输入和环境下结果不稳定，不是“偶尔红一次”就可以重试的标签。先保存第一次失败的 Node ID、worker、seed、时间和回溯，再重复测量并区分竞态、资源抖动、网络、时间和未清理状态。
{% endnote %}

```bash
python -m pytest tests/integration/test_payment.py -n 2 -vv --maxfail=1
```

{% note info flat %}
重复运行应改变测量次数而不改变业务输入。若第一次失败只在某 worker 出现，优先检查资源命名和 Fixture scope；若同一 Node 在串行也失败，问题可能是确定性缺陷，不要用 rerun 隐藏它。
{% endnote %}

## 重试边界

{% note danger flat %}
重试只能降低瞬时环境抖动，不能修复竞态、错误断言或资源泄漏。使用 pytest-rerunfailures 时限制次数和延迟，保留每次尝试的日志，并让最终退出码仍反映失败。
{% endnote %}

```bash
python -m pytest tests/integration -n 2 --reruns 2 --reruns-delay 1
```

{% note info flat %}
把重试当成观测信号：报告中同时记录首次失败和最终结果。对支付、写入和消息发送等非幂等动作，优先修复测试隔离或使用可回滚 Fake，而不是重复真实副作用。
{% endnote %}

## 常见问题

{% flashcard basic id:pytest-xdist-session-fixture deck:"Pytest" priority:1 tags:"并行 Fixture" %}
--- question
为什么 session Fixture 在 xdist 下仍可能执行多次？
--- answer
session 作用域只覆盖一个 worker 进程；多个 worker 各自建立自己的 session 实例。
--- explanation
controller 不共享 Python 对象。需要全局只执行一次的资源必须放到外部可协调系统，或在 Fixture 中使用锁和可验证的幂等初始化；普通测试资源应接受每个 worker 一份。
{% endflashcard %}

{% flashcard basic id:pytest-xdist-dist-modes deck:"Pytest" priority:2 tags:"调度" %}
--- question
xdist 的调度模式按什么粒度分组？
--- answer
load 按节点均衡，loadscope/loadfile 按类模块或文件聚合，loadgroup 按显式组标记，worksteal 在 worker 空闲时动态窃取。
--- explanation
先按共享资源边界选择分组，再用耗时分布判断是否值得牺牲均衡。调度不会自动解决固定文件、端口或数据库键的冲突，资源命名仍由测试设计负责。
{% endflashcard %}

{% flashcard basic id:pytest-flaky-rerun deck:"Pytest" priority:1 tags:"稳定性" %}
--- question
为什么重跑通过不能证明 flaky 已修复？
--- answer
重跑只改变尝试次数，可能掩盖竞态、资源污染或错误断言；必须保存首次失败证据并重复测量根因。
--- explanation
稳定性判断需要固定输入、记录 worker/seed/环境、观察串行与并行差异，并让最终退出码反映真实失败。有限 rerun 只适合有明确边界的瞬时抖动，不能作为质量门禁替代品。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link xdist documentation, https://pytest-xdist.readthedocs.io/en/stable/, https://pytest-xdist.readthedocs.io/en/stable/_static/favicon.png %}
{% link xdist how-to, https://pytest-xdist.readthedocs.io/en/stable/how-to.html, https://pytest-xdist.readthedocs.io/en/stable/_static/favicon.png %}
{% link flaky tests, https://docs.pytest.org/en/stable/explanation/flaky.html, https://docs.pytest.org/en/stable/_static/favicon.png %}
{% endlinkgroup %}
