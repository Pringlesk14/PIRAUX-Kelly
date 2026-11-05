"""
Génère la musique de fond originale (style « vlog CapCut » : ukulélé,
glockenspiel, claps, charleston, basse) → public/music/musique.mp3

    python3 scripts/generate-music.py

Uniquement numpy + ffmpeg. Composition originale, libre de droits.
"""
import subprocess
from pathlib import Path

import numpy as np

SR = 44100
BPM = 112
BEAT = 60 / BPM
EIGHTH = BEAT / 2
BAR = BEAT * 4
BARS = 27  # ~58 s
SWING = 0.12  # retard des croches « et » (fraction de croche)
rng = np.random.default_rng(7)

total = int((BARS * BAR + 3) * SR)
L = np.zeros(total)
R = np.zeros(total)


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def place(sig, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= total:
        return
    sig = sig[: total - i] * gain
    L[i : i + len(sig)] += sig * np.sqrt(0.5 * (1 - pan))
    R[i : i + len(sig)] += sig * np.sqrt(0.5 * (1 + pan))


def eighth_time(bar, e):
    t = bar * BAR + e * EIGHTH
    if e % 2 == 1:
        t += SWING * EIGHTH
    return t


# ---------- Instruments ----------
_pluck_cache = {}


def pluck(note, dur=1.3, decay=0.995):
    """Corde pincée (Karplus-Strong) : son de ukulélé."""
    key = (note, dur)
    if key in _pluck_cache:
        return _pluck_cache[key]
    n = int(dur * SR)
    N = max(2, int(round(SR / midi(note))))
    buf = rng.uniform(-1, 1, N)
    buf = 0.5 * (buf + np.roll(buf, 1))  # attaque un peu adoucie
    out = np.empty(n)
    k = 0
    prev = buf
    while k < n:
        m = min(N, n - k)
        out[k : k + m] = prev[:m]
        prev = decay * 0.5 * (prev + np.roll(prev, 1))
        k += N
    env = np.minimum(1, np.linspace(0, dur, n) / 0.003) * np.exp(-np.linspace(0, dur, n) * 2.2)
    out = out * env
    _pluck_cache[key] = out
    return out


def glock(note, dur=1.2):
    t = np.arange(int(dur * SR)) / SR
    f = midi(note)
    s = (
        np.sin(2 * np.pi * f * t) * np.exp(-t * 3.5)
        + 0.35 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 9)
        + 0.15 * np.sin(2 * np.pi * f * 5.40 * t) * np.exp(-t * 16)
    )
    return s * np.minimum(1, t / 0.002)


def bass(note, dur):
    t = np.arange(int(dur * SR)) / SR
    f = midi(note)
    s = sum(np.sin(2 * np.pi * f * k * t) / k**1.4 for k in range(1, 7))
    env = np.minimum(1, t / 0.005) * np.exp(-t * 2.5) * np.minimum(1, (dur - t) / 0.02)
    return s * env


def kick():
    t = np.arange(int(0.35 * SR)) / SR
    f = 45 + 110 * np.exp(-t * 30)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 9) + 0.3 * np.exp(-t * 200) * rng.uniform(-1, 1, len(t))


def clap():
    t = np.arange(int(0.25 * SR)) / SR
    noise = rng.uniform(-1, 1, len(t))
    noise = noise - np.convolve(noise, np.ones(6) / 6, mode="same")  # plus brillant
    env = np.exp(-t * 22)
    for d in (0.0, 0.011, 0.022):  # petites « répétitions » typiques du clap
        env = env + 0.6 * np.exp(-np.maximum(0, t - d) * 140) * (t >= d)
    body = 0.4 * np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30)
    return (noise * env + body) * 0.6


def hat(open_=False):
    dur = 0.18 if open_ else 0.05
    t = np.arange(int(dur * SR)) / SR
    noise = rng.uniform(-1, 1, len(t))
    noise = noise - np.convolve(noise, np.ones(3) / 3, mode="same")
    return noise * np.exp(-t * (18 if open_ else 70))


# ---------- Composition ----------
# Do – Sol – Lam – Fa (ukulélé GCEA)
CHORDS = [
    {"uke": [67, 60, 64, 72], "root": 48},  # C
    {"uke": [67, 62, 67, 71], "root": 43},  # G
    {"uke": [69, 60, 64, 69], "root": 45},  # Am
    {"uke": [69, 60, 65, 69], "root": 41},  # F
]
# Grattage : (croche, sens, intensité)
STRUM = [(0, "d", 1.0), (2, "d", 0.8), (3, "u", 0.6), (5, "u", 0.6), (6, "d", 0.85), (7, "u", 0.55)]
# Mélodie glockenspiel sur 4 mesures : (croche, note) ; espacée pour laisser la voix
MELODY = [
    [(0, 88), (2, 91), (4, 93), (5, 91), (6, 88)],
    [(0, 86), (3, 83), (4, 86), (6, 79)],
    [(0, 84), (2, 88), (4, 93), (6, 91), (7, 88)],
    [(0, 89), (2, 88), (4, 86), (6, 84)],
]
MELODY_BARS = set(range(2, 6)) | set(range(10, 14)) | set(range(18, 22))

for bar in range(BARS):
    ch = CHORDS[bar % 4]
    last = bar == BARS - 1
    drums = 2 <= bar < BARS - 1

    # Ukulélé
    strums = [(0, "d", 1.0)] if last else STRUM
    for e, way, vel in strums:
        t0 = eighth_time(bar, e)
        strings = ch["uke"] if way == "d" else ch["uke"][::-1]
        for k, note in enumerate(strings):
            dur = 3.0 if last else 1.3
            place(pluck(note, dur), t0 + k * 0.012, 0.32 * vel, pan=-0.35)

    # Basse
    if bar >= 2 or last:
        r = ch["root"]
        pattern = [(0, r, 1.5), (3, r, 1), (4, r + 7, 1.5), (6, r + 12, 1)] if not last else [(0, r, 6)]
        for e, note, length in pattern:
            place(bass(note, length * EIGHTH * 0.95), eighth_time(bar, e), 0.30)

    # Batterie
    if drums:
        for e in (0, 4):
            place(kick(), eighth_time(bar, e), 0.75)
        if bar % 2 == 1:
            place(kick(), eighth_time(bar, 5), 0.45)
        for e in (2, 6):
            place(clap(), eighth_time(bar, e), 0.55, pan=0.05)
        for e in range(8):
            open_ = e == 7 and bar % 4 == 3
            place(hat(open_), eighth_time(bar, e), 0.16 if e % 2 else 0.22, pan=0.4)
    if last:
        place(kick(), eighth_time(bar, 0), 0.8)
        place(clap(), eighth_time(bar, 0), 0.5)

    # Glockenspiel
    if bar in MELODY_BARS or bar < 2:
        phrase = MELODY[bar % 4] if bar >= 2 else MELODY[bar % 4][:2]
        for e, note in phrase:
            place(glock(note), eighth_time(bar, e), 0.20, pan=0.4)
    if last:
        place(glock(84, 3.0), eighth_time(bar, 0), 0.22, pan=0.4)

# ---------- Mastering ----------
mix = np.stack([L, R], axis=1)
mix /= np.max(np.abs(mix))
mix = np.tanh(mix * 1.6) / np.tanh(1.6)  # légère compression
mix *= 0.89
end = int((BARS * BAR + 2.5) * SR)
mix = mix[:end]
fade = int(0.05 * SR)
mix[:fade] *= np.linspace(0, 1, fade)[:, None]

pcm = (mix * 32767).astype("<i2").tobytes()
out = Path(__file__).resolve().parent.parent / "public" / "music" / "musique.mp3"
subprocess.run(
    ["ffmpeg", "-v", "error", "-y", "-f", "s16le", "-ar", str(SR), "-ac", "2", "-i", "-",
     "-c:a", "libmp3lame", "-b:a", "192k", str(out)],
    input=pcm, check=True,
)
print(f"{out} ({len(mix) / SR:.1f} s, {BPM} BPM)")
