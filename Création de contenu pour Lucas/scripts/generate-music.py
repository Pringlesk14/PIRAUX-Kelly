"""
Génère la musique de fond originale → public/music/musique.mp3

Style « comédie / storytime » des vidéos TikTok, Reels et YouTube Shorts :
pizzicato espiègle, basson, marimba, clarinette + effets qui suivent
l'histoire (scratch de disque, tic-tac de panique, trombone triste).

La musique est découpée en sections calées sur la timeline de l'épisode
(voir SECTIONS). Uniquement numpy + ffmpeg ; composition originale.

    python3 scripts/generate-music.py
"""
import subprocess
from pathlib import Path

import numpy as np

SR = 44100
BEAT = 0.5  # 120 BPM
E8 = BEAT / 2
E16 = BEAT / 4
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
    key = ("pizz", note, dur)
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


def string_stac(note, dur=0.12):
    t = tt(dur)
    f = midi(note)
    s = sum(np.sin(2 * np.pi * f * k * t) / k for k in range(1, 12))
    return s * attack(t, 0.004) * np.exp(-t * 14) * release(t, dur, 0.02)


def tremolo(notes, dur, start_gain=0.2, end_gain=1.0):
    t = tt(dur)
    s = sum(
        sum(np.sin(2 * np.pi * midi(n) * k * t + k) / k for k in range(1, 9)) for n in notes
    )
    am = 0.6 + 0.4 * np.sin(2 * np.pi * 11 * t)
    cresc = np.linspace(start_gain, end_gain, len(t))
    return s * am * cresc * attack(t, 0.1) * release(t, dur, 0.1)


def tick(high=True):
    t = tt(0.06)
    f = 2600 if high else 1900
    return (np.sin(2 * np.pi * f * t) + 0.5 * rng.uniform(-1, 1, len(t))) * np.exp(-t * 90)


def boom():
    t = tt(1.4)
    f = 32 + 60 * np.exp(-t * 12)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 2.8) + 0.4 * rng.uniform(-1, 1, len(t)) * np.exp(-t * 25)


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


def clap():
    t = tt(0.2)
    n = rng.uniform(-1, 1, len(t))
    n = n - np.convolve(n, np.ones(6) / 6, mode="same")
    env = np.exp(-t * 24)
    for d in (0.0, 0.01, 0.02):
        env = env + 0.6 * np.exp(-np.maximum(0, t - d) * 150) * (t >= d)
    return n * env * 0.6


def scratch():
    """Scratch de disque (« rrrip ») : l'histoire déraille."""
    dur = 0.42
    t = tt(dur)
    f = np.where(t < 0.16, 300 + 900 * (t / 0.16), 1200 * np.exp(-(t - 0.16) * 9) + 80)
    ph = 2 * np.pi * np.cumsum(f) / SR
    saw = 2 * ((ph / (2 * np.pi)) % 1) - 1
    noise = rng.uniform(-1, 1, len(t))
    s = 0.6 * saw + 0.5 * noise * (0.5 + 0.5 * np.sin(ph * 0.5))
    return s * attack(t, 0.005) * release(t, dur, 0.06)


def trombone_note(note, dur, bend=0.0, vib=0.0):
    """Trombone avec effet « wah » (brillance qui s'ouvre puis se ferme)."""
    t = tt(dur)
    f = midi(note) * 2 ** (bend * np.minimum(1, t / dur) / 12)
    f = f * (1 + vib * np.sin(2 * np.pi * 6 * t) * np.minimum(1, t / 0.3))
    ph = 2 * np.pi * np.cumsum(f) / SR
    bright = np.sin(np.pi * np.minimum(1, t / min(dur, 0.45))) * 0.8 + 0.2
    s = sum(np.sin(k * ph) * (1 / k) ** (2.6 - 1.6 * bright) for k in range(1, 12))
    return s * attack(t, 0.04) * release(t, dur, 0.12)


def riser(dur):
    t = tt(dur)
    n = rng.uniform(-1, 1, len(t))
    n = n - np.convolve(n, np.ones(4) / 4, mode="same")
    return n * (t / dur) ** 2.2


# ---------------- Sections (temps de l'épisode, en s) ----------------
# Épisode : 6 clips de 10 s, fondus de 16 images à 24 i/s → un clip tous les 9,333 s.


def happy_plan(t0, bars=5):
    """Scène 1 : le plan parfait, insouciant (Do majeur) — coupé par le scratch."""
    chords = [(48, [64, 67, 72]), (45, [64, 69, 72]), (41, [65, 69, 72]), (43, [62, 67, 71])]
    melody = [
        [(0, 76), (1, 79), (2, 84), (4, 79), (6, 76)],
        [(0, 76), (2, 74), (3, 72), (4, 69), (6, 72)],
        [(0, 77), (1, 76), (2, 77), (4, 81), (6, 79)],
        [(0, 74), (2, 79), (4, 77), (5, 76), (6, 74)],
    ]
    for bar in range(bars):
        b0 = t0 + bar * 4 * BEAT
        root, triad = chords[bar % 4]
        for beat in range(4):
            note = root if beat % 2 == 0 else root + 7
            place(pizz(note, 0.5), b0 + beat * BEAT, 0.55, -0.2)
            for n in triad:
                place(pizz(n, 0.3), b0 + beat * BEAT + E8, 0.16, 0.2)
        for e, n in melody[bar % 4]:
            place(marimba(n), b0 + e * E8, 0.42, 0.25)
        for e in range(8):
            place(shaker(), b0 + e * E8, 0.07 if e % 2 else 0.1, 0.5)


def sneaky(t0, bars=4):
    """Scène 2 : jeux, vidéos, grasses mat' en douce (Ré mineur, pizzicato sneaky)."""
    walk = [50, None, 53, None, 57, None, 56, 57]
    walk2 = [50, None, 53, None, 57, None, 58, 57]
    tip = [[(0, 69), (2, 70), (3, 69), (4, 68), (5, 69)], [(0, 74), (2, 73), (3, 74)]]
    for bar in range(bars):
        b0 = t0 + bar * 4 * BEAT
        for e, n in enumerate(walk if bar % 2 == 0 else walk2):
            if n is not None:
                place(pizz(n, 0.35), b0 + e * E8, 0.6, -0.15)
        place(bassoon(38, 0.22), b0, 0.32)
        place(bassoon(38, 0.22), b0 + 2 * BEAT, 0.28)
        for beat in (1, 3):
            place(snap(), b0 + beat * BEAT, 0.35, 0.3)
        if bar >= 1:
            for e, n in tip[bar % 2]:
                place(clarinet(n, 0.16), b0 + e * E8, 0.22, 0.3)
    end = t0 + bars * 4 * BEAT
    place(pizz(62, 0.5), end, 0.5)
    place(pizz(50, 0.6), end + E8, 0.6)


def panic(t_tick, t_hit, t_end):
    """Scène 3 : tic-tac, BOOM sur « panique », cordes qui montent en tension."""
    # Nappe de suspense sous le tic-tac.
    place(tremolo([45, 52], t_hit - t_tick + 0.3, 0.4, 1.0), t_tick, 0.12)
    t = t_tick
    k = 0
    while t < t_hit - 0.05:
        place(tick(k % 2 == 0), t, 0.5, 0.4)
        t += BEAT
        k += 1
    place(boom(), t_hit, 0.9)
    for n in (45, 57, 60, 64):
        place(string_stac(n, 0.5), t_hit, 0.18)
    ostinato = [57, 57, 60, 57, 64, 57, 60, 57]
    t = t_hit + BEAT
    step = 0
    bar = 0
    while t < t_end - E16:
        shift = min(bar // 2, 4)
        n = ostinato[step % 8] + shift
        place(string_stac(n, 0.11), t, 0.2, -0.2 + 0.4 * (step % 2))
        if step % 2 == 0:
            place(tick(step % 4 == 0), t, 0.28, 0.4)
        if step % 16 == 0:
            place(boom()[: int(0.5 * SR)], t, 0.35)
            bar += 1
        t += E16
        step += 1
    dur = t_end - t_hit - BEAT
    place(tremolo([45, 52], dur, 0.05, 0.6), t_hit + BEAT, 0.05)
    place(riser(1.2), t_end - 1.2, 0.12)


def lazy_irony(t0, t_end):
    """Scène 4 : « je pensais m'amuser… » ; tuba paresseux, un peu dégonflé."""
    pattern = [(48, 55), (45, 52), (41, 48), (43, 50)]
    bar = 0
    while t0 + bar * 4 * BEAT < t_end - 0.3:
        b0 = t0 + bar * 4 * BEAT
        a, b = pattern[bar % 4]
        if b0 + 4 * BEAT > t_end:  # dernière mesure incomplète : juste un « pouet »
            place(tuba(a, t_end - b0), b0, 0.3)
            break
        place(tuba(a, 0.9), b0, 0.3)
        place(tuba(b, 0.9), b0 + 2 * BEAT, 0.26)
        for beat in (1, 3):
            place(pizz(a + 24, 0.3), b0 + beat * BEAT, 0.2, 0.25)
            place(pizz(a + 28, 0.3), b0 + beat * BEAT + 0.02, 0.15, 0.25)
        bar += 1


def sad_trombone(t0):
    """« Quelle organisation ! » → wah wah wah waaah."""
    notes = [(62, 0.42), (61, 0.42), (60, 0.42)]
    t = t0
    for n, d in notes:
        place(trombone_note(n, d), t, 0.38)
        t += d + 0.05
    place(trombone_note(59, 1.5, bend=-0.6, vib=0.012), t, 0.4)


def rebound(t0, bars, cta_at):
    """Scènes 5-6 : ça repart ! Groove comique et joyeux (Fa majeur) jusqu'au « ta-da »."""
    chords = [(41, [65, 69, 72]), (48, [64, 67, 72]), (50, [62, 65, 69]), (46, [62, 65, 70])]
    melody = [
        [(0, 72), (1, 74), (2, 77), (4, 81), (5, 79), (6, 77)],
        [(0, 76), (2, 72), (4, 74), (6, 76)],
        [(0, 77), (1, 76), (2, 74), (4, 77), (6, 81)],
        [(0, 79), (2, 77), (3, 74), (4, 72)],
    ]
    for bar in range(bars):
        b0 = t0 + bar * 4 * BEAT
        root, triad = chords[bar % 4]
        full = b0 >= cta_at - 0.01
        for beat in range(4):
            place(pizz(root if beat % 2 == 0 else root + 7, 0.45), b0 + beat * BEAT, 0.55, -0.2)
            for n in triad:
                place(marimba(n, 0.4), b0 + beat * BEAT + E8, 0.12, 0.2)
        if bar % 2 == 1 or full:
            for e, n in melody[bar % 4]:
                place(clarinet(n, 0.2), b0 + e * E8, 0.2, 0.3)
        place(kick(), b0, 0.6)
        place(kick(), b0 + 2 * BEAT, 0.5)
        for beat in (1, 3):
            place(clap(), b0 + beat * BEAT, 0.45 if full else 0.3)
        for e in range(8):
            place(shaker(), b0 + e * E8, 0.08, 0.5)
        if full:
            for e, n in melody[bar % 4]:
                place(glock(n + 12), b0 + e * E8, 0.1, 0.4)
    end = t0 + bars * 4 * BEAT
    # « Ta-da ! »
    for n in (65, 72):
        place(marimba(n, 0.3), end, 0.35)
    place(kick(), end + 0.3, 0.6)
    for n in (53, 65, 69, 72, 77):
        place(marimba(n, 2.0), end + 0.3, 0.3)
        place(pizz(n - 12, 1.0), end + 0.3, 0.3)
    place(glock(89, 2.0), end + 0.3, 0.15, 0.4)
    # Accord tenu jusqu'à la toute fin de la vidéo.
    place(tuba(41, 1.9), end + 0.3, 0.25)
    place(clarinet(77, 1.8), end + 0.3, 0.12, 0.3)
    place(clarinet(72, 1.8), end + 0.3, 0.1, -0.3)
    place(clap(), end + 0.3, 0.4)


CLIP = 9.3333  # décalage d'un clip à l'autre dans l'épisode
happy_plan(0.15)
# Le scratch coupe net la musique joyeuse, juste avant « Sauf que voilà ».
SCRATCH = CLIP + 0.75
cut = int((SCRATCH + 0.03) * SR)
ramp = np.linspace(1, 0, int(0.03 * SR))
L[cut - len(ramp) : cut] *= ramp
R[cut - len(ramp) : cut] *= ramp
L[cut:] = 0
R[cut:] = 0
place(scratch(), SCRATCH, 0.55)
sneaky(CLIP + 1.25, bars=4)
panic(t_tick=2 * CLIP + 0.55, t_hit=2 * CLIP + 2.42, t_end=3 * CLIP - 0.2)
lazy_irony(3 * CLIP - 0.15, 3 * CLIP + 8.25)
sad_trombone(3 * CLIP + 8.25)
rebound(4 * CLIP + 1.3, bars=8, cta_at=5 * CLIP + 1.3)

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
