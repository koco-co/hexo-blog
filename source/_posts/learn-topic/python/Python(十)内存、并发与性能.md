---
title: Python(十)内存、并发与性能
tags:
  - Python
  - 系统学习
categories:
  - Learn Topic
  - Python
description: 区分语言语义与 CPython 实现，理解对象生命周期、GC、GIL、线程、进程、asyncio 与性能测量的选择边界。
cover: /img/picgo-images/python-course-cover.png
series: Python
series_order: 10
published: true
abbrlink: fa1b960c
date: 2026-05-11 00:00:00
---

{% course_series %}

{% note info flat %}
并发题最容易把四件事混在一起：对象何时可回收、代码能否交错、CPU 能否真正并行、程序的瓶颈在哪里。先分清语言保证与 CPython 当前实现，再选线程、进程或 asyncio，答案才有边界。
{% endnote %}

## 对象生命周期

{% note primary flat %}
Python 语言保证对象在不再可达时可被回收，但不保证具体时机。CPython 通常以引用计数为主，并用循环垃圾回收器处理引用环；这是 CPython 实现细节，不应当作所有 Python 实现的语义承诺。
{% endnote %}

```python
import gc
import weakref

class Note:
    pass

note = Note()
reference = weakref.ref(note)
del note
gc.collect()
print(reference() is None)  # 通常为 True，但业务逻辑不应依赖收集时机
```

{% note warning flat %}
不要把 `__del__` 当作关闭文件、提交事务或释放锁的可靠机制。终结时机和解释器关闭顺序不稳定，引用环还会复杂化行为；资源应由 `with`、显式 `close()` 或明确生命周期管理释放。
{% endnote %}

| 工具 | 适用问题 | 不承担的职责 |
| --- | --- | --- |
| `gc` | 诊断循环与收集器行为 | 代替资源所有权 |
| `weakref` | 缓存、观察对象而不延长寿命 | 保证对象一直存在 |
| `tracemalloc` | 比较 Python 内存分配快照 | 解释全部系统内存 |
| `sys.getsizeof` | 单个对象的直接大小 | 递归计算完整对象图 |

## 并发与并行

{% note primary flat %}
并发表示多项工作在时间上交错推进；并行表示多个 CPU 核心同时执行。线程常用于等待 I/O，进程可利用多核执行 CPU 密集任务，`asyncio` 在一个线程内协作式调度大量等待型任务。选择依据是工作负载和边界，不是语法偏好。
{% endnote %}

| 工作负载 | 常见选择 | 主要代价 |
| --- | --- | --- |
| 大量可等待 I/O、已有 async 库 | `asyncio` | 需端到端 async，阻塞调用会卡住循环 |
| 少量阻塞 I/O、已有同步库 | `threading` / 线程池 | 共享状态与取消更复杂 |
| CPU 密集且任务可序列化 | `multiprocessing` / 进程池 | 进程启动、复制/序列化、IPC 成本 |
| 小任务或单一顺序流程 | 不并发 | 可读性和调试成本最低 |

## GIL 边界

{% note primary flat %}
在传统 CPython 构建中，全局解释器锁（GIL）限制同一解释器内多个线程同时执行 Python 字节码；它不阻止 I/O 等待期间切换，也不阻止多个进程并行。其他实现以及 CPython 的可选 free-threaded 构建可能不同，所以讨论 GIL 时必须说明实现和构建。
{% endnote %}

{% note warning flat %}
“有 GIL 所以线程没有用”是错误结论。线程对 I/O 并发、阻塞库适配和响应性仍然有用；反过来，free-threaded 构建也不会自动消除竞态、死锁、锁粒度和第三方扩展兼容性问题。
{% endnote %}

## 执行模型

{% note primary flat %}
线程共享进程内对象，进程默认隔离内存，协程共享线程并只在 `await` 等协作点让出执行权。三者都可能有共享资源：线程需要锁或队列，进程需要消息和序列化协议，协程需要避免跨 await 的不一致状态。
{% endnote %}

```python
import asyncio

async def work(name: str, delay: float) -> str:
    await asyncio.sleep(delay)
    return name

async def main() -> None:
    results = await asyncio.gather(work("a", 0.01), work("b", 0.01))
    print(results)

asyncio.run(main())
```

{% folding 取消与超时, open %}
取消是协作请求，不是强制终止。线程常通过 `threading.Event` 轮询退出；协程会在 await 点收到取消，清理代码应放在 `finally`。进程任务的终止代价更高，必须设计幂等外部操作与可恢复状态。超时要定义是放弃等待、取消任务，还是让后台继续。
{% endfolding %}

## 共享状态

{% note primary flat %}
竞态发生在结果依赖交错顺序、而程序未建立同步关系时。一次 `counter += 1` 不是应用层的事务；即使某次运行看似正确，也不能说明没有竞态。优先传递不可变消息、使用队列，或把临界区缩到最小。
{% endnote %}

```python
from threading import Lock

class Counter:
    def __init__(self) -> None:
        self._value = 0
        self._lock = Lock()

    def increment(self) -> int:
        with self._lock:
            self._value += 1
            return self._value

    @property
    def value(self) -> int:
        with self._lock:
            return self._value
```

{% note warning flat %}
锁解决的是临界区互斥，不是所有设计问题。持锁期间执行网络、磁盘或未知回调会放大阻塞甚至死锁；统一锁顺序、避免嵌套锁、缩小临界区，并以测试制造竞争条件验证设计。
{% endnote %}

## 性能选择

{% note primary flat %}
性能优化先识别输入规模和瓶颈，再选择算法、数据结构、批处理或并发模型。缓存必须有失效策略和容量边界；并发必须抵消调度与同步成本。Python 代码的可读性是长期性能的一部分，因为它决定调优是否能被验证。
{% endnote %}

```python
import timeit

statement = "sum(value * value for value in range(10_000))"
seconds = timeit.timeit(statement, number=100)
print(seconds)
```

## 并发实验

{% note info flat %}
这个例子不试图测出“线程一定更快”，而是验证锁保护了共享计数器。可将锁暂时去掉、多次运行，观察结果是否仍能可靠；测试偶然通过不构成正确性证据。
{% endnote %}

```python
from concurrent.futures import ThreadPoolExecutor

counter = Counter()
with ThreadPoolExecutor(max_workers=4) as executor:
    list(executor.map(lambda _: counter.increment(), range(100)))

print(counter.value)  # 100
```

## 结果验证

{% note success flat %}
完成本篇后，应能用“工作负载、共享模型、取消方式、测量证据”解释并发选型，而不是只背 GIL。任何性能建议都要标注 CPython/版本、输入规模和 I/O 环境，避免把一次机器上的偶然结果推广为语言规则。
{% endnote %}

- [ ] 能区分语言回收语义与 CPython 引用计数实现。
- [ ] 不用析构器管理外部资源。
- [ ] 能解释 GIL 对 CPU 字节码、I/O 与多进程的不同影响。
- [ ] 能为共享可变状态选择锁、队列或消息边界。
- [ ] 能说明 asyncio 何时让出执行权及如何清理取消。

## 常见问题

{% flashcard basic id:python-runtime-gc deck:"Python 基础" priority:1 tags:"Python,GC,CPython,引用计数" %}
--- question
Python 的垃圾回收能否保证对象何时销毁？
--- answer
不能保证具体时机；CPython 常用引用计数和循环 GC，但这是实现细节。
--- explanation
语言只规定对象在不可达后“可以被回收”，不规定回收发生的时刻。CPython 的引用计数常让无环对象较快释放，但循环需要 GC，其他实现的策略也可能不同：

```python
import gc
import weakref

class Node: pass

node = Node()
ref = weakref.ref(node)
del node
print(ref() is None)  # CPython 常见为 True，但不是业务契约
gc.collect()          # 只适合诊断或实验，不能代替资源管理
```

文件、锁和连接应使用 `with` 或明确 `close()`；弱引用适合不应延长对象寿命的缓存或观察关系。不要把 `__del__` 或某次 `gc.collect()` 当作确定的清理时机。
{% endflashcard %}

{% flashcard basic id:python-runtime-gil deck:"Python 基础" priority:1 tags:"Python,GIL,CPython,线程" %}
--- question
传统 CPython 的 GIL 对线程意味着什么？
--- answer
同一解释器内线程不能同时执行 Python 字节码，但 I/O 等待可交错，多个进程可并行。
--- explanation
GIL 限制的是传统 CPython 解释器内多个线程同时执行 Python 字节码，不是“线程不能工作”。可以用任务类型比较：

| 场景 | GIL 下的常见选择 | 原因 |
| --- | --- | --- |
| 等待网络/磁盘 | 线程或 async | 等待期间可切换其他工作 |
| Python CPU 计算 | 进程 | 不同进程拥有独立解释器 |
| C 扩展释放 GIL | 依赖库行为测量 | 是否并行取决于实现 |

free-threaded 构建可能改变字节码并行边界，但不会自动解决竞态、死锁或第三方扩展兼容性；讨论结果时必须写明 CPython 构建和版本。
{% endflashcard %}

{% flashcard basic id:python-runtime-thread-process-async deck:"Python 基础" priority:1 tags:"Python,threading,multiprocessing,asyncio" %}
--- question
线程、进程和 asyncio 如何按任务选择？
--- answer
阻塞 I/O 常用线程，CPU 密集且可序列化的任务常用进程，大量可等待 I/O 且链路可 async 时用 asyncio。
--- explanation
三者的差异可以落到共享模型和让出点：

```python
async def fetch_two():
    # 协程只有在 await 处主动让出执行权。
    return await asyncio.gather(fetch("a"), fetch("b"))
```

线程共享进程内对象，需要锁或队列；进程默认隔离内存，需要序列化和消息协议；协程通常共享一个线程，只在 `await` 等协作点切换。先测量是 I/O、CPU 还是同步开销，再选择依赖库支持的最小复杂度方案。
{% endflashcard %}

{% flashcard basic id:python-runtime-race deck:"Python 基础" priority:1 tags:"Python,竞态,锁,并发" %}
--- question
什么是竞态条件？锁为什么不能解决所有并发问题？
--- answer
竞态是结果依赖执行交错顺序；锁只保护明确临界区，不能自动设计消息边界、取消或避免死锁。
--- explanation
竞态的关键不是“有没有多线程”，而是多个执行者是否能以不同顺序读写同一状态。锁只保护它包围的临界区：

```python
with lock:
    current = balance
    balance = current - amount
# 慢 I/O 放在锁外，避免把临界区变成整个请求
```

共享状态可以用短临界区和固定锁顺序保护，也可以改成队列与不可变消息。不要在持锁期间执行慢 I/O 或未知回调；用压力测试、故意延迟和结果不变量验证实际交错，锁本身不能自动设计取消和消息边界。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link Python 3.14 gc, https://docs.python.org/3.14/library/gc.html, https://docs.python.org/3.14/_static/py.svg %}
{% link Python 3.14 threading, https://docs.python.org/3.14/library/threading.html, https://docs.python.org/3.14/_static/py.svg %}
{% link Python 3.14 multiprocessing, https://docs.python.org/3.14/library/multiprocessing.html, https://docs.python.org/3.14/_static/py.svg %}
{% link Python 3.14 asyncio, https://docs.python.org/3.14/library/asyncio.html, https://docs.python.org/3.14/_static/py.svg %}
{% endlinkgroup %}
