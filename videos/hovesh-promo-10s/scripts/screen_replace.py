"""Replace a chroma-green phone screen in a clip with real app screenshots.

Per frame: key the green, find the screen quad, perspective-warp the screenshot
into it, and composite only where the green was (so fingers stay on top).

usage: python screen_replace.py in.mp4 out.mp4 shot1.png[@t] [shot2.png@t2 ...]
  shotN@t = show that screenshot from t seconds on (first defaults to 0).
"""
import sys
import cv2
import numpy as np


def order_quad(pts):
    pts = pts.reshape(4, 2).astype(np.float32)
    s = pts.sum(1)
    d = np.diff(pts, axis=1).ravel()
    return np.array([pts[np.argmin(s)], pts[np.argmin(d)], pts[np.argmax(s)], pts[np.argmax(d)]], np.float32)


def green_mask(frame):
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    m = cv2.inRange(hsv, (40, 90, 70), (85, 255, 255))
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    return m


def find_quad(mask):
    closed = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((25, 25), np.uint8))
    cnts, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not cnts:
        return None
    c = max(cnts, key=cv2.contourArea)
    if cv2.contourArea(c) < 0.004 * mask.size:
        return None
    hull = cv2.convexHull(c)
    peri = cv2.arcLength(hull, True)
    for eps in (0.02, 0.03, 0.05, 0.08):
        approx = cv2.approxPolyDP(hull, eps * peri, True)
        if len(approx) == 4:
            return order_quad(approx)
    return order_quad(cv2.boxPoints(cv2.minAreaRect(hull)))


def main():
    src, dst = sys.argv[1], sys.argv[2]
    shots = []
    for arg in sys.argv[3:]:
        path, _, t = arg.partition("@")
        shots.append((float(t or 0), None if path == "VIEWFINDER" else cv2.imread(path)))
    shots.sort(key=lambda s: s[0])

    cap = cv2.VideoCapture(src)
    fps = cap.get(cv2.CAP_PROP_FPS) or 24
    w, h = int(cap.get(3)), int(cap.get(4))
    out = cv2.VideoWriter(dst, cv2.VideoWriter_fourcc(*"mp4v"), fps, (w, h))
    prev = None
    i = 0
    misses = 0
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        t = i / fps
        img = [s for s in shots if s[0] <= t][-1][1]
        if img is None:  # "VIEWFINDER": live camera preview of the table below the phone
            q0 = find_quad(green_mask(frame))
            qw = int(np.linalg.norm(q0[1] - q0[0])) if q0 is not None else 320
            qh = int(np.linalg.norm(q0[3] - q0[0])) if q0 is not None else 180
            ch = int(h * 0.30)
            cw = int(ch * qw / max(qh, 1))
            x0 = max(0, min(w - cw, w // 2 - cw // 2 - 40))
            img = frame[int(h * 0.52):int(h * 0.52) + ch, x0:x0 + cw].copy()
            img = cv2.resize(img, (qw * 2, qh * 2))
            ih2, iw2 = img.shape[:2]
            L, th, col = int(min(iw2, ih2) * 0.18), 4, (170, 212, 45)  # teal scan brackets (app style)
            m = int(min(iw2, ih2) * 0.12)
            for (cx, cy, dx, dy) in [(m, m, 1, 1), (iw2 - m, m, -1, 1), (m, ih2 - m, 1, -1), (iw2 - m, ih2 - m, -1, -1)]:
                cv2.line(img, (cx, cy), (cx + dx * L, cy), col, th)
                cv2.line(img, (cx, cy), (cx, cy + dy * L), col, th)
        mask = green_mask(frame)
        quad = find_quad(mask)
        if quad is not None and prev is not None:
            quad = 0.6 * quad + 0.4 * prev  # smooth jitter
        if quad is None:
            quad = prev
            misses += 1
        if quad is not None:
            ih, iw = img.shape[:2]
            srcq = np.array([[0, 0], [iw, 0], [iw, ih], [0, ih]], np.float32)
            M = cv2.getPerspectiveTransform(srcq, quad.astype(np.float32))
            warped = cv2.warpPerspective(img, M, (w, h), flags=cv2.INTER_AREA)
            # composite where the frame is green (keeps fingers), dilated slightly to kill fringe
            # inside the screen quad: replace everything except saturated non-green pixels
            # (fingers / gloves), so glare and reflections on the glass are covered too
            qm = np.zeros((h, w), np.uint8)
            cv2.fillConvexPoly(qm, quad.astype(np.int32), 255)
            qm = cv2.erode(qm, np.ones((3, 3), np.uint8))
            hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
            occ = ((hsv[..., 1] > 70) & ~((hsv[..., 0] >= 40) & (hsv[..., 0] <= 85))).astype(np.uint8) * 255
            occ = cv2.morphologyEx(occ, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
            mask = cv2.bitwise_or(mask, cv2.bitwise_and(qm, cv2.bitwise_not(occ)))
            # never touch green pixels far from the phone (traffic lights, reflections)
            mask = cv2.bitwise_and(mask, cv2.dilate(qm, np.ones((9, 9), np.uint8)))
            a = cv2.dilate(mask, np.ones((5, 5), np.uint8))
            a = cv2.GaussianBlur(a, (5, 5), 0).astype(np.float32)[..., None] / 255.0
            frame = (warped * a + frame * (1 - a)).astype(np.uint8)
            # despill leftover green around the edges
            # (only in a band around the screen, int math to avoid uint8 wrap-around)
            band = cv2.dilate(qm, np.ones((15, 15), np.uint8)) > 0
            f16 = frame.astype(np.int16)
            lim = np.maximum(f16[..., 0], f16[..., 2]) + 20
            g = np.where(band, np.minimum(f16[..., 1], lim), f16[..., 1])
            f16[..., 1] = g
            frame = np.clip(f16, 0, 255).astype(np.uint8)
            prev = quad
        out.write(frame)
        i += 1
    out.release()
    print(f"frames={i} missed_quads={misses}")


if __name__ == "__main__":
    main()
