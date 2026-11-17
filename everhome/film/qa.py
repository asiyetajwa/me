"""Transcribe the finished film and compare with the script; report long silences.
python3 -I qa.py <film.mp4> <lines.json>"""
import json, re, sys, difflib, subprocess
from faster_whisper import WhisperModel

film, lines = sys.argv[1:3]
script = ' '.join(l['text'] for l in json.load(open(lines))['lines'])
norm = lambda t: re.sub(r'[^a-z0-9 ]', ' ', t.lower().replace('-', ' ')).split()
m = WhisperModel('small.en', device='cpu', compute_type='int8')
import numpy as np
pcm = subprocess.run(['ffmpeg', '-v', 'error', '-i', film, '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], capture_output=True).stdout
segs, _ = m.transcribe(np.frombuffer(pcm, np.float32), beam_size=5, vad_filter=False)
segs = list(segs)
heard = ' '.join(s.text for s in segs)
a, b = norm(script), norm(heard)
sm = difflib.SequenceMatcher(a=a, b=b)
print('word match', round(sm.ratio(), 3), f'{len(a)} scripted, {len(b)} heard')
for op, i1, i2, j1, j2 in sm.get_opcodes():
    if op != 'equal': print(' ', op, ' '.join(a[i1:i2]), '->', ' '.join(b[j1:j2]))
gaps = [(round(segs[i].end, 1), round(segs[i + 1].start - segs[i].end, 1)) for i in range(len(segs) - 1) if segs[i + 1].start - segs[i].end > 2.5]
print('gaps over 2.5s (at, length):', gaps)
