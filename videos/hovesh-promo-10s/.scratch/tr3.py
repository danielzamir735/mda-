from faster_whisper import WhisperModel
m = WhisperModel("medium", device="cpu", compute_type="int8")
for i in [6,7,8,9]:
    segs,_ = m.transcribe(f"assets/vo3/take{i}.mp3", language="he", word_timestamps=True, beam_size=5)
    ws=[w for s in segs for w in s.words]
    print(f"== take{i}"); print(" ".join(f"{w.word.strip()}[{w.start:.2f}-{w.end:.2f}]" for w in ws))
