#!/usr/bin/env bash
# Génère la musique handpan (calée sur la durée du reel) et l'ajoute à la vidéo.
set -euo pipefail
cd "$(dirname "$0")"
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 video-muette.mp4)
python3 handpan.py "$D"
FO=$(python3 -c "print(round($D - 2.5, 2))")
# réverbe courte (convolution) + souffle léger + normalisation, coupé à la durée de la vidéo avec fondu
ffmpeg -y -loglevel error \
  -f f32le -ar 44100 -ac 2 -i handpan-dry.raw \
  -f f32le -ar 44100 -ac 2 -i ir.raw \
  -f lavfi -i "anoisesrc=c=brown:a=0.5:r=44100,aformat=channel_layouts=stereo" \
  -filter_complex "[0]asplit[d][w];[w][1]afir=gtype=none[r];[d][r]amix=inputs=2:weights='1 0.35':normalize=0[m];\
[2]lowpass=f=500,highpass=f=80,volume=0.012,atrim=0:$D[n];\
[m][n]amix=inputs=2:normalize=0,highpass=f=40,atrim=0:$D,afade=t=in:d=0.3,afade=t=out:st=$FO:d=2.5,\
loudnorm=I=-15:TP=-1.5:LRA=9" \
  -ar 44100 -c:a pcm_s16le musique.wav
ffmpeg -y -loglevel error -i video-muette.mp4 -i musique.wav \
  -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart ../../reel-wallet-metamask.mp4
rm -f handpan-dry.raw ir.raw
echo "OK : 2026-10/reel-wallet-metamask.mp4 ($D s)"
