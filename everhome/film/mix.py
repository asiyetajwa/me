"""Everhome film: encode frames, lay the narration on the timeline, duck the music under it, mux.
python3 mix.py <timeline.json> <frames_dir> <vo_dir> <music.mp3> <out.mp4>"""
import json, subprocess, sys, re

tl_path, frames, vo, music, out = sys.argv[1:6]
tl = json.load(open(tl_path))
S, total, FPS = tl['scenes'], tl['total'], tl['FPS']
work = out.rsplit('/', 1)[0]

def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode: print(r.stderr[-3000:]); sys.exit(1)
    return r.stderr

# 1. Picture
end = total - 1.0
run(['ffmpeg', '-y', '-framerate', str(FPS), '-i', f'{frames}/f%06d.jpg', '-vf', f'format=yuv420p,fade=t=in:st=0:d=0.6,fade=t=out:st={end:.2f}:d=1.0',
     '-c:v', 'libx264', '-preset', 'slow', '-crf', '19', '-movflags', '+faststart', f'{work}/picture.mp4'])

# 2. Narration on the timeline
clips = []
for s in S:
    clips.append((f"{vo}/everhome-{s['id']}.mp3", s['start'] + s['voAt']))
    for x in s.get('extras', []):
        clips.append((f"{vo}/everhome-{x['clip']}.mp3", s['start'] + x['at']))
inputs, parts = [], []
for i, (f, at) in enumerate(clips):
    inputs += ['-i', f]
    ms = int(at * 1000)
    parts.append(f'[{i}:a]aresample=48000,aformat=channel_layouts=mono,adelay={ms}|{ms}[v{i}]')
mixin = ''.join(f'[v{i}]' for i in range(len(clips)))
fc = ';'.join(parts) + f';{mixin}amix=inputs={len(clips)}:normalize=0,apad,atrim=0:{total:.3f}[vo]'
run(['ffmpeg', '-y', *inputs, '-filter_complex', fc, '-map', '[vo]', '-c:a', 'pcm_s16le', f'{work}/voice.wav'])

# 3. Music at about -24 LUFS, faded, ducked under the voice; final loudness -16 LUFS
err = run(['ffmpeg', '-i', music, '-t', f'{total:.2f}', '-af', 'loudnorm=print_format=summary', '-f', 'null', '-'])
il = float(re.search(r'Input Integrated:\s+(-?[\d.]+)', err).group(1))
gain = -24.0 - il
fc = (f'[1:a]atrim=0:{total:.3f},asetpts=PTS-STARTPTS,aresample=48000,volume={gain:.2f}dB,afade=t=in:st=0:d=2,afade=t=out:st={total-3.5:.2f}:d=3.5[m];'
      f'[0:a]asplit=2[vk][vm];[m][vk]sidechaincompress=threshold=0.02:ratio=5:attack=40:release=650[md];'
      f'[vm][md]amix=inputs=2:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=9,aresample=48000[a]')
run(['ffmpeg', '-y', '-i', f'{work}/voice.wav', '-i', music, '-filter_complex', fc, '-map', '[a]', '-c:a', 'pcm_s16le', f'{work}/mix.wav'])

# 4. Mux
run(['ffmpeg', '-y', '-i', f'{work}/picture.mp4', '-i', f'{work}/mix.wav', '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out])
print('done', out, f'{total:.1f}s', f'music gain {gain:.1f} dB')
