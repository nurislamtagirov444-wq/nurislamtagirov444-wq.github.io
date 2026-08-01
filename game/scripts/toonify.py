#!/usr/bin/env python3
"""Тунификация реалистичных фонов под аниме-стилистику SPEC v1.2.

Обработка: двустороннее сглаживание (аппроксимация) -> квантование палитры ->
поднятие чёткости контуров. Запуск:
    python3 scripts/toonify.py public/assets/art/bg_lighthouse_day.jpg [...]
Все преобразования применяются к нашим собственным сгенерированным ассетам.
"""
import sys
from pathlib import Path
from PIL import Image, ImageFilter, ImageEnhance

COLORS = 28          # палитра «сел-шейдинга»
SMOOTH_PASSES = 3    # сколько раз прогнать смягчающий фильтр
EDGE_STRENGTH = 1.9  # усиление контуров

def toonify(path: Path) -> None:
    img = Image.open(path).convert('RGB')
    w, h = img.size

    # 1) аппроксимация bilateral: downscale -> upscale для выравнивания областей
    small = img.resize((w // 3, h // 3), Image.LANCZOS)
    for _ in range(SMOOTH_PASSES):
        small = small.filter(ImageFilter.ModeFilter(3))
    flat = small.resize((w, h), Image.LANCZOS)

    # 2) квантование цветов -> «плоские» области сел-шейдинга
    flat = flat.quantize(colors=COLORS, method=Image.Quantize.MEDIANCUT).convert('RGB')

    # 3) контуры: находим кромки на оригинале, чуть затемняем их в результате
    edges = img.convert('L').filter(ImageFilter.FIND_EDGES)
    edges = edges.point(lambda p: 255 - p)          # линии = тёмные
    edges = edges.point(lambda p: max(0, p - 115) * 2)  # отсечь шум, усилить
    edge_rgb = Image.merge('RGB', (edges, edges, edges))
    darkened = Image.blend(flat, Image.new('RGB', flat.size, (10, 14, 20)), 0.10)
    out = Image.composite(darkened, flat, edges.point(lambda p: 255 - p // 3))

    out = ImageEnhance.Color(out).enhance(1.06)
    out = ImageEnhance.Contrast(out).enhance(1.04)
    out = ImageEnhance.Sharpness(out).enhance(EDGE_STRENGTH)
    out.save(path, quality=90)
    print(f'toonified: {path.name}')

if __name__ == '__main__':
    for arg in sys.argv[1:]:
        toonify(Path(arg))
