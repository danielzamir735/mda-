from PIL import Image, ImageDraw, ImageFont
fonts=[("Heebo (נוכחי)","assets/Heebo.ttf"),("Karantina","assets/fonts/Karantina-Bold.ttf"),("Secular One","assets/fonts/SecularOne-Regular.ttf"),("Suez One","assets/fonts/SuezOne-Regular.ttf"),("Rubik","assets/fonts/Rubik.ttf"),("Fredoka","assets/fonts/Fredoka.ttf")]
W,H=900,260
img=Image.new("RGB",(W,H*len(fonts)),(12,12,14)); d=ImageDraw.Draw(img)
rv=lambda s:s[::-1]
for i,(name,path) in enumerate(fonts):
    y=i*H
    try: f=ImageFont.truetype(path,110)
    except Exception as e: print(name,e); continue
    try: f.set_variation_by_axes([900]) 
    except Exception: pass
    small=ImageFont.truetype("assets/Heebo.ttf",30)
    d.text((W-20,y+10),rv(name),font=small,fill=(160,160,170),anchor="ra")
    d.text((W-30,y+60),rv("תמיד."),font=f,fill=(242,77,97),anchor="ra")
    f2=ImageFont.truetype(path,64)
    try: f2.set_variation_by_axes([900])
    except Exception: pass
    d.text((W-330,y+90),rv("חובש+ בכיס"),font=f2,fill=(240,240,240),anchor="ra")
img.save(".scratch/fonts.png")
