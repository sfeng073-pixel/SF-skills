from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


FONT_REGULAR_CANDIDATES = [
    "/System/Library/Fonts/Hiragino Sans GB.ttc",
    "/System/Library/Fonts/STHeiti Light.ttc",
]
FONT_BOLD_CANDIDATES = [
    "/System/Library/Fonts/STHeiti Medium.ttc",
    "/System/Library/Fonts/Hiragino Sans GB.ttc",
]


def font(size: int, bold: bool = False):
    candidates = FONT_BOLD_CANDIDATES if bold else FONT_REGULAR_CANDIDATES
    for candidate in candidates:
        if Path(candidate).exists():
            return ImageFont.truetype(candidate, size=size)
    return ImageFont.load_default()


def text_width(draw: ImageDraw.ImageDraw, text: str, text_font) -> int:
    box = draw.textbbox((0, 0), text, font=text_font)
    return box[2] - box[0]


def fit_font(draw: ImageDraw.ImageDraw, text: str, max_width: int, size: int, bold: bool = False):
    while size > 15:
        candidate = font(size, bold)
        if text_width(draw, text, candidate) <= max_width:
            return candidate
        size -= 1
    return font(15, bold)


def draw_text(draw: ImageDraw.ImageDraw, xy, text: str, size: int, fill: str, *, bold: bool = False, max_width: int | None = None):
    text_font = fit_font(draw, text, max_width, size, bold) if max_width else font(size, bold)
    draw.text(xy, text, font=text_font, fill=fill)


def rounded(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], radius: int, fill: str, outline: str | None = None):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline)


def percent_text(value) -> str:
    if value is None:
        return "--"
    return f"{value * 100:.1f}%"


def metric_text(value) -> str:
    if value is None or value == "":
        return "--"
    if isinstance(value, float) and value.is_integer():
        return str(int(value))
    return str(value)


def main() -> int:
    if len(sys.argv) < 3:
        raise SystemExit("usage: call-duration-poster-python.py MODEL_JSON OUTPUT_PNG")

    model_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2])
    model = json.loads(model_path.read_text(encoding="utf-8"))

    width = 1080
    rows = model["rows"][:17]
    height = max(980, 360 + 74 + len(rows) * 54 + 100)
    image = Image.new("RGB", (width, height), "#fbf7f2")
    draw = ImageDraw.Draw(image)

    hero = "#3a2634"
    hero_2 = "#c27a42"
    accent_soft = "#fff0e3"
    accent_text = "#8d421f"
    header = "#f8eadf"
    line = "#ecd9ca"

    draw.rectangle((0, 0, width, 248), fill=hero)
    draw.polygon([(0, 248), (width, 184), (width, 248)], fill=hero_2)
    draw.line((54, 248, 1026, 248), fill="#ffffff", width=1)

    rounded(draw, (54, 40, 252, 84), 22, accent_soft)
    draw_text(draw, (78, 50), "KPI播报", 24, accent_text, bold=True)
    draw_text(draw, (54, 112), f"台湾{model['slotLabel']}通时通次｜{model['groupName']}", 42, "#ffffff", bold=True, max_width=900)
    draw_text(draw, (54, 182), "按通时倒序展示，通时相同按通次排序", 24, "#eadfd5", max_width=700)

    rounded(draw, (54, 286, 1026, height - 70), 24, "#ffffff", line)
    draw_text(draw, (84, 318), "全员排名", 32, "#172033", bold=True)
    rounded(draw, (856, 312, 986, 352), 20, accent_soft)
    draw_text(draw, (882, 321), f"共 {model['totals']['salesCount']} 人", 21, accent_text, bold=True, max_width=88)

    headers = ["排名", "销售", "通时", "通时达标", "通次", "通次达标"]
    col_x = [84, 172, 430, 560, 738, 848]
    widths = [54, 210, 92, 126, 88, 118]
    y = 388
    rounded(draw, (74, y - 16, 1006, y + 42), 12, header)
    for x, label, max_width in zip(col_x, headers, widths):
        draw_text(draw, (x, y), label, 20, "#405064", bold=True, max_width=max_width)

    y += 62
    for index, row in enumerate(rows):
        fill = accent_soft if index < 3 else "#fbfdff" if index % 2 == 0 else "#f6f9fc"
        rounded(draw, (74, y - 10, 1006, y + 38), 10, fill)
        values = [
            f"#{row['rank']}",
            row["sales"],
            metric_text(row["duration"]),
            percent_text(row["durationRate"]),
            metric_text(row["callCount"]),
            percent_text(row["callCountRate"]),
        ]
        for x, value, max_width in zip(col_x, values, widths):
            color = "#b42318" if value.endswith("%") and value != "--" and float(value.strip("%")) < 50 else "#1f2d3d"
            if value.startswith("#") and index < 3:
                color = accent_text
            draw_text(draw, (x, y), value, 20, color, bold=value == row["sales"] or value.startswith("#"), max_width=max_width)
        y += 54

    draw_text(draw, (54, height - 42), "数据来源：SmartBI 当日时点快照｜图片仅展示数据，提醒以文字为准", 20, "#6b7888", max_width=920)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    image.save(output_path, quality=95)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
