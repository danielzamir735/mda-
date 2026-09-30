p = "index.html"
s = open(p, encoding="utf-8").read()
a = s.index("    <script>\n      const tl")
b = s.index("    </script>", a) + len("    </script>")
js = open(".scratch/newscript.js", encoding="utf-8").read().rstrip("\n")
s = s[:a] + js + s[b:]
open(p, "w", encoding="utf-8").write(s)
print("ok")
