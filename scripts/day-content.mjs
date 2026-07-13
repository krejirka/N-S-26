/**
 * Ručně upravené popisy programu a tipy na návštěvy.
 * Styl: podstatné jméno / popis („návštěva…“, „přejezd…“, „ubytování…“).
 */

const FUROY_KAIHYTTENE_IMAGE = {
  url: "https://images.bookvisit.com/img/2f1ec132-7c41-4b95-921a-c98b99835b48.jpg",
  alt: "Kaihyttene – Furøy Camping",
  source: "Furøy Camping",
  sourceUrl:
    "https://booking.furoycamp.no/accommodation/room-details?roomid=08de59b5-57c9-09e5-0015-5d8b242d0000",
};

const FUROY_CAMPING_PLACE = {
  name: "Furøy Camping – Kaihyttene",
  tips: [
    "Ubytování v dřevěné chatě Kaihyttene s výhledem na moře",
    "Základna pro výlet na ledovec Svartisen",
    "Klidné pobřeží Meløy – rybářská atmosféra severního Norska",
  ],
  links: [
    { label: "Furøy Camping", url: "https://www.furoycamp.no/" },
    {
      label: "Kaihyttene",
      url: "https://booking.furoycamp.no/accommodation/room-details?roomid=08de59b5-57c9-09e5-0015-5d8b242d0000",
    },
  ],
  image: FUROY_KAIHYTTENE_IMAGE,
};

export const DAY_CONTENT = {
  1: {
    program:
      "Přejezd z Hradce Králové do Rostocku. Nástup na noční trajekt TT Lines do Trelleborgu (odjezd 23:45).",
    logistics: "Trajekt TT Lines · odjezd 23:45",
    lodging: "trajekt — kajuta",
    ferryLink: { label: "TT Lines", url: "https://www.ttline.com/" },
  },
  2: {
    destination: "Oslo (Bærum)",
    lodging: "ubytování",
    program:
      "Přejezd přes Göteborg do oblasti Oslofjordu. Ubytování v Bærum — západní předměstí Oslo s rychlým spojením do centra (metro/lokálka). Večer volitelná krátká procházka po Oslo.",
    logistics: "Trasa přes Göteborg · ubytování v Bærum",
    extraPlaces: [
      {
        name: "Bærum",
        tips: [
          "Sandvika – obchodní centrum a nádraží, výchozí bod do Oslo",
          "Fornebu – pobřežní promenáda u fjordu",
          "Kolbotn nebo Lysaker – další stanice směrem do centra Oslo",
        ],
        links: [
          { label: "Wikipedia", url: "https://no.wikipedia.org/wiki/B%C3%A6rum" },
          { label: "Visit Oslo", url: "https://www.visitoslo.com/" },
        ],
      },
      {
        name: "Göteborg",
        tips: [
          "Haga – historická dřevěná čtvrť s kavárnami",
          "Feskekôrka – rybí tržnice u kanálu",
          "Liseberg – zábavní park v centru města",
          "Götaplatsen – náměstí s koncertní síní",
        ],
        links: [
          { label: "Wikipedia", url: "https://cs.wikipedia.org/wiki/G%C3%B6teborg" },
          { label: "Visit Sweden", url: "https://www.goteborg.com/en/" },
        ],
      },
    ],
    placeTips: {
      Oslo: [
        "Vigelandsparken – sochy Gustava Vigelanda, vstup zdarma",
        "Akershus – středověká pevnost nad fjordem",
        "Operní dům – procházka po střeše a nábřeží Bjørvika",
        "Munchmuseet – sbírka Edvarda Muncha",
        "Karl Johans gate – hlavní třída ke královskému paláci",
      ],
    },
  },
  3: {
    program:
      "Dopolední procházka centrem Oslo (nábřeží, Vigelandsparken nebo Akershus). Odpolední přejezd na sever do Lillehammeru u Mjøsy.",
    placeTips: {
      Lillehammer: [
        "Maihaugen – skanzen s historickými statky",
        "Olympijská bobová dráha",
        "Lillehammer Art Museum",
        "Procházka po břehu Mjøsy",
      ],
    },
  },
  4: {
    program:
      "Túra v národním parku Rondane. Parkoviště Spranget, štěrková cesta k chatě Rondvassbu (cca 7 km tam a zpět, ~2 hodiny, minimální převýšení). Terén vhodný pro psa na vodítku — v oblasti volně žijí sobí.",
    placeTips: {
      "Národní park Rondane": [
        "Túra k Rondvassbu — nejoblíbenější rodinná trasa",
        "Peer Gynt Hytta a vodopád v okolí",
        "Pozorování sobů a vysokohorské tundry",
      ],
    },
  },
  5: {
    program:
      "Zastávka v oblasti Dovrefjell (Hjerkinn). Pěší výstup k pavilonu Viewpoint Snøhetta (1,5 km, +120 m, cca 15–20 minut) s výhledem na horu Snøhetta. Psi venku na úvazích; v kraji divocí pižmoni — bezpečný odstup min. 200 m.",
    placeTips: {
      "Viewpoint Snøhetta (Dovrefjell)": [
        "Pavilon Snøhetta Viewpoint — ikonická architektura",
        "Museet Dovregubben — expozice o pižmonech",
        "Snøhetta (2 286 m) — nejvyšší hora Dovrefjell",
      ],
    },
  },
  6: {
    program:
      "Zastávka Innerdalen — „nejkrásnější údolí Norska“. Parkoviště Nerdalen, pěší túra k chatě Renndølsetra (3,5–4 km, ~1 hodina), výhled na Innerdalstårnet. Celkem 3–4 hodiny včetně návratu.\n\nVečerní příjezd do Trondheimu, procházka historickým centrem.",
    placeTips: {
      Innerdalen: [
        "Túra k Renndølsetra — klasická fjellvandring",
        "Innerdalstårnet — ikonická hora údolí",
        "Vafle v horské chatě Renndølsetra",
      ],
      Trondheim: [
        "Nidarosdomkirke — katedrála sv. Olafa",
        "Bakklandet — barevné domy nad Nidelvou",
        "Gamle Bybro — historický most",
        "Kristiansten festning — pevnost s panoramatem",
        "Rockheim — muzeum populární hudby",
      ],
    },
  },
  7: {
    lodging: "stan",
    program:
      "Pobřežní přejezd norského severu — fjordy, pláže a krátké zastávky na vyhlídkách. Využití místních trajektů místo přeplněného Geirangerfjordu. Zastávka u vodopádu Laksforsen. Noc ve stanu.",
    logistics: "Možnost odpočinku na odpočívadle E6",
    placeTips: {
      Laksforsen: [
        "Vyhlídka nad vodopádem Laksforsen",
        "Krátká procházka po řece Vefsna",
        "Fotografie z oficiální terasy",
      ],
    },
  },
  8: {
    lodging: "Kaihyttene — Furøy Camping",
    program:
      "Přejezd po silnici 17 (Helgelandskysten) na sever. Na závěru trasy dva trajekty — žádný objížďkový přejezd po souši. Příjezd na Furøy Camping, ubytování v chatě Kaihyttene.",
    logistics: "Silnice 17 · 2 trajekty na konci trasy",
    extraPlaces: [FUROY_CAMPING_PLACE],
    placeTips: {
      "Ledovec Svartisen": [
        "Příprava na zítřejší výlet k ledovci Engenbreen",
        "Okolí Meløy — fjordy a pobřežní scenérie",
      ],
    },
  },
  9: {
    lodging: "Kaihyttene — Furøy Camping",
    program:
      "Výlet k ledovci Svartisen. Lodní spoj Isprins přes fjord k molu Engen brygge (10–20 minut, pes povolen). Pěší část podél jezera (cca 5 km) a závěrečné stoupání k modrému ledci Engenbreen — celkem asi 4 hodiny tam a zpět.",
    logistics: "Lodní spoj k ledovci Engenbreen",
    extraPlaces: [FUROY_CAMPING_PLACE],
    placeTips: {
      "Ledovec Svartisen": [
        "Engenbreen — modrý ledovec přístupný z moře",
        "Holandsvika — výchozí bod lodního spoje",
        "Výhled na ledové pole Saltfjellet",
      ],
    },
  },
  10: {
    program:
      "Zastávka v obci Storjord (Saltdal). Nenáročný okruh k vodopádu Kjemåfossen (cca 5 km, +60 m, přes hodinu). Vápencové podloží s vzácnou alpskou flórou.",
    placeTips: {
      Kjemåfossen: [
        "Vodopád Kjemåfossen — jeden z nejvyšších v severním Norsku",
        "Vápencové údolí se vzácnými rostlinami",
        "Nenáročná okružní stezka",
      ],
      Junkerdal: [
        "Junkerdal naturreservat — arktická tundra",
        "Kratší výšlapy v okolí Graddis",
      ],
    },
  },
  11: {
    program:
      "Přejezd do Myrkully u Arvidsjauru — odlehlé ubytování v laplandské přírodě. Odpočinek, rybaření na soukromých jezerech nebo kratší výlet po okolí.",
    placeTips: {
      "Myrkulla (Arvidsjaur)": [
        "Rybaření na třech soukromých jezerech Myrkully (pro hosty zdarma)",
        "Půjčení lodi s veslem nebo motorovým pohonem",
        "Výlet do Arvidsjauru — Lappstaden (největší zákoněná samiijská osada ve Švédsku)",
        "Jezero Hornavan — jedno z nejhlubších jezer Švédska, možnost rybářského průvodce",
        "Guidovaná celodenní výprava — příroda, kulturní místa, husky farmy (od 350 SEK)",
        "Kajak nebo kánoe na propojených jezerech a řekách",
        "Cyklotúry po lesních cestách kolem Myrkully",
      ],
    },
  },
  12: {
    program:
      "Klidový den v Myrkulle — rybaření (okoun, štika), sauna, procházky v lesích nebo celodenní výlet s průvodcem do okolí Arvidsjauru a Arjeplogu.",
    placeTips: {
      "Myrkulla (Arvidsjaur)": [
        "Rybaření z lodi na jezerech Myrkully",
        "Výlet na polární kruh (Arctic Circle) — cca 1,5 hodiny jízdy",
        "Arjeplog — „hlavní město“ švédského jezer a testování aut v zimě",
        "Rafting na řece Piteälven (sezónně)",
        "Pozorování půlnoci slunce — v červenci téměř bez tmy",
      ],
    },
  },
  13: {
    program:
      "Další den v Myrkulle — kombinace rybaření a výletů. Možnost čtyřkolky (quad safari) po lesních cestách nebo vycházka na hřebeny kolem jezer.",
    placeTips: {
      "Myrkulla (Arvidsjaur)": [
        "Quad safari mimo hlavní silnice — rezervace přes Myrkulla",
        "Sběr lesních plodů a houbaření",
        "Koupání v jezeře (v létě příjemná teplota)",
        "Pozorování sobů a losů v okolních lesích",
      ],
    },
  },
  14: {
    program:
      "Poslední den v Myrkulle — ranní rybaření nebo krátký výlet, příprava na delší přejezd na jih Švédska.",
    placeTips: {
      "Myrkulla (Arvidsjaur)": [
        "Ranní vycházka kolem jezer",
        "Doplnění zásob v Arvidsjauru před odjezdem",
        "Návštěva Arvidsjaurs kyrka — dřevěný kostel z 17. století",
      ],
    },
  },
  15: {
    program:
      "Přejezd na jih k pobřeží Höga Kusten. Zastávka v národním parku Skuleskogen — pískovcová štěrbina Slåttdalsskrevan a vyhlídky nad Baltským mořem.",
    placeTips: {
      Skuleskogen: [
        "Slåttdalsskrevan — 200 m hluboká pískovcová rokle",
        "Skuleberget — hora s výhledem na souostroví",
        "Túra Näskezaken — les, skály a moře",
      ],
    },
  },
  16: {
    program:
      "Návštěva Astrid Lindgrens Värld ve Vimmerby — zábavní park s Villou Villekulou a kulisami z filmů. Doba návštěvy minimálně 3–4 hodiny.",
    placeTips: {
      "Astrid Lindgrens Värld": [
        "Villa Villekula — replika slavného domečku",
        "Živá divadla a postavy z knih",
        "Katthult — kulisy z filmů o Emilovi ze Lönnebergy",
      ],
    },
  },
  17: {
    program:
      "Zastávka u megalitické památky Ales Stenar u Kåsebergy — „švédské Stonehenge“ z 59 kamenů ve tvaru lodi na útesu nad mořem. Večerní nástup na trajekt TT Lines Trelleborg–Rostock (odjezd 23:00).",
    logistics: "Trajekt TT Lines · odjezd 23:00",
    ferryLink: { label: "TT Lines", url: "https://www.ttline.com/" },
    placeTips: {
      "Ales Stenar": [
        "Ales stenar — kamenná loď z doby železné",
        "Kåseberga — rybářská vesnice pod útesem",
        "Procházka po pobřežním útesu",
      ],
    },
  },
  18: {
    program: "Příjezd do Rostocku po trajektu TT Lines. Přejezd domů do Hradce Králové.",
    logistics: "",
  },
};

/** Sloučit obsah do dne. */
export function applyDayContent(day) {
  const content = DAY_CONTENT[day.day];
  if (!content) return day;

  if (content.program !== undefined) day.program = content.program;
  if (content.logistics !== undefined) day.logistics = content.logistics;
  if (content.lodging !== undefined) day.lodging = content.lodging;
  if (content.destination !== undefined) day.destination = content.destination;

  if (content.placeTips) {
    for (const place of day.places) {
      const tips = content.placeTips[place.name];
      if (tips?.length) place.tips = tips;
    }
  }

  if (content.extraPlaces?.length) {
    const existing = new Set(day.places.map((p) => p.name));
    for (const extra of content.extraPlaces) {
      if (!existing.has(extra.name)) {
        day.places.unshift(structuredClone(extra));
      }
    }
  }

  if (content.ferryLink) {
    for (const place of day.places) {
      if (/trajekt/i.test(place.name)) {
        place.links = [content.ferryLink];
      }
    }
  }

  return day;
}
