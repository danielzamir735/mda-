import json, sys
from faster_whisper import WhisperModel
m = WhisperModel("medium", device="cpu", compute_type="int8")
segs, info = m.transcribe("assets/vo-launch.mp3", language="he", word_timestamps=True, beam_size=5)
words=[]
for s in segs:
    for w in s.words:
        words.append({"t":round(w.start,2),"e":round(w.end,2),"w":w.word.strip()})
json.dump(words, open(".scratch/words.json","w",encoding="utf-8"), ensure_ascii=False, indent=0)
print("\n".join(f'{x["t"]:6.2f} {x["e"]:6.2f} {x["w"]}' for x in words))
