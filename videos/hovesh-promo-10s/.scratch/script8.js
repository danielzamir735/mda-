    <script>
      const tl = gsap.timeline({ paused: true });
      const rise = (sel, at, dy = 40) => tl.fromTo(sel, { y: dy, opacity: 0 }, { y: 0, opacity: 1, duration: 0.32, ease: "power3.out" }, at);
      const slam = (sel, at, s0 = 1.5) => tl.fromTo(sel, { scale: s0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.28, ease: "power4.out" }, at);
      const ripple = (sel, at) => tl.fromTo(sel, { scale: 0.3, opacity: 1 }, { scale: 1.9, opacity: 0, duration: 0.5, ease: "power2.out", immediateRender: false }, at);
      const shake = (sel, at, amt = 12, n = 7) => tl.to(sel, { x: amt, duration: 0.04, yoyo: true, repeat: n, ease: "none" }, at);

      // ---------- opening: ECG trace, siren strobe, heartbeat vignette ----------
      let d = "M0 150";
      for (let x = 0; x < 880; x += 110) {
        d += " L" + (x + 40) + " 150 L" + (x + 52) + " 128 L" + (x + 62) + " 150 L" + (x + 70) + " 150 L" + (x + 78) + " 172 L" + (x + 88) + " 60 L" + (x + 98) + " 190 L" + (x + 106) + " 150";
      }
      d += " L900 150 L930 150 L948 10 L966 214 L984 150 L1080 150";
      document.getElementById("ecgpath").setAttribute("d", d);
      const ecgLen = document.getElementById("ecgpath").getTotalLength();
      tl.fromTo("#ecgpath", { strokeDasharray: ecgLen, strokeDashoffset: ecgLen }, { strokeDashoffset: ecgLen * 0.14, duration: 3.5, ease: "none" }, 0.25);
      tl.to("#ecgpath", { strokeDashoffset: 0, duration: 0.16, ease: "power2.in" }, 3.78);
      tl.to("#ecg", { opacity: 0, duration: 0.35 }, 4.3);
      tl.fromTo("#beamL", { opacity: 1 }, { opacity: 0, duration: 0.18, yoyo: true, repeat: 23, ease: "steps(1)" }, 0);
      tl.fromTo("#beamR", { opacity: 0 }, { opacity: 1, duration: 0.18, yoyo: true, repeat: 23, ease: "steps(1)" }, 0);
      tl.to("#siren", { opacity: 0, duration: 0.3 }, 4.4);
      [0.15, 0.45, 3.9, 4.2].forEach((a, i) => tl.fromTo("#heartvig", { opacity: 0 }, { opacity: i % 2 ? 0.45 : 0.85, duration: 0.07, yoyo: true, repeat: 1, ease: "power2.out", immediateRender: false }, a));

      // footage: slow push-in
      [["#vA", 0, 4.75, 1.0, 1.12], ["#vE", 17.1, 1.5, 1.0, 1.06], ["#vI", 29.35, 2.95, 1.0, 1.07], ["#bg1", 10.1, 7, 1.05, 1.15], ["#bg2", 19.05, 10.3, 1.05, 1.15], ["#bg3", 34.6, 3.95, 1.05, 1.12], ["#vW", 38.55, 5.65, 1.0, 1.06]].forEach(([id, a, dur, s0, s1]) => {
        tl.fromTo(id, { scale: s0 }, { scale: s1, duration: dur, ease: "none" }, a);
      });
      shake("#vA", 3.94, 18, 7);

      // opening captions
      [["#cA1", 0.3, 1.65], ["#cA2", 1.68, 3.85]].forEach(([id, a, b]) => {
        rise(id + " .cap", a, 50);
        tl.to(id + " .cap", { opacity: 0, duration: 0.18, ease: "power2.in" }, b - 0.2);
      });
      slam("#cA3 .cap", 3.92, 1.8);
      tl.fromTo("#redflash", { opacity: 0 }, { opacity: 0.5, duration: 0.06, yoyo: true, repeat: 1, ease: "power2.out" }, 3.93);

      // brand reveal on the Nachlaot shot, then "כלי אחד, עוצמתי, שתמיד איתכם."
      rise("#b-lead", 4.8);
      tl.fromTo("#b-icon", { scale: 0, rotation: -25 }, { scale: 1, rotation: 0, duration: 0.45, ease: "back.out(1.8)" }, 5.5);
      slam("#b-word", 6.0, 1.6);
      shake("#vB", 6.02, 12, 5);
      tl.to("#cB .brand", { opacity: 0, duration: 0.18 }, 6.95);
      rise("#cb2a", 7.18);
      slam("#cb2b", 7.9, 1.5);
      rise("#cb2c", 8.82);
      tl.to("#cB2 .cap", { opacity: 0, duration: 0.18 }, 9.45);

      // ---------- transition 1: dive into the medic's pocket -> phone ----------
      tl.fromTo("#vB", { scale: 1.02, transformOrigin: "880px 1250px", filter: "blur(0px)" }, { scale: 1.12, duration: 4.85, ease: "none" }, 4.75);
      tl.to("#vB", { scale: 2.6, filter: "blur(14px)", duration: 0.5, ease: "power3.in" }, 9.6);
      tl.fromTo("#flash", { opacity: 0 }, { opacity: 0.55, duration: 0.08, yoyo: true, repeat: 1, ease: "power2.out" }, 10.02);
      tl.fromTo("#pw1", { scale: 0.18, opacity: 0, transformOrigin: "880px 1250px" }, { scale: 1, opacity: 1, duration: 0.5, ease: "power3.out" }, 10.1);

      // ---------- transition 2 (match cut): into the paramedic's phone in Jaffa ----------
      rise("#cE .cap", 17.2, 50);
      tl.to("#cE .cap", { opacity: 0, duration: 0.18 }, 18.5);
      tl.to("#vE", { scale: 2.4, transformOrigin: "592px 1188px", filter: "blur(10px)", duration: 0.45, ease: "power3.in" }, 18.6);
      tl.fromTo("#flash2", { opacity: 0 }, { opacity: 0.45, duration: 0.07, yoyo: true, repeat: 1, ease: "power2.out" }, 19.0);
      tl.fromTo("#pw2", { scale: 0.16, opacity: 0, transformOrigin: "592px 1188px" }, { scale: 1, opacity: 1, duration: 0.5, ease: "power3.out" }, 19.05);

      // phone float: gentle 3D sway while on screen
      [["#pw1", 10.65, 16.8], ["#pw2", 19.6, 29.0], ["#pw3", 35.1, 38.2]].forEach(([id, a, b]) => {
        tl.fromTo(id, { rotationY: -5, transformPerspective: 1600 }, { rotationY: 5, duration: (b - a) / 3, yoyo: true, repeat: 2, ease: "sine.inOut" }, a);
      });

      // screen swaps inside the phone
      [["#pD", 12.95], ["#pG", 21.6], ["#pH", 27.05]].forEach(([id, a]) => {
        tl.fromTo(id, { x: -120, opacity: 0.2 }, { x: 0, opacity: 1, duration: 0.3, ease: "power3.out" }, a);
      });

      // touch ripples on the real taps + camera flash on the shutter
      [["#r1", 10.65], ["#r2", 12.31], ["#r3", 14.11], ["#r4", 20.52], ["#r5", 22.85], ["#r6", 24.28], ["#r7", 24.81], ["#r8", 28.36]].forEach(([id, a]) => ripple(id, a));
      tl.fromTo("#shutterflash", { opacity: 0 }, { opacity: 0.95, duration: 0.05, yoyo: true, repeat: 1, ease: "power2.out", immediateRender: false }, 14.13);

      // punch-ins on the key moments (zoom from the top edge so the titles stay clear)
      tl.fromTo("#pz1", { scale: 1, transformOrigin: "540px 544px" }, { scale: 1.32, duration: 0.35, ease: "power3.out" }, 16.0);
      tl.fromTo("#pz2", { scale: 1, transformOrigin: "380px 544px" }, { scale: 1.34, duration: 0.3, ease: "power3.out" }, 20.75);
      tl.to("#pz2", { scale: 1, duration: 0.2, ease: "power2.inOut" }, 21.38);
      tl.fromTo("#pz2", { scale: 1, transformOrigin: "540px 544px" }, { scale: 1.2, duration: 0.3, immediateRender: false, ease: "power3.out" }, 25.9);
      tl.to("#pz2", { scale: 1, duration: 0.2, ease: "power2.inOut" }, 26.85);

      // stage exits
      tl.to("#pw1", { y: 160, opacity: 0, duration: 0.25, ease: "power2.in" }, 16.85);
      tl.to("#pw2", { y: 160, opacity: 0, duration: 0.25, ease: "power2.in" }, 29.1);

      // phone titles: each line appears on its spoken word
      [["#tC1", 10.22], ["#tC2", 11.34], ["#tD1", 13.05], ["#tD2", 14.4], ["#tD3", 15.6], ["#tF1", 19.2], ["#tF2", 20.7], ["#tH1", 27.14], ["#tH2", 28.36]].forEach(([id, a]) => rise(id, a));
      [["#tC", 12.95], ["#tD", 17.1], ["#tF", 21.6], ["#tH", 29.35]].forEach(([id, b]) => {
        tl.to(id + " .title", { opacity: 0, duration: 0.15 }, b - 0.18);
      });
      // calculators
      [["#ch1", 21.66], ["#ch2", 22.44], ["#ch3", 23.22]].forEach(([id, a]) => {
        tl.fromTo(id, { scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(2.2)" }, a);
      });
      rise("#gmore", 24.04, 30);
      slam("#gsub", 25.98, 1.5);
      tl.to("#tG .chips, #gmore, #gsub", { opacity: 0, duration: 0.15 }, 26.88);

      // ---------- offline (mountain CPR -> tunnel): bars drop, slash, then a green check ----------
      tl.fromTo("#nosig", { x: 0, y: -60, opacity: 0 }, { x: 0, y: 0, opacity: 1, duration: 0.35, ease: "power3.out" }, 29.45);
      tl.fromTo("#slash", { strokeDashoffset: 1 }, { strokeDashoffset: 1, duration: 0.01 }, 29.4);
      [["#bar4", 29.7], ["#bar3", 29.8], ["#bar2", 29.9], ["#bar1", 30.0]].forEach(([id, a]) => {
        tl.fromTo(id, { opacity: 1 }, { opacity: 0.15, duration: 0.08, ease: "steps(1)" }, a);
      });
      tl.to("#slash", { strokeDashoffset: 0, duration: 0.16, ease: "power2.out" }, 30.1);
      shake("#nosig", 30.15, 14, 5);
      tl.fromTo("#okbadge", { scale: 0, rotation: -60 }, { scale: 1, rotation: 0, duration: 0.45, ease: "back.out(2.2)" }, 30.85);
      tl.fromTo("#okring", { scale: 1, opacity: 0.9 }, { scale: 2.6, opacity: 0, duration: 0.7, ease: "power2.out", immediateRender: false }, 30.9);
      tl.to("#oI .pill, #okbadge", { opacity: 0, duration: 0.2 }, 32.05);

      // ---------- free: "חינם לגמרי." slams over the ad pile, "בלי פרסומות." as the ads shatter ----------
      slam("#cJ1 .cap", 32.32, 1.7);
      shake("#vJ", 32.34, 10, 5);
      rise("#cJ2 .cap", 33.56, 40);
      shake("#vJ", 33.72, 14, 5);
      tl.to("#tintJ", { opacity: 0.25, duration: 0.4 }, 33.7);
      tl.to("#cJ1 .cap, #cJ2 .cap", { opacity: 0, duration: 0.15 }, 34.42);

      // ---------- features: phone montage of more app screens ----------
      tl.fromTo("#pw3", { scale: 0.6, y: 300, opacity: 0, transformOrigin: "540px 1140px" }, { scale: 1, y: 0, opacity: 1, duration: 0.45, ease: "back.out(1.4)" }, 34.6);
      document.querySelectorAll("#pz3 img.shot").forEach((el, i) => {
        if (i > 0) tl.fromTo(el, { x: -140, opacity: 0.3 }, { x: 0, opacity: 1, duration: 0.18, ease: "power3.out" }, 34.6 + i * 0.43);
      });
      rise("#tK1", 34.72);
      rise("#tK2", 35.82);
      slam("#tK3", 36.88, 1.5);
      tl.to("#pw3", { y: 160, opacity: 0, duration: 0.25, ease: "power2.in" }, 38.3);
      tl.to("#tK .title", { opacity: 0, duration: 0.15 }, 38.36);

      // ---------- WhatsApp channel ----------
      slam("#w1", 38.7, 1.4);
      tl.fromTo("#wicon", { scale: 0, rotation: -40 }, { scale: 1, rotation: 0, duration: 0.45, ease: "back.out(2)" }, 39.14);
      tl.to("#wicon", { scale: 1.07, duration: 0.4, yoyo: true, repeat: 7, ease: "sine.inOut" }, 39.7);
      rise("#w2", 40.24);
      rise("#w3", 41.58);
      rise("#w4", 42.52);
      tl.to("#tW", { opacity: 0, duration: 0.18 }, 44.0);

      // ---------- end card: boom on the logo, search types "חובש פלוס" with the VO ----------
      tl.fromTo("#iconwrap", { scale: 0, rotation: -30 }, { scale: 1, rotation: 0, duration: 0.5, ease: "back.out(1.8)" }, 44.23);
      slam("#end-word", 44.3, 1.6);
      shake("#end-brand", 44.32, 10, 5);
      tl.fromTo("#end-kicker", { opacity: 0 }, { opacity: 1, duration: 0.3 }, 44.32);
      rise("#search", 44.7, 80);
      tl.fromTo("#shine", { x: -200, rotation: 20 }, { x: 420, rotation: 20, duration: 0.6, ease: "power2.inOut" }, 44.9);
      tl.to("#shine", { x: -200, duration: 0.01 }, 45.6);
      tl.to("#shine", { x: 420, duration: 0.6, ease: "power2.inOut" }, 47.3);
      document.querySelectorAll("#q span").forEach((el, i) => tl.to(el, { opacity: 1, duration: 0.01 }, 45.85 + i * 0.09));
      tl.fromTo("#caret", { opacity: 1 }, { opacity: 0, duration: 0.25, yoyo: true, repeat: 11, ease: "steps(1)" }, 44.7);
      tl.to("#search", { scale: 0.96, duration: 0.1, yoyo: true, repeat: 1, ease: "power2.out" }, 47.2);
      tl.fromTo("#sripple", { scale: 0.2, opacity: 0.9 }, { scale: 9, opacity: 0, duration: 0.7, ease: "power2.out", immediateRender: false }, 47.2);

      tl.to({}, { duration: 48 }, 0);
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
