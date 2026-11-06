"""
Génère la musique de fond originale → public/music/musique.mp3

Un seul thème lo-fi / chill (style storytime TikTok / Reels / Shorts) :
piano électrique doux, basse ronde, batterie feutrée, petit motif en
pizzicato et grain de vinyle. Le même thème de 4 mesures tourne sur
toute la vidéo puis se pose sur un accord final.
Uniquement numpy + ffmpeg ; composition originale, libre de droits.

    python3 scripts/generate-music.py
"""
import subprocess
from pathlib import Path

import numpy as np

SR = 44100
# Durée de l'épisode en vitesse normale (EPISODE_FRAMES / 24 dans src/timeline.ts).
EPISODE = 42.6
DURATION = EPISODE + 1.0
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


# ---------------- Instruments lo-fi ----------------


def epiano(note, dur=2.5):
    """Piano électrique doux (synthèse FM), légère modulation."""
    t = tt(dur)
    f = midi(note)
    index = 2.4 * np.exp(-t * 2)  # plus brillant : passe sur un haut-parleur de téléphone
    s = np.sin(2 * np.pi * f * t + index * np.sin(2 * np.pi * f * t))
    s += 0.3 * np.sin(4 * np.pi * f * t) * np.exp(-t * 1.5)
    s += 0.15 * np.sin(2 * np.pi * f * 14 * t) * np.exp(-t * 30)  # petit « tine »
    trem = 1 + 0.08 * np.sin(2 * np.pi * 4.5 * t)
    return s * trem * attack(t, 0.006) * np.exp(-t * 0.7) * release(t, dur, 0.15)


def pad(note, dur):
    """Nappe douce et continue (fondu lent) : comble tous les silences."""
    t = tt(dur)
    f = midi(note)
    s = sum(np.sin(2 * np.pi * f * k * t * (1 + 0.002 * (k - 2))) / k**1.5 for k in range(1, 5))
    return s * attack(t, 0.5) * release(t, dur, 0.6)


def soft_bass(note, dur):
    t = tt(dur)
    f = midi(note)
    # Harmoniques renforcées : la basse reste audible sur un petit haut-parleur.
    s = np.sin(2 * np.pi * f * t) + 0.5 * np.sin(4 * np.pi * f * t) + 0.25 * np.sin(6 * np.pi * f * t)
    return s * attack(t, 0.02) * np.exp(-t * 0.8) * release(t, dur, 0.08)


def lofi_kick():
    t = tt(0.35)
    f = 42 + 70 * np.exp(-t * 28)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)


def rim():
    t = tt(0.12)
    n = rng.uniform(-1, 1, len(t))
    n = np.convolve(n, np.ones(8) / 8, mode="same")  # feutré
    return (0.7 * n + 0.5 * np.sin(2 * np.pi * 420 * t)) * np.exp(-t * 35)


def soft_hat():
    t = tt(0.05)
    n = rng.uniform(-1, 1, len(t))
    n = n - np.convolve(n, np.ones(3) / 3, mode="same")
    return n * np.exp(-t * 80)


# ---------------- Composition : un seul thème lo-fi ----------------
BPM = 88
BEAT = 60 / BPM
E8 = BEAT / 2
BAR = 4 * BEAT
SWING = 0.16  # croches légèrement « traînées »

# Rém9 – Sol13 – Domaj9 – Lam7 : doux, un brin nostalgique.
CHORDS = [
    (38, [65, 69, 72, 76]),
    (43, [65, 69, 71, 76]),
    (36, [64, 67, 71, 74]),
    (45, [64, 67, 72]),
]
# Petit motif en pizzicato (croche, note) : le « sourire » du morceau.
MOTIF = [
    [(2, 69), (3, 72), (5, 74)],
    [(0, 76), (3, 74), (6, 71)],
    [(2, 67), (3, 71), (5, 72), (7, 74)],
    [(0, 76), (4, 72), (6, 69)],
]


def at(b0, e):
    return b0 + e * E8 + (SWING * E8 if e % 2 else 0)


def bar_music(b0, i, drums, motif):
    root, chord = CHORDS[i % 4]
    for k, n in enumerate(chord):
        place(epiano(n, BAR * 1.25), b0 + k * 0.012, 0.13, -0.2 + 0.13 * k)  # déborde sur la mesure suivante
        place(pad(n, BAR + 0.6), b0 - 0.3, 0.045, -0.3 + 0.2 * k)  # nappe continue (médiums)
    for n in chord[1:3]:
        place(epiano(n + 12, 0.6), at(b0, 3), 0.05, 0.3)  # petite relance sur « 2-et »
    place(soft_bass(root, BEAT * 2.6), b0, 0.5)
    place(soft_bass(root + 7, BEAT * 1.6), at(b0, 5), 0.32)
    if drums:
        place(lofi_kick(), at(b0, 0), 0.55)
        place(lofi_kick(), at(b0, 5), 0.4)
        for e in (2, 6):
            place(rim(), at(b0, e), 0.38, 0.1)
        for e in range(8):
            place(soft_hat(), at(b0, e), 0.05 if e % 2 else 0.08, 0.45)
    if motif:
        for e, n in MOTIF[i % 4]:
            place(pizz(n, 0.5), at(b0, e), 0.32, 0.25)


t = 0.0
# Dernière mesure complète avant l'accord final (tenu ~2,5 s jusqu'à la fin).
FINAL_BAR = int((EPISODE - 2.6 - t) // BAR)
for i in range(FINAL_BAR):
    bar_music(t, i, drums=True, motif=True)  # tout démarre dès la 1re seconde
    t += BAR
# Accord final tenu (Domaj9) jusqu'à la fin de la vidéo.
for k, n in enumerate([64, 67, 71, 74, 79]):
    place(epiano(n, 3.0), t + k * 0.03, 0.13)
    place(pad(n, DURATION - t + 0.3), t - 0.3, 0.05)
place(soft_bass(36, 3.0), t, 0.5)
place(pizz(74, 0.8), t + 0.4, 0.2, 0.25)

# Grain de vinyle : petits craquements discrets.
for _ in range(int(DURATION * 9)):
    pos = rng.uniform(0, DURATION - 0.01)
    click = rng.uniform(-1, 1, 30) * np.exp(-np.arange(30) / 6)
    place(click, pos, rng.uniform(0.01, 0.04), rng.uniform(-0.6, 0.6))

# ---------------- Mastering ----------------
mix = np.stack([L, R], axis=1)
mix /= np.max(np.abs(mix))
mix = np.tanh(mix * 1.2) / np.tanh(1.2)
mix *= 0.89
pcm = (mix * 32767).astype("<i2").tobytes()
out = Path(__file__).resolve().parent.parent / "public" / "music" / "musique.mp3"
subprocess.run(
    ["ffmpeg", "-v", "error", "-y", "-f", "s16le", "-ar", str(SR), "-ac", "2", "-i", "-",
     "-c:a", "libmp3lame", "-b:a", "192k", str(out)],
    input=pcm, check=True,
)
print(f"{out} ({len(mix) / SR:.1f} s)")
