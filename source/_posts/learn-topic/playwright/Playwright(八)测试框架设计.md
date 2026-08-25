---
title: Playwright(八)测试框架设计
tags:
  - Playwright
  - pytest
  - Fixture
  - PageObject
  - 数据驱动
categories:
  - Learn Topic
  - Playwright
description: 从测试职责出发设计 pytest-playwright 套件，系统掌握目录分层、参数化、JSON与YAML数据驱动、Fixture 生命周期、Page Object 和组件对象的边界。
cover: /img/picgo-images/playwright-course-cover.png
series: Playwright
series_order: 8
published: true
abbrlink: c92e7868
date: 2026-08-24 12:05:00
---

{% course_series %}

{% note info no-icon modern %}
当测试从 5 条增长到 100 条，真正的风险不是代码行数，而是数据、生命周期和职责互相缠绕。本篇用“订单折扣”案例组织参数化、外部数据、fixture 分层和 Page Object。
{% endnote %}

## 框架分层

一个可维护的 UI 测试框架至少区分五种职责：

{% mermaid %}
flowchart TD
    T[tests 场景与业务断言] --> P[pages 页面与组件操作]
    T --> F[fixtures 资源生命周期]
    F --> A[api 数据准备与清理]
    T --> D[data 非敏感测试数据]
    P --> PW[Playwright Page 与 Locator]
{% endmermaid %}

建议结构以职责命名，不以工具名堆目录：

```text
tests/
├── conftest.py
├── data/
│   └── discounts.json
├── pages/
│   ├── checkout_page.py
│   └── components/
│       └── cart_panel.py
├── api/
│   └── orders_client.py
├── e2e/
│   └── test_checkout.py
└── integration/
    └── test_order_api.py
```

- `tests/` 说明业务场景并保留关键断言；
- `pages/` 封装稳定页面语言，不管理测试数据；
- `fixtures` 创建和释放资源；
- `api/` 封装服务接口，供 Fixture 或测试核验使用；
- `data/` 只保存可公开、可审查的输入和期望。

{% note info flat %}
小套件不必预先创建所有目录。先从直接测试开始，出现真实重复和职责边界后再提取对应层。
{% endnote %}

## 数据驱动

pytest 参数化适合“步骤相同、输入与期望不同”的场景：

```python
import pytest
from playwright.sync_api import Page, expect


@pytest.mark.parametrize(
    ("level", "subtotal", "expected"),
    [
        pytest.param("normal", 100, "100.00", id="normal-no-discount"),
        pytest.param("vip", 100, "90.00", id="vip-10-percent"),
        pytest.param("vip", 0, "0.00", id="zero-boundary"),
    ],
)
def test_total(page: Page, level: str, subtotal: int, expected: str) -> None:
    page.set_content("""
      <label>等级 <select><option>normal</option><option>vip</option></select></label>
      <label>小计 <input type='number'></label><output id='total'></output>
      <script>
        const total = document.querySelector('#total');
        const render = () => total.textContent =
          (Number(document.querySelector('input').value || 0) *
           (document.querySelector('select').value === 'vip' ? .9 : 1)).toFixed(2);
        document.querySelectorAll('input,select').forEach(x => x.oninput = render);
      </script>
    """)
    page.get_by_label("等级").select_option(level)
    page.get_by_label("小计").fill(str(subtotal))
    expect(page.locator("output")).to_have_text(expected)
```

{% note info flat %}
运行后 pytest 应收集三个带可读 ID 的 case，并得到 `3 passed`。若把 VIP 的期望故意改成 `100.00`，失败报告应指向 `vip-10-percent`，这正是 case ID 的价值。
{% endnote %}

{% note info flat %}
数据量大或由业务人员维护时可以外部化。文章只展示代码块，不向博客仓库增加数据文件。
{% endnote %}

{% note info flat %}
简单、机器生成或只由测试代码维护的数据优先使用 JSON；只有当数据层级较深、需要频繁人工编辑，并且团队愿意承担额外依赖时再选择 YAML。
{% endnote %}

{% tip key %}
两种格式都不能保存账号密码等敏感值。数据文件只放可公开输入，敏感值通过 CI secret 或测试环境的安全注入方式提供。
{% endtip %}

{% tabs 数据格式, 1 %}

<!-- tab JSON -->

```json
[
  { "id": "normal", "level": "normal", "subtotal": 100, "expected": "100.00" },
  { "id": "vip", "level": "vip", "subtotal": 100, "expected": "90.00" }
]
```

```python
import json
from pathlib import Path

CASES = json.loads(Path("tests/data/discounts.json").read_text(encoding="utf-8"))

@pytest.mark.parametrize("case", CASES, ids=lambda case: case["id"])
def test_discount(case, page):
    ...
```

<!-- endtab -->

<!-- tab YAML（可选） -->

```yaml
- id: normal
  level: normal
  subtotal: 100
  expected: "100.00"
```

```python
from pathlib import Path

import yaml

CASES = yaml.safe_load(Path("tests/data/discounts.yaml").read_text(encoding="utf-8"))
```

YAML 需要额外依赖 `PyYAML`，并应使用 `safe_load()`。

<!-- endtab -->

{% endtabs %}

## Fixture 设计

{% mermaid %}
flowchart TD
S[session: 服务与 Browser] --> M[module: 共享只读目录]
S --> F[function: Context/Page/订单数据]
F --> T[Test]
T --> C[finally/yield 后清理]
{% endmermaid %}

{% note info flat %}
作用域越大，速度可能越快，但污染半径也越大。浏览器进程适合 session；Context、Page 和可变业务数据通常保持 function。
{% endnote %}

```python
# conftest.py
from collections.abc import Iterator
from dataclasses import dataclass, field
from uuid import uuid4
import pytest


@dataclass
class OrderStore:
    orders: dict[str, dict] = field(default_factory=dict)

    def create(self, order_id: str, total: int) -> dict:
        order = {"id": order_id, "total": total, "status": "draft"}
        self.orders[order_id] = order
        return order

    def delete(self, order_id: str) -> None:
        self.orders.pop(order_id, None)


@pytest.fixture
def order_store() -> Iterator[OrderStore]:
    store = OrderStore()
    yield store
    assert store.orders == {}, "每条测试结束后都应回收订单"


@pytest.fixture
def order_id() -> str:
    return f"e2e-{uuid4().hex}"


@pytest.fixture
def order(order_store: OrderStore, order_id: str) -> Iterator[dict]:
    created = order_store.create(order_id=order_id, total=99)
    try:
        yield created
    finally:
        order_store.delete(order_id)
```

{% note info flat %}
这段内存 store 只用于讲 Fixture 所有权，不依赖第九篇 API。即使测试中的断言故意失败，`yield` 之后的删除和 `order_store` 的空状态检查仍会执行。
{% endnote %}

{% note info flat %}
fixture 应返回“测试需要的能力”，而不是把所有动作藏起来。创建和清理放 fixture，测试的关键业务动作与断言留在测试函数中。`conftest.py` 分层规则：根目录放全套件基础设施，子目录只放该领域覆盖或 fixture，避免一个千行全局文件。
{% endnote %}

## POM 设计

{% note info flat %}
官方 Page Object 的核心是用更高层业务 API 包装 Page 并集中 Locator。它不是“每个页面必须一个类”，更不是断言垃圾桶。
{% endnote %}

```python
from playwright.sync_api import Page, expect


class CheckoutPage:
    def __init__(self, page: Page) -> None:
        self.page = page
        self.receiver = page.get_by_label("收件人")
        self.submit = page.get_by_role("button", name="提交订单")
        self.status = page.get_by_role("status")

    def open(self) -> None:
        self.page.set_content("""
          <label>收件人 <input></label>
          <button>提交订单</button><p role='status'>草稿</p>
          <script>
            document.querySelector('button').onclick = () => {
              document.querySelector('[role=status]').textContent = '订单已创建';
            };
          </script>
        """)

    def submit_order(self, receiver: str) -> None:
        self.receiver.fill(receiver)
        self.submit.click()


def test_checkout(page):
    checkout = CheckoutPage(page)
    checkout.open()
    checkout.submit_order("小林")
    expect(checkout.status).to_have_text("订单已创建")
```

{% note info flat %}
保持业务断言在测试中，失败报告会明确表达测试意图。组件跨多个页面复用时使用 Component Object；只出现一次的两行 Locator 不必急着抽象。
{% endnote %}

### 组件对象

购物车抽屉在多个页面复用时，可以独立于具体页面：

```python
from playwright.sync_api import Locator, Page


class CartPanel:
    def __init__(self, page: Page) -> None:
        self.root = page.get_by_role("region", name="购物车")

    def item(self, name: str) -> Locator:
        return self.root.get_by_role("listitem").filter(has_text=name)

    def checkout(self) -> None:
        self.root.get_by_role("button", name="结算").click()


class ShopPage:
    def __init__(self, page: Page) -> None:
        self.page = page
        self.cart = CartPanel(page)

    def add_product(self, name: str) -> None:
        product = self.page.get_by_role("listitem").filter(has_text=name)
        product.get_by_role("button", name="加入购物车").click()
```

{% note info flat %}
组合比建立庞大的 `BasePage` 继承树更容易控制职责。组件对象只接收它需要的 Page 或根 Locator，不应知道账号、数据库连接和 CI 配置。
{% endnote %}

### Fixture 注入

{% tip warning %}
Page Object 可以由 Function 级 Fixture 构造，但不应扩大 Page 生命周期：
{% endtip %}

```python
import pytest
from playwright.sync_api import Page


@pytest.fixture
def checkout_page(page: Page) -> CheckoutPage:
    return CheckoutPage(page)


def test_checkout(checkout_page: CheckoutPage) -> None:
    checkout_page.open()
    checkout_page.submit_order("小林")
    expect(checkout_page.status).to_have_text("订单已创建")
```

{% note info flat %}
Fixture 负责对象装配，Page Object 负责页面语言，测试仍然负责说明为何操作以及期望什么。
{% endnote %}

| 反模式                        | 为什么会塌           | 调整                       |
| ----------------------------- | -------------------- | -------------------------- |
| `BasePage` 包含几十个通用动作 | 子类继承了不相关能力 | 组合小对象                 |
| Page Object 内吞掉所有断言    | 测试看不出业务目标   | 只保留稳定的页面不变量     |
| fixture 完成整个业务流        | 测试变成空壳         | fixture 管资源，测试做行为 |
| 参数化矩阵笛卡尔积            | 数量暴涨且含义模糊   | 按风险选择代表边界         |

## 设计检查

{% note info flat %}
为“创建订单 → UI 提交 → API 清理”标注：哪些属于参数数据、哪些属于 Fixture、哪些属于 Page Object、哪些必须留在测试断言。若一个动作同时出现在两层，先解释它的唯一所有者。
{% endnote %}

{% hideToggle 参考划分, #f0f4ff, #1f2d3d %}
账号类型、商品和期望状态属于参数数据；资源创建与无条件清理属于 Fixture；打开页面、填写和点击属于 Page Object；“提交后状态正确”与最终业务后置条件留在测试中。API cleanup 在第九篇实现，这里只判断职责。
{% endhideToggle %}

## 接口边界

{% tip info %}
下面的索引用于查漏和选型；主线能力仍以本篇前文的机制、示例和失败边界为准。方法名和公开签名参数按 Playwright Python 1.62.0 的同步 API 归类，异步 API 的对应关系在第二篇统一说明；参数行是完整索引，不等于逐项教程。
{% endtip %}

{% folding cyan, 查看本文 API 索引 %}

| 对象 | 核心详解 | 正文简述 | 进阶路线 | 弃用迁移 |
| --- | --- | --- | --- | --- |
| pytest 资源 Fixture | `new_context` | `playwright`、`browser_type`、`browser`、`context`、`page`、`launch_browser` | — | — |
| pytest 信息 Fixture | — | `browser_name`、`browser_channel`、`device`、`is_chromium`、`is_firefox`、`is_webkit`、`output_path` | — | — |
| pytest 配置 Fixture | `browser_context_args` | `browser_type_launch_args`、`connect_options` | — | — |

{% endfolding %}

## 常见问题

{% flashcard basic id:playwright-pom-boundary deck:"Playwright" priority:2 tags:"POM,测试框架" %}
--- question
Page Object 最重要的职责边界是什么？
--- answer
封装稳定页面语言，不接管测试数据和全部业务断言。
--- explanation
Page Object 集中 Locator 与用户操作；Fixture 管资源，API Client 管服务调用，测试保留关键业务目标和断言，失败报告才容易理解。
{% endflashcard %}

{% flashcard choice id:playwright-fixture-scope deck:"Playwright" priority:2 tags:"pytest,Fixture" answer:C %}
--- question
可变的 BrowserContext、Page 和订单数据通常应使用什么作用域？
- [A] Session
- [B] 全局单例
- [C] Function
--- answer
C
--- explanation
Function 级资源把状态污染限制在单条用例。只有创建成本高且本身可安全共享的只读资源，才考虑更大作用域。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link pytest Fixtures, https://docs.pytest.org/en/stable/how-to/fixtures.html, https://docs.pytest.org/en/stable/_static/favicon.png %}
{% link pytest Parametrize, https://docs.pytest.org/en/stable/how-to/parametrize.html, https://docs.pytest.org/en/stable/_static/favicon.png %}
{% link pytest-playwright Reference, https://playwright.dev/python/docs/test-runners, https://playwright.dev/img/playwright-logo.svg %}
{% link Page Object Models, https://playwright.dev/python/docs/pom, https://playwright.dev/img/playwright-logo.svg %}
{% endlinkgroup %}
