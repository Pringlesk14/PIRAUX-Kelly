"""
Génère la musique de fond originale → public/music/musique.mp3

Un seul thème comique « quirky » (style storytime TikTok / Reels / Shorts) :
pizzicato, clarinette, basson, marimba. Le même thème de 8 mesures tourne
sur toute la vidéo et s'enrichit un peu à chaque passage.
Uniquement numpy + ffmpeg ; composition originale, libre de droits.

    python3 scripts/generate-music.py
"""
import subprocess
from pathlib import Path

import numpy as np

SR = 44100
BEAT = 0.5  # 120 BPM
E8 = BEAT / 2
BAR = 4 * BEAT  # 2 s
DURATION = 57.5
rng = np.random.default_rng(11)

total = int(DURATION * SR)
L = np.zeros(total)
R = np.zeros(total)


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def place(sig, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= total or i < 0:
        return
    sig = sig[: total - i] * gain
    L[i : i + len(sig)] += sig * np.sqrt(0.5 * (1 - pan))
    R[i : i + len(sig)] += sig * np.sqrt(0.5 * (1 + pan))


def tt(dur):
    return np.arange(int(dur * SR)) / SR


def attack(t, a):
    return np.minimum(1, t / a)


def release(t, dur, r):
    return np.clip((dur - t) / r, 0, 1)


# ---------------- Instruments ----------------
_cache = {}


def pizz(note, dur=0.45):
    """Cordes pincées (Karplus-Strong court)."""
    key = (note, dur)
    if key in _cache:
        return _cache[key]
    n = int(dur * SR)
    N = max(2, int(round(SR / midi(note))))
    prev = rng.uniform(-1, 1, N)
    prev = 0.5 * (prev + np.roll(prev, 1))
    out = np.empty(n)
    k = 0
    while k < n:
        m = min(N, n - k)
        out[k : k + m] = prev[:m]
        prev = 0.985 * 0.5 * (prev + np.roll(prev, 1))
        k += N
    t = tt(dur)[:n]
    out *= attack(t, 0.002) * np.exp(-t * 7)
    _cache[key] = out
    return out


def marimba(note, dur=0.8):
    t = tt(dur)
    f = midi(note)
    s = np.sin(2 * np.pi * f * t) * np.exp(-t * 5) + 0.3 * np.sin(2 * np.pi * f * 3.93 * t) * np.exp(-t * 22)
    return s * attack(t, 0.002)


def glock(note, dur=1.0):
    t = tt(dur)
    f = midi(note)
    s = np.sin(2 * np.pi * f * t) * np.exp(-t * 3.5) + 0.35 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 9)
    return s * attack(t, 0.002)


def reed(note, dur, harmonics, vib=0.0, att=0.015):
    """Instrument à vent (basson, tuba, clarinette) par synthèse additive."""
    t = tt(dur)
    f = midi(note) * (1 + vib * np.sin(2 * np.pi * 5.2 * t) * np.minimum(1, t / 0.25))
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = sum(a * np.sin(k * ph) for k, a in harmonics)
    return s * attack(t, att) * release(t, dur, 0.04)


BASSOON = [(1, 1), (2, 0.9), (3, 0.6), (4, 0.45), (5, 0.3), (6, 0.2), (7, 0.12)]
TUBA = [(1, 1), (2, 0.55), (3, 0.3), (4, 0.15)]
CLARINET = [(1, 1), (3, 0.5), (5, 0.28), (7, 0.14), (9, 0.07)]


def bassoon(note, dur):
    return reed(note, dur, BASSOON) * np.exp(-tt(dur) * 3)


def tuba(note, dur):
    return reed(note, dur, TUBA, att=0.03)


def clarinet(note, dur):
    return reed(note, dur, CLARINET, vib=0.004, att=0.03)


def snap():
    t = tt(0.08)
    n = rng.uniform(-1, 1, len(t))
    n = n - np.convolve(n, np.ones(4) / 4, mode="same")
    return (n + 0.4 * np.sin(2 * np.pi * 2100 * t)) * np.exp(-t * 70)


def shaker():
    t = tt(0.07)
    n = rng.uniform(-1, 1, len(t))
    n = n - np.convolve(n, np.ones(3) / 3, mode="same")
    return n * np.sin(np.pi * t / 0.07)


def kick():
    t = tt(0.3)
    f = 48 + 100 * np.exp(-t * 32)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 10)


# ---------------- Composition : un seul thème ----------------
# Accords par demi-mesure : (fondamentale basse, triade)
C = (48, [64, 67, 72])
F = (41, [65, 69, 72])
DM = (50, [62, 65, 69])
G = (43, [62, 67, 71])
A7 = (45, [61, 64, 67])
HARMONY = [(C, C), (C, C), (F, F), (C, C), (DM, DM), (G, G), (C, A7), (DM, G)]

# Mélodie (croche, note MIDI) : joueuse, staccato, quelques chromatismes.
THEME = [
    [(0, 67), (1, 72), (2, 71), (3, 72), (4, 74), (6, 76)],
    [(0, 79), (2, 76), (3, 75), (4, 76), (6, 72)],
    [(0, 77), (1, 76), (2, 77), (3, 81), (4, 79), (6, 77)],
    [(0, 76), (2, 72), (4, 67), (6, 72)],
    [(0, 74), (1, 73), (2, 74), (3, 77), (4, 81), (6, 77)],
    [(0, 79), (2, 71), (3, 72), (4, 74), (6, 79)],
    [(0, 76), (1, 75), (2, 76), (4, 73), (5, 76), (6, 79)],
    [(0, 77), (2, 74), (4, 71), (6, 67)],
]


def accompaniment(b0, bar_idx, level):
    """Oom-pah en pizzicato + accords sur les contretemps (+ percussions)."""
    first, second = HARMONY[bar_idx % 8]
    for beat in range(4):
        root, triad = first if beat < 2 else second
        bass = root if beat % 2 == 0 else root + 7
        place(pizz(bass, 0.45), b0 + beat * BEAT, 0.55, -0.2)
        for n in triad:
            place(pizz(n, 0.3), b0 + beat * BEAT + E8, 0.14, 0.2)
    if level >= 1:
        for e in range(8):
            place(shaker(), b0 + e * E8, 0.06 if e % 2 else 0.09, 0.5)
    if level >= 2:
        for beat in (1, 3):
            place(snap(), b0 + beat * BEAT, 0.3, 0.3)
    if level >= 3:
        place(kick(), b0, 0.45)
        place(kick(), b0 + 2 * BEAT, 0.38)


def melody(b0, bar_idx, level):
    for e, n in THEME[bar_idx % 8]:
        t = b0 + e * E8
        place(clarinet(n, 0.17), t, 0.24, 0.25)
        place(bassoon(n - 12, 0.17), t, 0.12, -0.25)  # doublure comique à l'octave
        if level >= 2:
            place(marimba(n + 12, 0.5), t, 0.16, 0.35)
        if level >= 3 and e in (0, 4):
            place(glock(n + 12, 0.8), t, 0.07, 0.4)


FINAL = 55.3  # « ta-da ! » juste avant la fin de la vidéo (56,7 s)

t = 0.1
# Intro : 2 mesures d'accompagnement seul.
for i in range(2):
    accompaniment(t, i, 0)
    t += BAR
# Le thème, 3 fois, de plus en plus garni.
for level in (1, 2, 3):
    for i in range(8):
        accompaniment(t, i, level)
        melody(t, i, level)
        t += BAR
# Début d'un 4e passage jusqu'au final.
i = 0
while t + BAR <= FINAL + 0.01:
    accompaniment(t, i, 3)
    melody(t, i, 3)
    t += BAR
    i += 1
# Remplit le reste de la mesure avec l'accompagnement, coupé au final.
accompaniment(t, i, 1)
cut = int((FINAL - 0.3) * SR)
L[cut:] *= 0
R[cut:] *= 0

# « Ta-da ! » sur Do majeur, tenu jusqu'à la fin.
for n in (67, 72):
    place(marimba(n, 0.3), FINAL - 0.28, 0.3)
place(kick(), FINAL, 0.6)
for n in (48, 60, 64, 67, 72):
    place(marimba(n, 2.0), FINAL, 0.28)
    place(pizz(n, 1.0), FINAL, 0.25)
place(tuba(36, 2.0), FINAL, 0.25)
place(clarinet(72, 1.9), FINAL, 0.12, 0.3)
place(clarinet(76, 1.9), FINAL, 0.1, -0.3)

# ---------------- Mastering ----------------
mix = np.stack([L, R], axis=1)
mix /= np.max(np.abs(mix))
mix = np.tanh(mix * 1.8) / np.tanh(1.8)
mix *= 0.89
pcm = (mix * 32767).astype("<i2").tobytes()
out = Path(__file__).resolve().parent.parent / "public" / "music" / "musique.mp3"
subprocess.run(
    ["ffmpeg", "-v", "error", "-y", "-f", "s16le", "-ar", str(SR), "-ac", "2", "-i", "-",
     "-c:a", "libmp3lame", "-b:a", "192k", str(out)],
    input=pcm, check=True,
)
print(f"{out} ({len(mix) / SR:.1f} s)")
