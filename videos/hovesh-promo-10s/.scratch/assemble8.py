p = "index.html"
s = open(p, encoding="utf-8").read()
head_end = s.index("  </head>")
head = s[:head_end]
css = """
      /* v8: free / WhatsApp scenes */
      .cap.mid { bottom: auto; top: 640px; }
      .cap.mid2 { bottom: auto; top: 940px; font-size: 150px; }
      .tintw { background: linear-gradient(to bottom, rgba(4, 20, 12, 0.86) 0%, rgba(4, 20, 12, 0.4) 34%, rgba(4, 20, 12, 0.4) 58%, rgba(4, 20, 12, 0.88) 66%, rgba(4, 20, 12, 0.88) 100%); }
      .wline { position: absolute; left: 30px; right: 30px; text-align: center; font-size: 126px; line-height: 1; text-shadow: 0 8px 36px rgba(0, 0, 0, 0.85); }
      .wgrn { color: #25d366; }
      #wicon { position: absolute; left: 380px; top: 800px; width: 320px; height: 320px; border-radius: 50%; background: #fff; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 90px rgba(37, 211, 102, 0.85); }
      #wicon img { width: 210px; height: 210px; display: block; }
"""
marker = "    </style>"
i = head.rindex(marker)
head = head[:i] + css + head[i:]
body = open(".scratch/body8.html", encoding="utf-8").read()
js = open(".scratch/script8.js", encoding="utf-8").read()
open(p, "w", encoding="utf-8").write(head + "  </head>\n" + body + js)
print("ok")
