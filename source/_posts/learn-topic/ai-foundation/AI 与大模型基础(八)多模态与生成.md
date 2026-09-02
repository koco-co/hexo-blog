---
title: AI 与大模型基础(八)多模态与生成
tags:
  - AI 与大模型基础
  - 多模态与生成
categories:
  - Learn Topic
  - AI 与大模型基础
description: 能区分文本、图像、音频、视频、扩散生成及其输入输出边界。
cover: /img/picgo-images/ai-foundation-course-cover.png
series: AI 与大模型基础
series_order: 8
published: false
abbrlink: 4108edf8
date: 2026-08-29 00:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

{% note primary flat %}
本节要解决：沿着内容块、模态编码、跨模态连接和任务 Oracle 追踪图像、音频与视频证据，并区分自回归和扩散生成。
{% endnote %}

## 机制模型

{% note info flat %}
多模态接口先验证内容块、MIME、大小与编码，再由专用编码器或连接器形成模型表示。跨模态对齐、扩散生成和任务验证是三件事；“文件被接受”不等于内容被正确理解。
{% endnote %}

{% mermaid %}
flowchart TD
  F[本地文件] --> C[格式与大小校验]
  C --> E[模态编码/采样]
  E --> M[模型表示]
  M --> O[识别或生成输出]
  O --> V[OCR/IoU/人工证据验证]
{% endmermaid %}

{% note primary flat %}
输入合同、编码表示、模型输出和任务验证是四个独立门槛。前一节点成功只能让数据继续流动，不能替代后一节点的 OCR、定位、时序或人工证据。
{% endnote %}

| 模态 | 进入主干前的表示 | 任务 Oracle | 常见证据损失 |
| --- | --- | --- | --- |
| 文本 | Token ID 与位置表示 | 标签、引用或程序结果 | 截断、encoding 变化 |
| 图像 | 像素经缩放/切块后的视觉向量 | OCR 字符错误率、标注框 IoU | 小字、方向、裁剪与坐标缩放 |
| 音频 | 波形或时频表示，按时长切片 | 转写错误率、事件时间偏差 | 重采样、声道混合、切片边界 |
| 视频 | 采样帧、时间位置，可能另含音轨 | 事件类别与起止时间 | 抽帧漏事件、时序与音画错位 |

{% note info flat %}
跨模态连接器把视觉或音频编码器输出投影到主干可处理的维度；对比学习可以拉近配对文本与媒体表示，生成式目标也可训练内容块到输出的条件关系。目标只约束训练样本上的表示或输出，不保证 OCR 字符、像素坐标和时间戳精确。
{% endnote %}

{% note primary flat %}
官方图像输入文档只用于说明图像入口；Gemini 视频理解文档用于说明厂商接口会定义抽帧率、时间戳与音轨处理边界，不代表所有视频接口相同。下面的音频字段和视频元数据仍是本地教学合同，不冒充任何厂商 API schema。真实接口要按目标 API 的当前文档逐字段核对；结构正确只说明本地解析门槛通过，编码器或连接器的语义输出仍需任务 Oracle。
{% endnote %}

| 生成路线 | 训练 | 生成 | 边界 |
| --- | --- | --- | --- |
| 自回归 | 在已知前缀下预测下一个 token | 把上一步输出作为新条件，逐步采样直到停止 | 早期错误会进入后续条件 |
| DDPM | 对数据逐步加噪，并学习预测噪声/逆向参数 | 从噪声开始，反复执行学习到的逆向去噪 | 单纯加噪不是 DDPM 生成，也不是找回训练图片 |

## 核心边界

{% note info flat %}
构造 PNG、WAV 与视频内容块，分别验证签名、声明 MIME、编码前后大小、严格解码和任务字段；再用合成 OCR、定位和音频时间标注计算任务指标。
{% endnote %}

{% folding purple, 展开机制辨析 %}
输入合同、模态表示、对齐目标和任务验证是四层证据。文件签名只证明容器类型；OCR 用标注字符串，定位用标注框，音视频用时间区间。版权、隐私和授权又是独立治理门禁，不能由技术指标代替。
{% endfolding %}

## 本地实验

{% note info flat %}
下面的 Python 3 代码只使用标准库。输入在代码中冻结，关键动作有断言，输出可以在本地复算；没有凭据、网络请求或外部副作用。
{% endnote %}

```python
import base64
import binascii
import math
import struct

LOCAL_CONTRACT = {
    "input_image":{"required":{"media_type","encoded_size","decoded_size","encoding","data"}},
    "input_audio":{"required":{"media_type","encoded_size","decoded_size","encoding","sample_rate","data"}},
    "video_metadata":{"required":{"media_type","declared_size","duration_s","frame_sample_hz","content_evidence"}},
}
MAX_ENCODED_BYTES = 300
MAX_DECODED_BYTES = 200
png_b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
png = base64.b64decode(png_b64, validate=True)
png_noncanonical_b64 = png_b64[:-2] + "J="
png_noncanonical = base64.b64decode(png_noncanonical_b64, validate=True)
if png_noncanonical != png or base64.b64encode(png_noncanonical).decode() == png_noncanonical_b64:
    raise RuntimeError("noncanonical fixture changed")
wav = b"RIFF" + struct.pack("<I",36) + b"WAVEfmt " + struct.pack("<IHHIIHH",16,1,1,8000,16000,2,16) + b"data" + struct.pack("<I",0)

def sniff(data):
    if data[:8] == b"\x89PNG\r\n\x1a\n" and data[12:16] == b"IHDR":
        return "image/png"
    if data[:4] == b"RIFF" and data[8:12] == b"WAVE":
        return "audio/wav"
    return "unknown"

def decode_payload(block):
    if block["encoding"] == "base64":
        if not isinstance(block["data"],str):
            raise ValueError("base64 payload must be text")
        try:
            encoded = block["data"].encode("ascii")
        except UnicodeEncodeError:
            raise ValueError("malformed base64") from None
        if len(encoded) != block["encoded_size"]:
            raise ValueError("encoded size mismatch")
        if not 0 < len(encoded) <= MAX_ENCODED_BYTES:
            raise ValueError("encoded size limit")
        try:
            decoded = base64.b64decode(encoded,validate=True)
        except binascii.Error:
            raise ValueError("malformed base64") from None
        if base64.b64encode(decoded) != encoded:
            raise ValueError("noncanonical base64")
    elif block["encoding"] == "raw":
        if not isinstance(block["data"],bytes):
            raise ValueError("raw payload must be bytes")
        decoded = block["data"]
        if block["encoded_size"] != len(decoded):
            raise ValueError("encoded size mismatch")
    else:
        raise ValueError("unsupported encoding")
    if not 0 < block["decoded_size"] <= MAX_DECODED_BYTES:
        raise ValueError("decoded size limit")
    if len(decoded) != block["decoded_size"]:
        raise ValueError("decoded size mismatch")
    return decoded

def positive_finite(value):
    return (isinstance(value,(int,float)) and not isinstance(value,bool)
            and math.isfinite(value) and value > 0)

def validate(block):
    spec = LOCAL_CONTRACT.get(block.get("type"))
    if spec is None or set(block) != spec["required"] | {"type"}:
        raise ValueError("schema field mismatch")
    if block["type"] in {"input_image","input_audio"}:
        decoded = decode_payload(block)
        if sniff(decoded) != block["media_type"]:
            raise ValueError("declared MIME mismatch")
        if block["type"] == "input_audio":
            if (not isinstance(block["sample_rate"],int) or isinstance(block["sample_rate"],bool)
                    or len(decoded) < 28
                    or struct.unpack_from("<I",decoded,24)[0] != block["sample_rate"]):
                raise ValueError("WAV sample rate mismatch")
    if block["type"] == "video_metadata":
        if (not isinstance(block["declared_size"],int) or isinstance(block["declared_size"],bool)
                or not 0 < block["declared_size"] <= MAX_DECODED_BYTES):
            raise ValueError("declared size limit")
        if block["media_type"] != "video/mp4":
            raise ValueError("invalid video media type")
        if not positive_finite(block["duration_s"]):
            raise ValueError("video duration must be finite and positive")
        if not positive_finite(block["frame_sample_hz"]):
            raise ValueError("video frame sampling must be finite and positive")
        if block["content_evidence"] != "metadata-only":
            raise ValueError("video bytes not validated")
    return block["type"]

def edit_distance(left, right):
    previous = list(range(len(right) + 1))
    for i, left_char in enumerate(left, 1):
        current = [i]
        for j, right_char in enumerate(right, 1):
            current.append(min(current[-1] + 1, previous[j] + 1,
                               previous[j - 1] + (left_char != right_char)))
        previous = current
    return previous[-1]

def cer(reference, prediction):
    if not reference:
        raise ValueError("empty OCR reference")
    return edit_distance(reference, prediction) / len(reference)

def iou(a, b):
    left, top = max(a[0],b[0]), max(a[1],b[1])
    right, bottom = min(a[2],b[2]), min(a[3],b[3])
    intersection = max(0,right-left) * max(0,bottom-top)
    union = (a[2]-a[0])*(a[3]-a[1]) + (b[2]-b[0])*(b[3]-b[1]) - intersection
    return intersection / union

blocks = [
    {"type":"input_image","media_type":"image/png","encoded_size":len(png_b64),
     "decoded_size":len(png),"encoding":"base64","data":png_b64},
    {"type":"input_audio","media_type":"audio/wav","encoded_size":len(wav),
     "decoded_size":len(wav),"encoding":"raw","sample_rate":8000,"data":wav},
    {"type":"video_metadata","media_type":"video/mp4","declared_size":120,"duration_s":4.0,
     "frame_sample_hz":2.0,"content_evidence":"metadata-only"},
]
accepted = [validate(block) for block in blocks]
metrics = {"cer_substitution":round(cer("MODEL","MODE1"),3),
           "cer_deletion":round(cer("MODEL","MODE"),3),
           "iou":round(iou((0,0,10,10),(5,0,15,10)),3),
           "audio_time_error_s":round(abs(2.4 - 2.0),1)}
if accepted != ["input_image","input_audio","video_metadata"]:
    raise RuntimeError("accepted block set changed")
if metrics != {"cer_substitution":0.2,"cer_deletion":0.2,"iou":0.333,"audio_time_error_s":0.4}:
    raise RuntimeError("metric arithmetic changed")
print("blocks", accepted)
print("metrics", metrics)
negative = [
    ({**blocks[0], "media_type":"image/jpeg"},"declared MIME mismatch"),
    ({**blocks[2], "declared_size":201},"declared size limit"),
    ({**blocks[0], "encoding":"hex"},"unsupported encoding"),
    ({key:value for key,value in blocks[0].items() if key != "data"},"schema field mismatch"),
    ({**blocks[2], "content_evidence":"decoded"},"video bytes not validated"),
    ({**blocks[0], "data":png_b64[:-1] + "!"},"malformed base64"),
    ({**blocks[0], "data":png_noncanonical_b64},"noncanonical base64"),
    ({**blocks[0], "encoded_size":len(png_b64)-1},"encoded size mismatch"),
    ({**blocks[0], "decoded_size":len(png)+1},"decoded size mismatch"),
    ({**blocks[1], "sample_rate":16000},"WAV sample rate mismatch"),
    ({**blocks[2], "media_type":"image/png"},"invalid video media type"),
    ({**blocks[2], "duration_s":0.0},"video duration must be finite and positive"),
    ({**blocks[2], "duration_s":float("inf")},"video duration must be finite and positive"),
    ({**blocks[2], "frame_sample_hz":0.0},"video frame sampling must be finite and positive"),
    ({**blocks[2], "frame_sample_hz":float("inf")},"video frame sampling must be finite and positive"),
]
rejections = []
for bad,expected_error in negative:
    try:
        validate(bad)
    except ValueError as error:
        if str(error) != expected_error:
            raise RuntimeError("wrong block rejection")
        rejections.append(str(error))
        print("rejected:", error)
    else:
        raise RuntimeError("invalid block accepted")
if rejections != [expected for _,expected in negative]:
    raise RuntimeError("block rejection order changed")
```

{% note success flat %}
精确输出先接受 `input_image/input_audio/video_metadata`，其中 WAV 声明采样率必须等于冻结头部的 8000 Hz，视频 MIME、时长与抽帧率必须满足本地合同。随后每个负例都绑定精确错误文本，依次覆盖 `declared MIME mismatch`、`declared size limit`、`unsupported encoding`、`schema field mismatch`、`video bytes not validated`、`malformed base64`、`noncanonical base64`、`encoded size mismatch`、`decoded size mismatch`、`WAV sample rate mismatch`、`invalid video media type`、`video duration must be finite and positive` 与 `video frame sampling must be finite and positive` 这些拒绝类。CER、IoU 与时间偏差来自合成标注，不代表真实模型成绩。
{% endnote %}

{% folding blue, 展开精确标准输出 %}
```text
blocks ['input_image', 'input_audio', 'video_metadata']
metrics {'cer_substitution': 0.2, 'cer_deletion': 0.2, 'iou': 0.333, 'audio_time_error_s': 0.4}
rejected: declared MIME mismatch
rejected: declared size limit
rejected: unsupported encoding
rejected: schema field mismatch
rejected: video bytes not validated
rejected: malformed base64
rejected: noncanonical base64
rejected: encoded size mismatch
rejected: decoded size mismatch
rejected: WAV sample rate mismatch
rejected: invalid video media type
rejected: video duration must be finite and positive
rejected: video duration must be finite and positive
rejected: video frame sampling must be finite and positive
rejected: video frame sampling must be finite and positive
```
{% endfolding %}

## 失败边界

{% note warning flat %}
把 API 接受文件等同理解正确；说所有模态只是同一种 token；把扩散过程说成找回某张训练图片；用 MIME/大小校验替代版权、隐私和内容审核。
{% endnote %}

| 检查项 | 通过证据 | 失败信号 |
| --- | --- | --- |
| 输入合同 | magic bytes、MIME、尺寸等可观察 | 只看文件名 |
| 任务指标 | OCR 用字符误差、定位用 IoU | 只看通顺描述 |
| 证据边界 | 生成结果明确为样本 | 冒充真实照片或测量 |

## 结果验证

{% note success flat %}
预期输出应分别证明内容块字段、PNG/WAV 签名、WAV 头部采样率、有限正数的视频时长与抽帧率，以及三种任务指标的计算；每个负例必须命中冻结的精确错误。它只证明冻结 payload 可按本地合同严格解码，不证明模型理解、版权许可或隐私合规。
{% endnote %}

- 文件验证记录容器、尺寸、编码与限制。
- OCR、定位和时序任务使用各自标注与指标。
- 生成样本保存提示、模型版本、参数与来源声明。

## 常见问题

{% flashcard basic id:foundation-multimodal-world deck:"AI 与大模型基础" priority:1 tags:"多模态与生成,基础机制" %}
--- question
多模态模型是否天然理解真实世界？
--- answer
不天然；它处理经过编码、缩放或采样的输入，输出仍需任务级证据验证。
--- explanation
文件可解析只证明输入合同通过。任务验证链必须继续：

1. OCR：预测字符串与标注计算字符/词错误率；
2. 定位：预测框与标注框计算 IoU，并统一坐标尺度；
3. 音视频：事件类别与起止时间分别对齐。

缩放、裁剪和抽帧可能在编码前就丢掉证据；Oracle 必须来自独立标注或测量。
{% endflashcard %}

{% flashcard basic id:foundation-diffusion-autoregressive deck:"AI 与大模型基础" priority:2 tags:"多模态与生成,基础机制" %}
--- question
扩散生成与自回归生成路径有什么不同？
--- answer
自回归逐 token 条件生成；DDPM 从加噪过程学习近似逆向去噪。
--- explanation
自回归路径是“前缀 → next-token 分布 → 采样 → 新前缀”；DDPM 路径是“训练时逐步加噪并学习逆向参数，生成时从噪声反复去噪”。两者都从分布采样，不保证唯一正确输出；只有加噪而没有学习到的逆向网络不构成 DDPM 生成。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link OpenAI Image Inputs Guide, https://platform.openai.com/docs/guides/images-vision, https://developers.openai.com/favicon.png %}
{% link CLIP, https://arxiv.org/abs/2103.00020v1, https://arxiv.org/favicon.ico %}
{% link Whisper, https://arxiv.org/abs/2212.04356v1, https://arxiv.org/favicon.ico %}
{% link Gemini Video Understanding, https://ai.google.dev/gemini-api/docs/video-understanding, https://www.gstatic.com/devrel-devsite/prod/vdc800838fb8be04a9a7685606311d18c65800504bccf261551968ac74bffd42e/googledevai/images/favicon-new.png %}
{% link Denoising Diffusion Probabilistic Models, https://arxiv.org/abs/2006.11239v1, https://arxiv.org/favicon.ico %}
{% endlinkgroup %}
