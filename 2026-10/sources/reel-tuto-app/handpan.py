"""Musique de fond originale façon handpan, rythmée avec une batterie douce (la majeur, 96 BPM).

Synthèse en Python pur -> handpan-dry.raw (float32 stéréo 44,1 kHz) et ir.raw (réverbe).
Usage : python3 handpan.py <durée_en_secondes> [<début_coupure> <fin_coupure>]
Structure : intro, groove (avec coupure optionnelle), fin.
"""
import array, math, random, sys

SR = 44100
DUR = float(sys.argv[1]) if len(sys.argv) > 1 else 86.5
BPM = 96
S16 = 60 / BPM / 4                     # double croche
BAR = 16 * S16                         # 2,5 s
rnd = random.Random(1111)

NOTE = {'D3': 146.83, 'E3': 164.81, 'F#3': 185.00, 'A3': 220.00, 'B3': 246.94, 'C#4': 277.18, 'D4': 293.66,
        'E4': 329.63, 'F#4': 369.99, 'G#4': 415.30, 'A4': 440.00, 'B4': 493.88, 'C#5': 554.37, 'E5': 659.26}


def handpan_tone(f, dec=1.9):
    n = int(SR * (dec + 0.8))
    out = [0.0] * n
    for mult, amp, d in [(1.0, 1.0, dec), (2.003, 0.45, dec * 0.65), (2.997, 0.2, dec * 0.35), (4.01, 0.06, 0.25)]:
        w = 2 * math.pi * f * mult / SR
        k = math.exp(-1 / (d * SR))
        env, ph = amp, rnd.random() * 0.3
        for i in range(n):
            out[i] += env * math.sin(w * i + ph)
            env *= k
    att = int(0.004 * SR)
    for i in range(att):
        out[i] *= i / att
    lp = 0.0
    for i in range(int(0.015 * SR)):                     # « toc » du doigt
        lp += 0.2 * ((rnd.random() * 2 - 1) - lp)
        out[i] += lp * 0.3 * (1 - i / (0.015 * SR))
    fade = int(0.2 * SR)
    for i in range(fade):
        out[n - fade + i] *= 1 - i / fade
    return out


def soft_kick():
    """Grosse caisse feutrée : sinus grave rond, sans clic d'attaque."""
    n = int(0.3 * SR); out = []; ph = 0.0
    for i in range(n):
        t = i / SR
        ph += 2 * math.pi * (52 + 38 * math.exp(-t / 0.04)) / SR
        out.append(math.sin(ph) * min(1, t / 0.003) * math.exp(-t / 0.11))
    return out


def brush():
    """Caisse claire aux balais : souffle filtré + un peu de corps."""
    n = int(0.22 * SR); out = []; lo = hi = 0.0
    for i in range(n):
        t = i / SR
        x = rnd.random() * 2 - 1
        lo += 0.3 * (x - lo); hi += 0.03 * (lo - hi)      # passe-bande doux ≈ 300 Hz – 3 kHz
        env = min(1, t / 0.006) * math.exp(-t / 0.07)
        out.append((lo - hi) * 1.6 * env + 0.25 * math.sin(2 * math.pi * 185 * t) * math.exp(-t / 0.04))
    return out


def hihat():
    """Charleston fermé, léger : bruit aigu très court."""
    n = int(0.06 * SR); out = []; lp = 0.0
    for i in range(n):
        t = i / SR
        x = rnd.random() * 2 - 1
        lp += 0.75 * (x - lp)
        out.append((x - lp) * min(1, t / 0.002) * math.exp(-t / 0.018))
    return out


TONES = {k: handpan_tone(f, 2.4 if f < 200 else 1.9) for k, f in NOTE.items()}
KICK, BRUSH, HAT = soft_kick(), brush(), hihat()
L = [0.0] * int(SR * (DUR + 3.5))
R = [0.0] * len(L)


def add(t, smp, vel, pan, jitter=0.006):
    gl, gr = vel * math.cos(pan * math.pi / 2), vel * math.sin(pan * math.pi / 2)
    s = int((t + rnd.uniform(-jitter, jitter)) * SR)
    end = min(len(L), s + len(smp))
    for j in range(max(0, s), end):
        v = smp[j - s]
        L[j] += v * gl
        R[j] += v * gr


def hit(t, note, vel):
    pan = min(0.85, max(0.15, 0.5 + 0.35 * math.log2(NOTE[note] / 300) + rnd.uniform(-0.05, 0.05)))
    add(t, TONES[note], vel, pan)


# accords (basse, notes de l'accord du grave à l'aigu) : A – F#m – D – E, un par mesure
CHORDS = [('A3', ['A3', 'C#4', 'E4', 'A4', 'C#5', 'E5']),
          ('F#3', ['F#4', 'A3', 'C#4', 'A4', 'C#5', 'E5']),
          ('D3', ['A3', 'D4', 'F#4', 'A4', 'B4', 'C#5']),
          ('E3', ['B3', 'E4', 'G#4', 'B4', 'C#5', 'E5'])]
# motif mélodique syncopé (3+3+2) : (pas de double croche, indice dans l'accord)
MOTIF_A = [(0, 2), (3, 3), (6, 4), (8, 3), (10, 2), (13, 1)]
MOTIF_B = [(0, 3), (3, 4), (6, 5), (8, 4), (11, 3), (14, 2)]
KICKS = [(0, 1.0), (6, 0.55), (8, 0.85), (11, 0.5)]

nbars = int(DUR // BAR)
# coupure optionnelle : python3 handpan.py <durée> <début_s> <fin_s>
BREAK = (int(float(sys.argv[2]) // BAR), int(float(sys.argv[3]) // BAR)) if len(sys.argv) > 3 else (-1, -1)
OUTRO = nbars - 1
for b in range(nbars):
    t0 = b * BAR
    bass, tones = CHORDS[b % 4]
    intro, brk, outro = b < 2, BREAK[0] <= b < BREAK[1], b >= OUTRO
    groove = not (intro or brk or outro)
    # basse
    hit(t0, bass, 0.9)
    if groove:
        hit(t0 + 10 * S16, bass, 0.55)
    # mélodie
    motif = MOTIF_B if (b // 2) % 2 else MOTIF_A
    for step, idx in motif:
        if (intro or brk) and step % 4:
            continue
        if outro and step > 8:
            continue
        if groove and rnd.random() < 0.12:
            idx = max(0, min(5, idx + rnd.choice((-1, 1))))
        hit(t0 + step * S16, tones[idx], (0.6 if step % 4 == 0 else 0.48) * rnd.uniform(0.9, 1.05))
    if groove and b >= 4 and rnd.random() < 0.5:        # petite réponse aiguë en fin de mesure
        hit(t0 + 15 * S16, tones[5], 0.3)
    # batterie douce
    if outro:
        continue
    for st in range(0, 16, 2):                            # charleston en croches
        v = 0.3 if st % 4 == 2 else 0.2
        if intro:
            v *= (b * 16 + st) / 32                      # entre progressivement
        add(t0 + st * S16, HAT, v * (0.6 if brk else 1), 0.65, 0.004)
    if groove:
        if rnd.random() < 0.5:                            # double croche fantôme
            add(t0 + rnd.choice((7, 15)) * S16, HAT, 0.1, 0.65)
        add(t0, KICK, 0.85, 0.5, 0.002)
        add(t0 + 8 * S16, KICK, 0.65, 0.5, 0.002)
        if b % 2:
            add(t0 + 11 * S16, KICK, 0.4, 0.5, 0.002)
        for st in (4, 12):
            add(t0 + st * S16, BRUSH, 0.45, 0.42)
        if rnd.random() < 0.35:
            add(t0 + 15 * S16, BRUSH, 0.12, 0.42)
    if b == 1 or b == BREAK[1] - 1:                       # petit roulement aux balais avant le groove
        for st in (12, 13, 14, 15):
            add(t0 + st * S16, BRUSH, 0.15 + 0.07 * (st - 12), 0.42)

# fin : accord de la qui résonne
tend = nbars * BAR
hit(tend, 'A3', 0.8)
for i, n in enumerate(['E4', 'A4', 'C#5', 'E5']):
    hit(tend + 0.06 * (i + 1), n, 0.5)

peak = max(max(abs(v) for v in L), max(abs(v) for v in R))
st = array.array('f')
for a, b in zip(L, R):
    st.append(a / peak * 0.8)
    st.append(b / peak * 0.8)
open('handpan-dry.raw', 'wb').write(st.tobytes())

ir = array.array('f')
la = lb = 0.0
for i in range(int(SR * 2.0)):
    e = math.exp(-i / (SR * 0.4))
    la += 0.35 * ((rnd.random() * 2 - 1) - la)
    lb += 0.35 * ((rnd.random() * 2 - 1) - lb)
    ir.append(la * e)
    ir.append(lb * e)
open('ir.raw', 'wb').write(ir.tobytes())
print(f"{nbars} mesures de {BAR:.2f} s à {BPM} BPM, coupure mesures {BREAK[0]}–{BREAK[1] - 1}")
