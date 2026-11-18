// EnergetiCo — chování webu: hlavička, mobilní menu, motiv, reference, poptávka (koš), formulář.

const SEGMENTY = {
  "rodinne-domy": { nazev: "Rodinné domy", stranka: "rodinne-domy.html" },
  "bytove-domy-svj": { nazev: "Bytové domy a SVJ", stranka: "bytove-domy-svj.html" },
  "firmy": { nazev: "Firmy", stranka: "firmy.html" },
  "obce": { nazev: "Obce", stranka: "obce.html" },
};

// Poloha po načtení: bez kotvy vždy nahoře, s kotvou přesně na ní. Vždy skokem, nikdy plynule,
// a znovu po dočtení písma a referencí, které stránku ještě posunou (viz konec souboru).
try { history.scrollRestoration = "manual"; } catch {}
function srovnejPolohu() {
  const cil = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if (cil) cil.scrollIntoView({ behavior: "instant", block: "start" });
  else scrollTo({ top: 0, left: 0, behavior: "instant" });
}
srovnejPolohu();

const koren = document.documentElement;
const bezPohybu = matchMedia("(prefers-reduced-motion: reduce)").matches;

const pamet = {
  cti: (k) => { try { return sessionStorage.getItem(k); } catch { return null; } },
  uloz: (k, v) => { try { sessionStorage.setItem(k, v); } catch {} },
};

function prvek(znacka, trida, text) {
  const el = document.createElement(znacka);
  if (trida) el.className = trida;
  if (text) el.textContent = text;
  return el;
}

// --- Hlavička: průhledná nad fotkou, po odrolování pevná ---
const hlavicka = document.querySelector(".hlavicka");
const prepniHlavicku = () => hlavicka?.classList.toggle("je-pevna", scrollY > 40);
addEventListener("scroll", prepniHlavicku, { passive: true });
prepniHlavicku();

// --- Mobilní menu ---
const burger = document.querySelector(".burger");
burger?.addEventListener("click", () => {
  const otevrene = document.documentElement.classList.toggle("menu-otevrene");
  burger.setAttribute("aria-expanded", otevrene);
});
document.querySelectorAll(".menu a").forEach((a) =>
  a.addEventListener("click", () => document.documentElement.classList.remove("menu-otevrene")));

// --- Světlý / tmavý motiv (výchozí podle systému) ---
document.querySelector(".motiv")?.addEventListener("click", () => {
  const jeTmavy = koren.dataset.motiv
    ? koren.dataset.motiv === "tmavy"
    : matchMedia("(prefers-color-scheme: dark)").matches;
  koren.dataset.motiv = jeTmavy ? "svetly" : "tmavy";
  try { localStorage.setItem("motiv", koren.dataset.motiv); } catch {}
});

// --- Segment stránky: předvyplní se ve formuláři ---
const segmentStranky = document.body.dataset.segment || "";
if (segmentStranky) pamet.uloz("segment", segmentStranky);

// =====================================================================
// POPTÁVKA (koš)
// Položka = služba + segment. Vybírá se tlačítky na stránce Služby a tlačítky
// „Poptat" na segmentových stránkách. Výběr drží sessionStorage, takže vydrží
// i při přechodu mezi stránkami. Koš je panel přes stránku, nic neskáče.
// =====================================================================
let polozky = (() => { try { return JSON.parse(pamet.cti("kos")) || []; } catch { return []; } })();
const stejna = (a, sluzba, segment) => a.sluzba === sluzba && a.segment === segment;
const jeVKosi = (sluzba, segment) => polozky.some((p) => stejna(p, sluzba, segment));

function zmenKos(sluzba, segment, pridat) {
  const ma = jeVKosi(sluzba, segment);
  const chce = pridat ?? !ma;
  if (chce && !ma) polozky.push({ sluzba, segment });
  if (!chce) polozky = polozky.filter((p) => !stejna(p, sluzba, segment));
  pamet.uloz("kos", JSON.stringify(polozky));
  prekresliKos();
  if (chce && !ma) oznamPridani(sluzba);
}

// Přidání se jen oznámí: počítadlo v hlavičce poskočí a dole se krátce ukáže hláška.
// Panel poptávky se sám neotvírá, otevře ho až člověk.
const oznameni = prvek("div", "oznameni");
oznameni.setAttribute("role", "status");
oznameni.append(prvek("span"), Object.assign(prvek("button", "", "Zobrazit"), { type: "button" }));
oznameni.lastChild.dataset.otevritKos = "";
let casOznameni;
function oznamPridani(sluzba) {
  oznameni.firstChild.textContent = `Přidáno do poptávky: ${sluzba}`;
  oznameni.classList.add("je-videt");
  clearTimeout(casOznameni);
  casOznameni = setTimeout(() => oznameni.classList.remove("je-videt"), 3200);
  tlKos.classList.remove("kos-tl--skok");
  void tlKos.offsetWidth; // znovu spustí animaci
  tlKos.classList.add("kos-tl--skok");
}

// Panel koše a okno s popisem služby vznikají tady, v HTML stránek nejsou.
const oknoKos = prvek("dialog", "okno okno--kos");
oknoKos.innerHTML = `
  <button class="okno__zavrit" type="button" data-zavrit aria-label="Zavřít">×</button>
  <h2 class="okno__nadpis">Poptávám</h2>
  <ul class="kos__seznam" data-kos-seznam></ul>
  <p class="kos__prazdny">Zatím nic vybraného. Služby se vybírají na stránce <a href="sluzby.html">Služby</a>.</p>
  <form class="formular" novalidate>
    <div class="pole">
      <label for="k-segment">Poptávám pro</label>
      <select id="k-segment" name="segment">
        <option value="">Vyberte</option>
        <option value="rodinne-domy">rodinný dům</option>
        <option value="bytove-domy-svj">bytový dům nebo SVJ</option>
        <option value="firmy">firmu</option>
        <option value="obce">obec</option>
      </select>
    </div>
    <div class="pole"><label for="k-sluzba">O co mám zájem (nepovinné)</label><input id="k-sluzba" name="sluzba"></div>
    <div class="pole"><label for="k-jmeno">Jméno</label><input id="k-jmeno" name="jmeno" autocomplete="name" required></div>
    <div class="pole"><label for="k-kontakt">Telefon nebo e-mail</label><input id="k-kontakt" name="kontakt" required></div>
    <div class="pole"><label for="k-zprava">Zpráva (nepovinné)</label><textarea id="k-zprava" name="zprava" rows="2"></textarea></div>
    <div class="formular__pata">
      <button class="tl tl--plne" type="submit">Odeslat poptávku</button>
      <button class="tl tl--obrys-svetly" type="button" data-zavrit>Pokračovat ve výběru</button>
      <span class="formular__stav" role="status"></span>
    </div>
  </form>`;
const oknoDetail = prvek("dialog", "okno okno--detail");
oknoDetail.innerHTML = `
  <button class="okno__zavrit" type="button" data-zavrit aria-label="Zavřít">×</button>
  <p class="navesti" data-detail-segment></p>
  <h2 class="okno__nadpis" data-detail-nazev></h2>
  <p class="okno__text" data-detail-text></p>
  <div class="okno__akce">
    <button class="tl tl--plne" type="button" data-detail-vybrat></button>
    <a class="odkaz" data-detail-odkaz></a>
  </div>`;
document.body.append(oknoKos, oknoDetail, oznameni);
document.querySelectorAll(".formular").forEach((f) => {
  const segment = segmentStranky || pamet.cti("segment");
  if (segment && f.elements.segment) f.elements.segment.value = segment;
});

// Seznam vybraného se ukazuje i nad formulářem dole na stránce.
document.querySelectorAll("main .formular").forEach((f) => {
  const seznam = prvek("ul", "kos__seznam");
  seznam.dataset.kosSeznam = "";
  f.prepend(seznam);
});

// Tlačítko v hlavičce, viditelné jen když je něco vybráno.
const tlKos = prvek("button", "tl kos-tl");
tlKos.type = "button";
tlKos.dataset.otevritKos = "";
document.querySelector(".hlavicka__akce")?.prepend(tlKos);

function prekresliKos() {
  document.querySelectorAll(".cip[data-sluzba]").forEach((c) =>
    c.setAttribute("aria-pressed", jeVKosi(c.dataset.sluzba, c.dataset.segment || "")));

  document.querySelectorAll(".blok").forEach((blok) => {
    const tl = blok.querySelector(".blok__poptat");
    if (!tl) return;
    const pocet = blok.querySelectorAll('.cip[aria-pressed="true"]').length;
    tl.disabled = pocet === 0;
    tl.textContent = pocet ? `Poptat vybrané (${pocet})` : "Poptat vybrané";
  });

  // Tlačítka „Poptat" na segmentových stránkách ukazují, že služba už v poptávce je.
  document.querySelectorAll("[data-sluzba]:not(.cip)").forEach((tl) => {
    tl.dataset.puvodni ??= tl.textContent;
    const vybrano = jeVKosi(tl.dataset.sluzba, tl.dataset.segment || segmentStranky);
    tl.classList.toggle("je-v-kosi", vybrano);
    tl.textContent = vybrano ? "✓ V poptávce" : tl.dataset.puvodni;
  });
  koren.classList.toggle("ma-kos", polozky.length > 0);

  // Jakmile je něco v poptávce, položky samy říkají, pro koho a o co jde:
  // pole „Poptávám pro" a „O co mám zájem" se schovají. Když se poptávka vyprázdní, vrátí se.
  // Platí pro formulář dole na stránce i pro ten v panelu poptávky.
  document.querySelectorAll(".formular").forEach((f) =>
    ["segment", "sluzba"].forEach((jmeno) => {
      const pole = f.elements[jmeno]?.closest(".pole");
      if (pole) pole.hidden = polozky.length > 0;
    }));

  tlKos.hidden = polozky.length === 0;
  tlKos.textContent = `Poptávám · ${polozky.length}`;
  oknoKos.querySelector(".kos__prazdny").hidden = polozky.length > 0;

  document.querySelectorAll("[data-kos-seznam]").forEach((seznam) => {
    seznam.replaceChildren(...polozky.map((p) => {
      const li = prvek("li");
      const popis = prvek("span", "kos__sluzba", p.sluzba);
      if (p.segment) popis.append(prvek("span", "kos__segment", SEGMENTY[p.segment]?.nazev));
      const pryc = prvek("button", "kos__pryc", "×");
      pryc.type = "button";
      pryc.setAttribute("aria-label", `Odebrat: ${p.sluzba}`);
      pryc.addEventListener("click", () => zmenKos(p.sluzba, p.segment, false));
      li.append(popis, pryc);
      return li;
    }));
  });
}
prekresliKos();

// Popis služby se bere z příslušného řádku segmentové stránky (jeden zdroj textu).
async function ukazDetail(odkaz) {
  const [stranka, kotva] = odkaz.getAttribute("href").split("#");
  const cip = odkaz.closest(".volba")?.querySelector(".cip");
  try {
    const html = await (await fetch(stranka)).text();
    const radek = new DOMParser().parseFromString(html, "text/html").getElementById(kotva);
    const nazev = radek.querySelector("h3")?.firstChild?.textContent?.trim() || cip.dataset.sluzba;
    const text = radek.querySelector("p:not(.navesti), li")?.textContent?.trim() || "";
    const segment = cip.dataset.segment;
    oknoDetail.querySelector("[data-detail-segment]").textContent = SEGMENTY[segment]?.nazev || "";
    oknoDetail.querySelector("[data-detail-nazev]").textContent = nazev;
    oknoDetail.querySelector("[data-detail-text]").textContent = text;
    const a = oknoDetail.querySelector("[data-detail-odkaz]");
    a.href = odkaz.getAttribute("href");
    a.textContent = `Stránka ${SEGMENTY[segment]?.nazev || ""}`;
    const tl = oknoDetail.querySelector("[data-detail-vybrat]");
    const popis = () => tl.textContent = jeVKosi(cip.dataset.sluzba, segment) ? "Odebrat z poptávky" : "Přidat do poptávky";
    tl.onclick = () => { zmenKos(cip.dataset.sluzba, segment); popis(); };
    popis();
    oknoDetail.showModal();
  } catch {
    location.href = odkaz.getAttribute("href"); // když se popis nenačte, zůstane obyčejný odkaz
  }
}

document.addEventListener("click", (e) => {
  const cil = e.target;
  const cip = cil.closest(".cip[data-sluzba]");
  if (cip) return zmenKos(cip.dataset.sluzba, cip.dataset.segment || "");

  const detail = cil.closest(".volba__nazev");
  if (detail) { e.preventDefault(); return ukazDetail(detail); }

  // „Poptat" na segmentových stránkách: přidá nebo odebere službu, koš se neotvírá
  const poptat = cil.closest("[data-sluzba]");
  if (poptat) {
    e.preventDefault();
    return zmenKos(poptat.dataset.sluzba, poptat.dataset.segment || segmentStranky);
  }
  if (cil.closest("[data-otevrit-kos]")) { oznameni.classList.remove("je-videt"); return oknoKos.showModal(); }
  if (cil.closest("[data-zavrit]")) return cil.closest("dialog").close();
  if (cil.matches("dialog.okno")) return cil.close(); // klik mimo obsah okna

  // Přechod na jinou stránku webu: nejdřív se zatáhne opona, pak se teprve odchází.
  const odkaz = cil.closest("a[href]");
  if (!odkaz || bezPohybu || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || odkaz.target) return;
  const kam = new URL(odkaz.href, location.href);
  const cesta = (u) => u.pathname.replace(/index\.html$/, "");
  if (kam.origin !== location.origin || cesta(kam) === cesta(location)) return; // cizí web nebo kotva na téže stránce
  e.preventDefault();
  pamet.uloz("prechod", "1");
  koren.classList.remove("hladce");
  koren.classList.add("odchod");
  setTimeout(() => { location.href = odkaz.href; }, 420);
});

// --- Formuláře: odeslání se zapojí, až bude jasný hosting (PHP / služba) ---
document.addEventListener("submit", (e) => {
  if (!e.target.matches(".formular")) return;
  e.preventDefault();
  const stav = e.target.querySelector(".formular__stav");
  if (stav) stav.textContent = "Slepá šablona: formulář zatím nic neodesílá.";
});

// --- Reference: jeden zdroj data/reference.json ---
// <div class="reference" data-reference="homepage">        → jen označené pro homepage
// <div class="reference" data-reference="bytove-domy-svj"> → jen daný segment
const mista = document.querySelectorAll("[data-reference]");
if (mista.length) {
  try {
    const { reference } = await (await fetch("data/reference.json", { cache: "no-cache" })).json();
    mista.forEach((misto) => {
      const klic = misto.dataset.reference;
      const vyber = reference.filter((r) => (klic === "homepage" ? r.homepage : r.segment === klic));
      misto.replaceChildren(...vyber.map((r) => kartaReference(r, klic === "homepage")));
    });
  } catch (chyba) {
    console.error("Reference se nepodařilo načíst:", chyba);
  }
}

function fotoReference(r, trida) {
  const foto = prvek("div", trida);
  foto.dataset.soubor = r.foto;
  const img = new Image();
  img.alt = r.nazev;
  img.decoding = "async";
  img.fetchPriority = "low"; // načítají se hned po stránce, ne až při dorolování
  img.onerror = () => img.remove();
  img.src = `assets/foto/${r.foto}`;
  foto.append(img);
  return foto;
}

// Karta je krátká: fotka, segment, název, místo. Popis a recenze jsou až v okně po kliknutí.
function kartaReference(r, sOdkazemNaSegment) {
  const karta = prvek("article", "ref");
  karta.tabIndex = 0;
  karta.setAttribute("role", "button");
  karta.setAttribute("aria-label", `${r.nazev}: zobrazit realizaci`);
  karta.append(
    fotoReference(r, "foto foto--4x3 foto--r"),
    prvek("p", "ref__segment", SEGMENTY[r.segment]?.nazev),
    prvek("h3", "ref__nazev", r.nazev),
    prvek("p", "ref__misto", r.misto),
  );
  const otevri = () => ukazRealizaci(r, sOdkazemNaSegment);
  karta.addEventListener("click", otevri);
  karta.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); otevri(); } });
  return karta;
}

let oknoRealizace;
function ukazRealizaci(r, sOdkazemNaSegment) {
  if (!oknoRealizace) {
    oknoRealizace = prvek("dialog", "okno okno--realizace");
    document.body.append(oknoRealizace);
    // Po zavření prohlížeč vrací kurzor na kartu a ta by zůstala zvýrazněná: pustit ho.
    oknoRealizace.addEventListener("close", () => setTimeout(() => document.activeElement?.blur(), 0));
  }
  const zavrit = prvek("button", "okno__zavrit", "×");
  zavrit.type = "button";
  zavrit.dataset.zavrit = "";
  zavrit.setAttribute("aria-label", "Zavřít");
  const obsah = prvek("div", "okno__obsah");
  obsah.append(
    prvek("p", "navesti", `${SEGMENTY[r.segment]?.nazev || ""} · ${r.misto}`),
    prvek("h2", "okno__nadpis", r.nazev),
    prvek("p", "okno__text", r.popis),
  );
  if (r.recenze?.text) {
    const citat = prvek("blockquote", "okno__citat", `„${r.recenze.text}“`);
    citat.append(prvek("cite", "", r.recenze.autor));
    obsah.append(citat);
  }
  if (sOdkazemNaSegment && SEGMENTY[r.segment]) {
    const odkaz = prvek("a", "odkaz", `${SEGMENTY[r.segment].nazev}: další realizace`);
    odkaz.href = `${SEGMENTY[r.segment].stranka}#realizace`;
    obsah.append(odkaz);
  }
  oknoRealizace.replaceChildren(zavrit, fotoReference(r, "foto foto--3x2"), obsah);
  oknoRealizace.showModal();
  oknoRealizace.scrollTop = 0;
}

// =====================================================================
// PŘÍCHOD NA STRÁNKU
// Tady už je načtené písmo i reference, takže se stránka dál nepohne. Poloha se
// srovná naposledy a teprve potom se opona odtáhne. Plynulé rolování se zapíná až teď,
// aby platilo jen pro kliky na kotvy uvnitř stránky, ne pro úvodní usazení.
// =====================================================================
try { await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))]); } catch {}
srovnejPolohu();
setTimeout(() => { // ne requestAnimationFrame: ten v kartě na pozadí neběží a opona by zůstala zatažená
  koren.classList.add("hladce");
  if (!koren.classList.contains("prichod")) return;
  koren.classList.add("odkryt");
  setTimeout(() => koren.classList.remove("prichod", "odkryt"), 650);
}, 30);
// Návrat tlačítkem Zpět vrací stránku z paměti prohlížeče i se zataženou oponou: odtáhnout.
addEventListener("pageshow", (e) => { if (e.persisted) koren.classList.remove("odchod", "prichod", "odkryt"); });
