"""Generate original vector artwork and synthesized audio. Requires ffmpeg for MP3."""
from pathlib import Path
import math, random, wave, struct, subprocess, zipfile
root = Path(__file__).resolve().parent.parent
public = root/'public'/'demo'
private = root/'demo-private'
public.mkdir(parents=True, exist_ok=True)
private.mkdir(exist_ok=True)
palettes=[('#344e53','#b5d4b3','#182b35'),('#7c3e2e','#e2a171','#24151c'),('#465059','#c8cfd0','#181d29'),('#593e62','#dc91a3','#241c36'),('#3a5851','#c4bf95','#172d31'),('#3d5979','#bac9d1','#15263b')]
for i,(base,light,dark) in enumerate(palettes,1):
    if i==1:
        shape=f'<circle cx="320" cy="265" r="145" fill="{light}" opacity=".7"/><path d="M0 440 Q220 230 600 430V600H0Z" fill="{dark}"/><path d="M0 510Q320 300 600 490V600H0Z" fill="{base}"/><path d="M-10 200L610 330M-10 210L610 340" stroke="{light}" opacity=".3"/>'
    elif i==2:
        shape=''.join(f'<rect x="{100+j*82}" y="{40+j*40}" width="55" height="600" fill="{light}" opacity="{.2+j*.08}" transform="rotate(-22 300 300)"/>' for j in range(6))
    elif i==3:
        shape=''.join(f'<path d="M{j*22-100} 0L{j*22+180} 600" stroke="{light}" stroke-width="{3+j%4}" opacity=".3"/>' for j in range(30))+'<rect x="150" y="150" width="300" height="300" fill="none" stroke="#ddd" opacity=".5"/>'
    elif i==4:
        shape=''.join(f'<ellipse cx="300" cy="{200+j*19}" rx="{190-j*3}" ry="62" fill="none" stroke="{light}" stroke-width="2" opacity=".55" transform="rotate(-30 300 300)"/>' for j in range(14))
    elif i==5:
        shape=f'<circle cx="410" cy="180" r="75" fill="{light}" opacity=".8"/>'+''.join(f'<path d="M-30 {260+j*32}Q200 {100+j*35} 650 {380+j*20}" stroke="{light}" stroke-width="1.6" fill="none" opacity=".4"/>' for j in range(15))
    else:
        shape=f'<path d="M160 510V110H440V510M160 110L70 50M440 110L530 50M440 510L530 580M160 510L70 580" fill="none" stroke="{light}" stroke-width="2"/>'+''.join(f'<path d="M{70+j*38} 50V580" fill="none" stroke="{light}" opacity=".15"/>' for j in range(13))
    svg=f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600"><defs><filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".6" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".16"/></feComponentTransfer><feBlend in="SourceGraphic" mode="soft-light"/></filter></defs><rect width="600" height="600" fill="{base}"/>{shape}<rect width="600" height="600" filter="url(#grain)" opacity=".4"/><text x="32" y="48" fill="{light}" font-family="monospace" font-size="14" letter-spacing="5">ZIOVA / VOL. {i:02d}</text><text x="32" y="562" fill="{light}" font-family="monospace" font-size="11" letter-spacing="3">INDEPENDENT SOUNDS · TORONTO</text></svg>'''
    (public/f'cover-{i}.svg').write_text(svg)
(public/'avatar.svg').write_text('''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#8d9a8c"/><circle cx="100" cy="83" r="42" fill="#303b36"/><path d="M15 200Q20 125 100 125Q180 125 190 200" fill="#303b36"/><path d="M58 63Q100 5 142 63" fill="#29352f"/><path d="M65 76H96M106 76H138" stroke="#b5c4a8" stroke-width="6"/><text x="15" y="185" fill="#d5ff63" font-size="16" font-family="monospace">z.</text></svg>''')
rate=22050
random.seed(41)
def write_wav(path,values):
    peak=max(max(abs(v) for v in values),1)
    with wave.open(str(path),'wb') as w:
        w.setnchannels(1);w.setsampwidth(2);w.setframerate(rate)
        w.writeframes(b''.join(struct.pack('<h',int(v/peak*28000)) for v in values))
for i,bpm in enumerate([142,128,156,92,135,110],1):
    beat=60/bpm
    seconds=beat*32
    parts=[[],[],[]]
    root_freq=[185,130.81,146.83,110,207.65,164.81][i-1]
    for n in range(int(seconds*rate)):
        t=n/rate;step=int(t/beat);local=t%beat
        kick=math.sin(2*math.pi*(45*local+70*.025*(1-math.exp(-local/.025))))*math.exp(-local*18) if step%4 in [0,2] else 0
        snare=(random.random()*2-1)*math.exp(-local*28)*.3 if step%4 in [1,3] else 0
        hat=(random.random()*2-1)*math.exp(-(t%(beat/2))*95)*.09
        drums=(kick*.5+snare+hat)
        chord=[1,1.1892,1.4983][step%3]
        env=min(1,t/.4)*min(1,(seconds-t)/.6)
        pad=sum(math.sin(2*math.pi*root_freq*x*t) for x in [1,1.1892,1.4983])*.075*env*(.8+.2*math.sin(t*.7))
        pluck=math.sin(2*math.pi*root_freq*chord*2*t)*math.exp(-local*5)*.16*env
        bass=math.sin(2*math.pi*root_freq/4*t)*math.exp(-local*3)*.2*env
        parts[0].append(drums*env);parts[1].append(pad+pluck);parts[2].append(bass)
    values=[sum(v) for v in zip(*parts)]
    wav=private/'sample.wav' if i==1 else private/f'temp-{i}.wav'
    write_wav(wav,values)
    subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(wav),'-codec:a','libmp3lame','-b:a','96k',str(public/f'preview-{i}.mp3')],check=True)
    if i==1:
        subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(wav),'-codec:a','libmp3lame','-b:a','192k',str(private/'sample.mp3')],check=True)
        with zipfile.ZipFile(private/'sample.zip','w',zipfile.ZIP_DEFLATED) as z:
            for name,part in zip(['drums','melody','bass'],parts):
                p=private/f'{name}.wav';write_wav(p,part);z.write(p,f'{name}.wav');p.unlink()
            z.writestr('README.txt','Original synthesized demo audio by Trakko. Illustrative demo stems, royalty-free.\n')
    else: wav.unlink()
print('Generated 6 original covers, previews, avatar, and private MP3/WAV/stems fixtures.')
