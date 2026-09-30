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
      tl.fromTo("#ecgpath", { strokeDasharray: ecgLen, strokeDashoffset: ecgLen }, { strokeDashoffset: ecgLen * 0.14, duration: 3.6, ease: "none" }, 0.25);
      tl.to("#ecgpath", { strokeDashoffset: 0, duration: 0.18, ease: "power2.in" }, 3.9);
      tl.to("#ecg", { opacity: 0, duration: 0.35 }, 4.45);
      // siren: hard alternating strobes left/right
      tl.fromTo("#beamL", { opacity: 1 }, { opacity: 0, duration: 0.18, yoyo: true, repeat: 21, ease: "steps(1)" }, 0);
      tl.fromTo("#beamR", { opacity: 0 }, { opacity: 1, duration: 0.18, yoyo: true, repeat: 21, ease: "steps(1)" }, 0);
      tl.to("#siren", { opacity: 0, duration: 0.3 }, 4.5);
      [0.15, 0.45, 3.93, 4.23].forEach((a, i) => tl.fromTo("#heartvig", { opacity: 0 }, { opacity: i % 2 ? 0.45 : 0.85, duration: 0.07, yoyo: true, repeat: 1, ease: "power2.out", immediateRender: false }, a));

      // field footage: slow push-in
      [["#vA", 0, 4.9, 1.0, 1.12], ["#vE", 15.5, 2.0, 1.0, 1.06], ["#vI", 28.2, 2.2, 1.0, 1.05], ["#vJ", 30.4, 2.85, 1.0, 1.07], ["#bg1", 7.5, 8, 1.05, 1.15], ["#bg2", 17.95, 10.25, 1.05, 1.15], ["#bg3", 33.25, 4.05, 1.05, 1.12]].forEach(([id, a, dur, s0, s1]) => {
        tl.fromTo(id, { scale: s0 }, { scale: s1, duration: dur, ease: "none" }, a);
      });
      shake("#vA", 4.05, 18, 7);

      // captions over footage
      [["#cA1", 0.35, 1.85], ["#cA2", 1.85, 3.95], ["#cE", 15.72, 17.6], ["#cJ2", 31.88, 33.25]].forEach(([id, a, b]) => {
        rise(id + " .cap", a, 50);
        tl.to(id + " .cap", { opacity: 0, duration: 0.18, ease: "power2.in" }, b - 0.2);
      });
      slam("#cA3 .cap", 4.03, 1.8);
      tl.fromTo("#redflash", { opacity: 0 }, { opacity: 0.5, duration: 0.06, yoyo: true, repeat: 1, ease: "power2.out" }, 4.05);
      slam("#cJ1 .cap", 30.62, 1.7);
      shake("#vJ", 30.64, 10, 5);
      tl.to("#cJ1 .cap", { opacity: 0, duration: 0.18 }, 33.05);

      // brand reveal on the Nachlaot shot (boom at the wordmark)
      rise("#b-lead", 5.25);
      tl.fromTo("#b-icon", { scale: 0, rotation: -25 }, { scale: 1, rotation: 0, duration: 0.45, ease: "back.out(1.8)" }, 5.9);
      slam("#b-word", 6.15, 1.6);
      shake("#vB", 6.17, 12, 5);
      tl.to("#cB .brand", { opacity: 0, duration: 0.2 }, 7.05);

      // ---------- transition 1: dive into the medic's pocket -> phone ----------
      tl.fromTo("#vB", { scale: 1.02, transformOrigin: "880px 1250px", filter: "blur(0px)" }, { scale: 1.1, duration: 2.1, ease: "none" }, 4.9);
      tl.to("#vB", { scale: 2.6, filter: "blur(14px)", duration: 0.5, ease: "power3.in" }, 7.0);
      tl.fromTo("#flash", { opacity: 0 }, { opacity: 0.55, duration: 0.08, yoyo: true, repeat: 1, ease: "power2.out" }, 7.42);
      tl.fromTo("#pw1", { scale: 0.18, opacity: 0, transformOrigin: "880px 1250px" }, { scale: 1, opacity: 1, duration: 0.55, ease: "power3.out" }, 7.5);

      // ---------- transition 2 (match cut): into the paramedic's phone in Jaffa ----------
      tl.to("#vE", { scale: 2.4, transformOrigin: "592px 1188px", filter: "blur(10px)", duration: 0.45, ease: "power3.in" }, 17.5);
      tl.fromTo("#flash2", { opacity: 0 }, { opacity: 0.45, duration: 0.07, yoyo: true, repeat: 1, ease: "power2.out" }, 17.9);
      tl.fromTo("#pw2", { scale: 0.16, opacity: 0, transformOrigin: "592px 1188px" }, { scale: 1, opacity: 1, duration: 0.55, ease: "power3.out" }, 17.95);

      // phone float: gentle 3D sway while on screen
      [["#pw1", 8.05, 15.2], ["#pw2", 18.5, 27.9], ["#pw3", 33.8, 37.0]].forEach(([id, a, b]) => {
        tl.fromTo(id, { rotationY: -5, transformPerspective: 1600 }, { rotationY: 5, duration: (b - a) / 3, yoyo: true, repeat: 2, ease: "sine.inOut" }, a);
      });

      // screen swaps inside the phone
      [["#pD", 10.75], ["#pG", 20.75], ["#pH", 25.6]].forEach(([id, a]) => {
        tl.fromTo(id, { x: -120, opacity: 0.2 }, { x: 0, opacity: 1, duration: 0.3, ease: "power3.out" }, a);
      });

      // touch ripples on the real taps + camera flash on the shutter
      [["#r1", 8.05], ["#r2", 9.71], ["#r3", 12.06], ["#r4", 19.64], ["#r5", 21.84], ["#r6", 23.09], ["#r7", 23.56], ["#r8", 26.87]].forEach(([id, a]) => ripple(id, a));
      tl.fromTo("#shutterflash", { opacity: 0 }, { opacity: 0.95, duration: 0.05, yoyo: true, repeat: 1, ease: "power2.out", immediateRender: false }, 12.08);

      // punch-ins on the key moments (zoom from the top edge so the titles stay clear)
      tl.fromTo("#pz1", { scale: 1, transformOrigin: "540px 544px" }, { scale: 1.32, duration: 0.35, ease: "power3.out" }, 14.15);
      tl.fromTo("#pz2", { scale: 1, transformOrigin: "380px 544px" }, { scale: 1.34, duration: 0.3, ease: "power3.out" }, 19.9);
      tl.to("#pz2", { scale: 1, duration: 0.25, ease: "power2.inOut" }, 20.52);
      tl.fromTo("#pz2", { scale: 1, transformOrigin: "540px 544px" }, { scale: 1.2, duration: 0.3, immediateRender: false, ease: "power3.out" }, 24.6);
      tl.to("#pz2", { scale: 1, duration: 0.2, ease: "power2.inOut" }, 25.4);

      // stage exits
      tl.to("#pw1", { y: 160, opacity: 0, duration: 0.25, ease: "power2.in" }, 15.25);
      tl.to("#pw2", { y: 160, opacity: 0, duration: 0.25, ease: "power2.in" }, 27.95);

      // phone titles: each line appears on its spoken word
      [["#tC1", 7.8], ["#tC2", 8.65], ["#tD1", 10.9], ["#tD2", 12.35], ["#tD3", 13.5], ["#tF1", 18.2], ["#tF2", 19.85], ["#tH1", 25.78], ["#tH2", 26.85]].forEach(([id, a]) => rise(id, a));
      [["#tC", 10.75], ["#tD", 15.5], ["#tF", 20.75], ["#tH", 28.2]].forEach(([id, b]) => {
        tl.to(id + " .title", { opacity: 0, duration: 0.15 }, b - 0.18);
      });
      // calculators
      [["#ch1", 20.9], ["#ch2", 21.58], ["#ch3", 22.14]].forEach(([id, a]) => {
        tl.fromTo(id, { scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(2.2)" }, a);
      });
      rise("#gmore", 22.82, 30);
      slam("#gsub", 24.5, 1.5);
      tl.to("#tG .chips, #gmore, #gsub", { opacity: 0, duration: 0.15 }, 25.42);

      // ---------- offline: bars drop one by one, slash, then a green check with a ring ----------
      tl.fromTo("#nosig", { x: 0, y: -60, opacity: 0 }, { x: 0, y: 0, opacity: 1, duration: 0.35, ease: "power3.out" }, 28.35);
      tl.fromTo("#slash", { strokeDashoffset: 1 }, { strokeDashoffset: 1, duration: 0.01 }, 28.3);
      [["#bar4", 28.6], ["#bar3", 28.7], ["#bar2", 28.8], ["#bar1", 28.9]].forEach(([id, a]) => {
        tl.fromTo(id, { opacity: 1 }, { opacity: 0.15, duration: 0.08, ease: "steps(1)" }, a);
      });
      tl.to("#slash", { strokeDashoffset: 0, duration: 0.16, ease: "power2.out" }, 29.0);
      shake("#nosig", 29.05, 14, 5);
      tl.fromTo("#okbadge", { scale: 0, rotation: -60 }, { scale: 1, rotation: 0, duration: 0.45, ease: "back.out(2.2)" }, 29.37);
      tl.fromTo("#okring", { scale: 1, opacity: 0.9 }, { scale: 2.6, opacity: 0, duration: 0.7, ease: "power2.out", immediateRender: false }, 29.42);
      tl.to("#oI .pill, #okbadge", { opacity: 0, duration: 0.2 }, 30.15);

      // ---------- features: phone montage of more app screens ----------
      tl.fromTo("#pw3", { scale: 0.6, y: 300, opacity: 0, transformOrigin: "540px 1140px" }, { scale: 1, y: 0, opacity: 1, duration: 0.45, ease: "back.out(1.4)" }, 33.25);
      document.querySelectorAll("#pz3 img.shot").forEach((el, i) => {
        if (i > 0) tl.fromTo(el, { x: -140, opacity: 0.3 }, { x: 0, opacity: 1, duration: 0.18, ease: "power3.out" }, 33.25 + i * 0.45);
      });
      rise("#tK1", 33.42);
      rise("#tK2", 34.55);
      slam("#tK3", 35.68, 1.5);
      tl.to("#pw3", { y: 160, opacity: 0, duration: 0.25, ease: "power2.in" }, 37.05);
      tl.to("#tK .title", { opacity: 0, duration: 0.15 }, 37.1);

      // ---------- end card: boom on the logo, search types "חובש פלוס" with the VO ----------
      tl.fromTo("#iconwrap", { scale: 0, rotation: -30 }, { scale: 1, rotation: 0, duration: 0.5, ease: "back.out(1.8)" }, 37.33);
      slam("#end-word", 37.4, 1.6);
      shake("#end-brand", 37.42, 10, 5);
      tl.fromTo("#end-kicker", { opacity: 0 }, { opacity: 1, duration: 0.3 }, 37.42);
      rise("#search", 37.8, 80);
      tl.fromTo("#shine", { x: -200, rotation: 20 }, { x: 420, rotation: 20, duration: 0.6, ease: "power2.inOut" }, 38.0);
      tl.to("#shine", { x: -200, duration: 0.01 }, 38.7);
      tl.to("#shine", { x: 420, duration: 0.6, ease: "power2.inOut" }, 40.1);
      document.querySelectorAll("#q span").forEach((el, i) => tl.to(el, { opacity: 1, duration: 0.01 }, 38.72 + i * 0.1));
      tl.fromTo("#caret", { opacity: 1 }, { opacity: 0, duration: 0.25, yoyo: true, repeat: 11, ease: "steps(1)" }, 37.8);
      tl.to("#search", { scale: 0.96, duration: 0.1, yoyo: true, repeat: 1, ease: "power2.out" }, 40.0);
      tl.fromTo("#sripple", { scale: 0.2, opacity: 0.9 }, { scale: 9, opacity: 0, duration: 0.7, ease: "power2.out", immediateRender: false }, 40.0);

      tl.to({}, { duration: 40.8 }, 0);
      window.__timelines["main"] = tl;
    </script>
