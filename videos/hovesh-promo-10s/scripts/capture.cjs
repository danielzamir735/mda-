// Captures real app screens for the promo video (phone viewport, 3x).
// Usage: node scripts/capture.cjs <baseUrl> <step...>
const path = require("path");
const puppeteer = require(process.env.PUPPETEER_PATH);

const base = process.argv[2];
const steps = process.argv.slice(3);
const out = path.join(__dirname, "..", "assets", "screens");
require("fs").mkdirSync(out, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function clickText(page, text, sel = "button") {
  const ok = await page.evaluate(
    (text, sel) => {
      const els = [...document.querySelectorAll(sel)].filter((b) => b.innerText && b.innerText.includes(text));
      const el = els[els.length - 1];
      if (el) el.click();
      return !!el;
    },
    text,
    sel
  );
  if (!ok) throw new Error("not found: " + text);
}

async function shot(page, name) {
  await page.screenshot({ path: path.join(out, name + ".png") });
  console.log("saved", name);
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: "new",
    args: ["--lang=he-IL", "--use-fake-ui-for-media-stream"],
  });
  const ctx = browser.defaultBrowserContext();
  await ctx.overridePermissions(base, ["geolocation"]);
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "dark" }]);
  await page.setGeolocation({ latitude: 31.7683, longitude: 35.2137 }); // Jerusalem
  await page.goto(base, { waitUntil: "networkidle2" });
  await page.evaluate(() =>
    ["hasAcceptedLegal_v2", "hasSeenWelcome_v2", "whatsNew_v2_seen", "lb_intro_seen"].forEach((k) =>
      localStorage.setItem(k, "true")
    )
  );
  const home = async () => {
    await page.goto(base, { waitUntil: "networkidle2" });
    await sleep(1200);
  };

  for (const step of steps) {
    await home();
    if (step === "dashboard") {
      await shot(page, "01-dashboard");
    }
    if (step === "metronome") {
      // green play button inside the metronome card
      await page.evaluate(() => {
        const card = [...document.querySelectorAll("div")].find(
          (d) => d.innerText && d.innerText.trim().startsWith("מטרונום") && d.querySelector("button")
        );
        const btns = [...card.querySelectorAll("button")];
        btns[btns.length - 1].click();
      });
      await sleep(900);
      await shot(page, "02-metronome-a");
      await sleep(270);
      await shot(page, "02-metronome-b");
    }
    if (step === "pulse") {
      await page.evaluate(async () => {
        const p = [...document.querySelectorAll("p")].find((e) => e.textContent.trim() === "דופק");
        const card = p.parentElement;
        const btns = card.querySelectorAll("button");
        for (let k = 0; k < 6 && !card.innerText.includes("15 שניות"); k++) {
          const val = parseInt(card.innerText.match(/(\d+) שניות/)[1]);
          (val < 15 ? btns[btns.length - 1] : btns[0]).click();
          await new Promise((r) => setTimeout(r, 200));
        }
        card.click();
      });
      await sleep(4000);
      await shot(page, "03-pulse-timer");
      await sleep(12500);
      await shot(page, "03-pulse-keypad");
      if (process.env.STOP_AT_KEYPAD) continue;
      for (const d of ["2", "2"]) {
        await page.evaluate((d) => {
          const b = [...document.querySelectorAll("button")].filter((b) => b.innerText.trim() === d).pop();
          b.click();
        }, d);
        await sleep(250);
      }
      await shot(page, "03-pulse-entered");
      await page.evaluate(() => [...document.querySelectorAll("button")].filter((b) => b.innerText.trim() === "=").pop().click());
      await sleep(900);
      await shot(page, "03-pulse-result");
    }
    if (step === "pulse-result") {
      // continues from keypad: press confirm
      await shot(page, "03-pulse-result");
    }
    if (step === "bridge") {
      await clickText(page, "סיוע בתרגום");
      await sleep(2500);
      await shot(page, "04-bridge-langs");
      await page.evaluate(() => {
        const els = [...document.querySelectorAll("button, div")].filter((b) => b.innerText && b.innerText.includes("אנגלית") && b.innerText.includes("מתרגמים"));
        els.sort((a, b) => a.innerText.length - b.innerText.length);
        els[0].click();
      });
      await sleep(2000);
      // replace real volunteer names with fictional ones before capturing (privacy)
      await page.evaluate(() => {
        const fake = ["דניאל", "מיכל", "יוסי", "רונית", "אבי", "שרה", "נועם", "תמר"];
        let i = 0;
        document.querySelectorAll("[role=dialog] *, .fixed *").forEach((n) => {
          if (n.children.length === 0 && /^[\u0590-\u05FFa-zA-Z .'-]{2,30}$/.test(n.textContent.trim()) && n.className && /font-(bold|semibold|black)/.test(n.className) && !/זמינים|אנגלית|24\/7/.test(n.textContent)) {
            n.textContent = fake[i++ % fake.length];
          }
        });
        // avatar initials: single Hebrew letter leaf -> first letter of the fake name in the same row
        const leaves = [...document.querySelectorAll("*")].filter((n) => n.children.length === 0 && /^[֐-׿]$/.test(n.textContent.trim()));
        leaves.forEach((n) => {
          let row = n;
          for (let k = 0; k < 4 && row; k++) {
            row = row.parentElement;
            const nm = row && [...row.querySelectorAll("*")].find((x) => x.children.length === 0 && fake.includes(x.textContent.trim()));
            if (nm) { n.textContent = nm.textContent.trim()[0]; break; }
          }
        });
      });
      await shot(page, "04-bridge-list");
    }
    if (step === "hospitals") {
      await clickText(page, "כלים");
      await sleep(800);
      await clickText(page, "מידע בתי חולים");
      await sleep(4000);
      await shot(page, "05-hospitals");
      await clickText(page, "קרובים");
      await sleep(4000);
      await shot(page, "05-hospitals-near");
      if (process.env.STOP_NEAR) continue;
      await page.evaluate(() => {
        const els = [...document.querySelectorAll("button, a, div")].filter((x) => (x.innerText || "").includes("שערי צדק") && (x.innerText || "").includes("ק״מ") || (x.innerText || "").includes("שערי צדק") && (x.innerText || "").includes("3.1"));
        els.sort((a, b) => a.innerText.length - b.innerText.length);
        els[0].click();
      });
      await sleep(1500);
      await shot(page, "05-hospitals-nav");
    }
    if (step === "meds") {
      await clickText(page, "כלים");
      await sleep(800);
      await clickText(page, "מידע על תרופות");
      await sleep(800);
      await shot(page, "06-meds-scan");
      await page.type("input[placeholder*=\"תרופה\"]", "אקמול");
      await page.keyboard.press("Enter");
      await sleep(15000);
      await shot(page, "06-meds-result");
    }
  }
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
