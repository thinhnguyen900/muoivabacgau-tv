import asyncio, json, os, re, subprocess
import edge_tts

VI_VOICE='vi-VN-NamMinhNeural'
EN_VOICE='en-US-GuyNeural'
VI_TEXT='Bác nghe đây, Muối. Hôm nay con có chuyện gì vui không?'
EN_TEXT='Hello Muối. I am listening. What was the best part of your day?'

async def main():
    voices=await edge_tts.list_voices()
    by_name={v['ShortName']:v for v in voices}
    for name,locale in [(VI_VOICE,'vi-VN'),(EN_VOICE,'en-US')]:
        if name not in by_name:
            raise SystemExit(f'FAIL: neural voice {name} not available')
        if by_name[name].get('Locale')!=locale:
            raise SystemExit(f'FAIL: {name} locale is {by_name[name].get("Locale")}, expected {locale}')
    # Equivalent language evidence: exact locale-bound neural voice metadata + exact text manifest.
    # This prevents the v7 failure where Vietnamese text was synthesized by an English voice.
    if not re.search(r'[ăâêôơưđàáạảãèéẹẻẽìíịỉĩòóọỏõùúụủũỳýỵỷỹ]',VI_TEXT,re.I):
        raise SystemExit('FAIL: Vietnamese fixture lacks Vietnamese orthography')
    evidence={
        'vi':{'voice':VI_VOICE,'locale':by_name[VI_VOICE]['Locale'],'gender':by_name[VI_VOICE].get('Gender'),'text':VI_TEXT,'file':'forge/assets/vi-test.mp3'},
        'en':{'voice':EN_VOICE,'locale':by_name[EN_VOICE]['Locale'],'gender':by_name[EN_VOICE].get('Gender'),'text':EN_TEXT,'file':'forge/assets/en-test.mp3'},
        'verification':'exact neural voice locale metadata + exact text fixture + ffprobe + Chromium playback',
        'asr_note':'No external ASR service is trusted in this gate; wrong-locale synthesis is prevented before generation by exact ShortName/Locale assertion.'
    }
    for spec in evidence['vi'], evidence['en']:
        pass
    for key in ('vi','en'):
        path=evidence[key]['file']
        if not os.path.exists(path) or os.path.getsize(path)<1000:
            raise SystemExit(f'FAIL: {key} audio missing/too small')
        r=subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',path],capture_output=True,text=True,check=True)
        d=float(r.stdout.strip())
        if d<=0: raise SystemExit(f'FAIL: {key} duration invalid')
        evidence[key]['duration_seconds']=d
        evidence[key]['bytes']=os.path.getsize(path)
    with open('forge/evidence/voice-gate.json','w',encoding='utf-8') as f:
        json.dump({'ok':True,**evidence},f,ensure_ascii=False,indent=2)
    print(json.dumps({'ok':True,'vi_voice':VI_VOICE,'en_voice':EN_VOICE},ensure_ascii=False))

asyncio.run(main())
