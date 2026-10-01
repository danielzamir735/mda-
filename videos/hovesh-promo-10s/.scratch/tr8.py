from faster_whisper import WhisperModel
m = WhisperModel("medium", device="cpu", compute_type="int8")
segs,_ = m.transcribe("assets/v8/vo.mp3", language="he", word_timestamps=True, beam_size=5)
for s in segs:
    print(f"--- {s.start:.2f}-{s.end:.2f}")
    print(" ".join(f"{w.word.strip()}[{w.start:.2f}-{w.end:.2f}]" for w in s.words))
