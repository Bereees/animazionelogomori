"""Split monolithic sun SVG path into 24 individual ray paths."""
import math
import re
from pathlib import Path

CX, CY = 2759.1, 2759.1
FILL = "#1a1a1a"
VIEWBOX = "0 0 5519 5519"

PATH_D = (
    "M2759.1,0l108.238,1383.8l240.95,-829.379l-27.138,863.246l530.558,-1282.63l-324.675,1349.52"
    "l485.446,-714.33l-292.566,812.609l900.95,-1055.9l-725.817,1183.14l682.433,-529.354l-529.358,682.429"
    "l1183.14,-725.816l-1055.9,900.95l812.608,-292.567l-714.329,485.446l1349.52,-324.675l-1282.63,530.558"
    "l863.245,-27.137l-829.379,240.95l1383.8,108.237l-1383.8,108.238l829.379,240.95l-863.245,-27.138"
    "l1282.63,530.559l-1349.52,-324.675l714.329,485.445l-812.608,-292.566l1055.9,900.95l-1183.14,-725.817"
    "l529.358,682.433l-682.433,-529.358l725.817,1183.14l-900.95,-1055.9l292.566,812.608l-485.445,-714.329"
    "l324.675,1349.52l-530.559,-1282.63l27.138,863.245l-240.95,-829.379l-108.238,1383.8l-108.237,-1383.8"
    "l-240.95,829.379l27.137,-863.245l-530.558,1282.63l324.675,-1349.52l-485.446,714.329l292.567,-812.608"
    "l-900.95,1055.9l725.816,-1183.14l-682.429,529.358l529.354,-682.433l-1183.14,725.817l1055.9,-900.95"
    "l-812.609,292.566l714.33,-485.445l-1349.52,324.675l1282.63,-530.559l-863.246,27.138l829.379,-240.95"
    "l-1383.8,-108.238l1383.8,-108.237l-829.379,-240.95l863.246,27.137l-1282.63,-530.558l1349.52,324.675"
    "l-714.33,-485.446l812.609,292.567l-1055.9,-900.95l1183.14,725.816l-529.354,-682.429l682.429,529.354"
    "l-725.816,-1183.14l900.95,1055.9l-292.567,-812.609l485.446,714.33l-324.675,-1349.52l530.558,1282.63"
    "l-27.137,-863.246l240.95,829.379l108.237,-1383.8Z"
)


def parse_path(d: str) -> list[tuple[float, float]]:
    tokens = re.findall(r"[MmLlZz]|[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?", d)
    points: list[tuple[float, float]] = []
    x, y = 0.0, 0.0
    i = 0
    while i < len(tokens):
        cmd = tokens[i]
        i += 1
        if cmd in ("M", "m"):
            nx, ny = float(tokens[i]), float(tokens[i + 1])
            i += 2
            if cmd == "m":
                nx += x
                ny += y
            x, y = nx, ny
            points.append((x, y))
        elif cmd in ("L", "l"):
            nx, ny = float(tokens[i]), float(tokens[i + 1])
            i += 2
            if cmd == "l":
                nx += x
                ny += y
            x, y = nx, ny
            points.append((x, y))
        elif cmd in ("Z", "z"):
            break
        else:
            raise ValueError(f"Unsupported command: {cmd}")
    return points


def dist(p: tuple[float, float]) -> float:
    return math.hypot(p[0] - CX, p[1] - CY)


def angle(p: tuple[float, float]) -> float:
    return math.atan2(p[1] - CY, p[0] - CX)


def fmt(n: float) -> str:
    return f"{n:.3f}".rstrip("0").rstrip(".")


def main() -> None:
    points = parse_path(PATH_D)
    print(f"Total vertices: {len(points)}")

    # Each ray is a triangle: tip -> base_a -> base_b (three consecutive points per ray)
    rays: list[dict] = []
    for i in range(0, len(points), 3):
        tip, base_a, base_b = points[i], points[i + 1], points[i + 2]
        tip_dist = dist(tip)
        d = f"M{fmt(CX)},{fmt(CY)} L{fmt(tip[0])},{fmt(tip[1])} L{fmt(base_a[0])},{fmt(base_a[1])} L{fmt(base_b[0])},{fmt(base_b[1])} Z"
        rays.append({"tip": tip, "tip_dist": tip_dist, "d": d, "angle": angle(tip)})

    print(f"Rays found: {len(rays)}")

    # Sort by angle for consistent ordering
    rays.sort(key=lambda r: r["angle"])

    # Classify long/short by tip distance from center
    distances = [r["tip_dist"] for r in rays]
    mid = (min(distances) + max(distances)) / 2
    for r in rays:
        r["kind"] = "long" if r["tip_dist"] >= mid else "short"

    long_count = sum(1 for r in rays if r["kind"] == "long")
    short_count = sum(1 for r in rays if r["kind"] == "short")
    print(f"Long: {long_count}, Short: {short_count}")
    print(f"Distance range: {min(distances):.1f} - {max(distances):.1f}, mid={mid:.1f}")

    paths = []
    for idx, r in enumerate(rays):
        paths.append(
            f'    <path class="ray ray-{r["kind"]}" d="{r["d"]}" fill="{FILL}"/>'
        )

    svg = f"""<svg viewBox="{VIEWBOX}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <g id="sun" class="sun-rotate">
{chr(10).join(paths)}
  </g>
</svg>
"""

    out = Path(__file__).resolve().parent.parent / "logoannamori-animated.svg"
    out.write_text(svg, encoding="utf-8")
    print(f"Written: {out}")


if __name__ == "__main__":
    main()
