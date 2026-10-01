from faster_whisper import WhisperModel
m = WhisperModel("medium", device="cpu", compute_type="int8")
segs,_ = m.transcribe(".scratch/v8audio.wav", language="he", word_timestamps=True, beam_size=5)
for s in segs:
    print(f"{s.words[0].start:6.2f}-{s.words[-1].end:6.2f}  {s.text.strip()}")
