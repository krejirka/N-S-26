/**
 * Ručně upravené popisy dnů (infinitiv) a tipy na návštěvy.
 * Přepisuje Excelové texty ve 2. osobě a doplňuje lokality bez konkrétního programu.
 */

export const DAY_CONTENT = {
  1: {
    program:
      "Vyrazit z Hradce Králové na sever do německého Rostocku a nastoupit na noční trajekt Scandlines do švédského Trelleborgu. Odjezd lodi ve 23:45.",
    logistics: "Odjezd trajektu 23:45",
  },
  2: {
    program:
      "Pokračovat po švédských dálnicích přes Göteborg směrem na Oslo. Po příjezdu krátká večerní procházka po centru nebo odpočinek po dlouhé jízdě.",
    logistics: "Trasa vede přes Göteborg (Göteborg)",
    extraPlaces: [
      {
        name: "Göteborg",
        tips: [
          "Haga – historická dřevěná čtvrť s kavárnami a řemeslnými obchody",
          "Feskekôrka – ikonická rybí tržnice u kanálu",
          "Liseberg – jeden z nejstarších zábavních parků v Evropě",
          "Götaplatsen – náměstí s koncertní síní a muzeem umění",
        ],
        links: [
          { label: "Wikipedia", url: "https://cs.wikipedia.org/wiki/G%C3%B6teborg" },
          { label: "Visit Sweden", url: "https://www.goteborg.com/en/" },
        ],
      },
    ],
    placeTips: {
      Oslo: [
        "Vigelandsparken – 200+ soch Gustava Vigelanda, vstup zdarma",
        "Akershus – středověká pevnost s výhledem na fjord",
        "Operní dům – procházka po střeše a nábřeží Bjørvika",
        "Munchmuseet – sbírka Edvarda Muncha včetně Výkřiku",
        "Karl Johans gate – hlavní třída od nádraží ke královskému paláci",
      ],
    },
  },
  3: {
    program:
      "Dopoledne věnovat procházce centrem Oslo – nábřeží, Vigelandsparken nebo Akershus. Odpoledne přejet na sever do Lillehammeru, olympijského města u Mjøsy.",
    placeTips: {
      Lillehammer: [
        "Maihaugen – skanzen s historickými selskými dvory",
        "Olympijský bobová dráha – sjezd i letní boby",
        "Lillehammer Art Museum – moderní norské umění",
        "Procházka po břehu Mjøsy a centrem města",
      ],
    },
  },
  4: {
    program:
      "Vykonat lehkou túru v národním parku Rondane. Zajet na placené parkoviště Spranget a po široké štěrkové cestě dojít k chatě Rondvassbu (cca 7 km tam a zpět, ~2 hodiny, minimální převýšení). Ideální terén pro psa na vodítku – v oblasti volně žijí sobí.",
    placeTips: {
      "Národní park Rondane": [
        "Túra k Rondvassbu – nejoblíbenější rodinná trasa v parku",
        "Vodopád v oblasti Peer Gynt Hytta",
        "Pozorování sobů a vysokohorské tundry",
      ],
    },
  },
  5: {
    program:
      "Zastavit v oblasti Dovrefjell u Hjerkinnu a vystoupat k architektonickému pavilonu Viewpoint Snøhetta (1,5 km, +120 m, cca 15–20 minut). Uvnitř výhled na horu Snøhetta; psi venku na úvazech. Při pohybu v kraji dodržet odstup minimálně 200 m od divokých pižmonů.",
    placeTips: {
      "Viewpoint Snøhetta (Dovrefjell)": [
        "Pavilon Snøhetta Viewpoint – ikonická architektura v horách",
        "Museet Dovregubben – expozice o pižmonech a tundře",
        "Snøhetta (2 286 m) – nejvyšší hora Dovrefjell",
      ],
    },
  },
  6: {
    program:
      "Po cestě zastavit v Innerdalen, často označovaném jako „nejkrásnější údolí Norska“. Zaparkovat v Nerdalenu (vjezd auty hlouběji zakázán) a pěšky dojít k chatě Renndølsetra (3,5–4 km, ~1 hodina). Výhled na horu Innerdalstårnet, možnost vafle v chatě. Celkem počítat 3–4 hodiny včetně návratu.\n\nVečer přejet do Trondheimu a projít historické centrum.",
    placeTips: {
      Innerdalen: [
        "Túra k Renndølsetra – klasická fjellvandring v alpském údolí",
        "Innerdalstårnet – dominantní jehlová hora údolí",
        "Fotogenní mosty a řeka Innerdalen",
      ],
      Trondheim: [
        "Nidarosdomkirke – gotická katedrála sv. Olafa, patrona Norska",
        "Bakklandet – barevné dřevěné domy nad řekou Nidelvou",
        "Gamle Bybro – starý městský most s výhledem na skládky",
        "Kristiansten festning – pevnost s panoramatem města",
        "Rockheim – muzeum populární hudby v bývalém skladu",
      ],
    },
  },
  7: {
    program:
      "Odpočinkový den s přejezdem norského pobřeží – fjordy, pláže a krátké zastávky na vyhlídkách. Využít místní trajekty místo přeplněného Geirangerfjordu. Zastavit u vodopádu Laksforsen s vyhlídkovou terasou nad řekou Vefsna.",
    logistics: "Možnost bezplatného odpočinku na odpočívadle E6",
    placeTips: {
      Laksforsen: [
        "Vyhlídka přímo nad vodopádem – silný zážitek i za vysoké vody",
        "Krátká procházka po okolních skalách a řece Vefsna",
        "Fotografování z oficiální terasy u parkoviště",
      ],
    },
  },
  8: {
    program:
      "Pokračovat na sever k pobřeží u Furøy. Cesta zahrnuje dva menší trajekty přes fjordy – počítat s delšími zastávkami a scenérií Lofotenského směru.",
    logistics: "2 trajekty na cestě",
    placeTips: {
      "Ledovec Svartisen": [
        "Holandská káťa Svartisen – druhý největší ledovec Norska",
        "Pobřežní výhledy na souostroví a fjordy",
      ],
    },
  },
  9: {
    program:
      "Vydat se k ledovci Svartisen: z přístaviště přejet lodí Isprins přes fjord k molu Engen brygge (10–20 minut, pes povolen). Dále pěšky po rovinaté cestě podél jezera (cca 5 km) a v závěru stoupání k modrému ledci Engenbreen. Celá trasa tam a zpět zabere asi 4 hodiny.",
    logistics: "Lodní spoj k ledovci Engenbreen",
    placeTips: {
      "Ledovec Svartisen": [
        "Engenbreen – modrý ledovec přístupný pěšky z moře",
        "Holandsvika – výchozí bod lodního spoje",
        "Výhled na ledové pole a okolní vrcholy Saltfjellet",
      ],
    },
  },
  10: {
    program:
      "Zastavit v obci Storjord (Saltdal) a vykonat nenáročný okruh k vodopádu Kjemåfossen (cca 5 km, +60 m, přes hodinu). Údolí je geologicky výjimečné vápencovým podložím s vzácnou alpskou flórou.",
    placeTips: {
      Kjemåfossen: [
        "Vodopád Kjemåfossen – jeden z nejvyšších v severním Norsku",
        "Vápencové údolí se vzácnými druhy rostlin",
        "Nenáročná okružní stezka vhodná pro odpočinkový den",
      ],
      Junkerdal: [
        "Junkerdal naturreservat – arktická tundra a horské louky",
        "Možnost kratších výšlapů v okolí Graddis",
      ],
    },
  },
  11: {
    program:
      "Přejet do švédského Myrkully u Arvidsjauru – odlehlé ubytování v laplandské přírodě. Den věnovat odpočinku, procházkám v okolí nebo kratším výletům po lesních cestách.",
    placeTips: {
      "Myrkulla (Arvidsjaur)": [
        "Lappstaden v Arvidsjaur – největší zákoněná samiijská osada ve Švédsku",
        "Jezero Hornavan – jedno z nejhlubších jezer Švédska",
        "Arvidsjaurs kyrka – dřevěný kostel z 17. století",
        "Procházky po lesních cestách a jezeru v okolí Myrkully",
      ],
    },
  },
  12: {
    program: "Klidový den v Myrkulle – odpočinek, sauna, rybaření nebo kratší túra po okolí bez nutnosti přesunu.",
    placeTips: {
      "Myrkulla (Arvidsjaur)": [
        "Pozorování půlnoci slunce (v červenci téměř bez tmy)",
        "Sběr lesních plodů a houbaření v severských lesích",
        "Výlet do Arvidsjauru (cca 50 km) – Lappstaden a muzeum",
      ],
    },
  },
  13: {
    program: "Další den odpočinku v Myrkulle – využít čas na regeneraci před delším přejezdem na jih.",
    placeTips: {
      "Myrkulla (Arvidsjaur)": [
        "Koupání v jezeře (v létě překvapivě příjemná teplota)",
        "Pozorování sobů a ptactva v okolní tundře",
      ],
    },
  },
  14: {
    program: "Poslední den v Myrkulle – připravit se na cestu zpět na jih Švédska.",
    placeTips: {
      "Myrkulla (Arvidsjaur)": [
        "Ranní procházka po okolí chaty",
        "Nákup zásob před delším přejezdem na jih",
      ],
    },
  },
  15: {
    program:
      "Přejet na jih k pobřeží Höga Kusten a zastavit v národním parku Skuleskogen. Projít k pískovcové štěrbině Slåttdalsskrevan a vyjít na vyhlídky nad Baltským mořem.",
    placeTips: {
      Skuleskogen: [
        "Slåttdalsskrevan – 200 m hluboká pískovcová rokle",
        "Skuleberget – hora s výhledem na souostroví",
        "Túra Näskezaken – kombinace lesa, skal a moře",
      ],
    },
  },
  16: {
    program:
      "Navštívit Astrid Lindgrens Värld ve Vimmerby – zábavní park inspirovaný pohádkami (Villa Villekula, Ježíškovo muzeum). Počítat minimálně 3–4 hodiny.",
    placeTips: {
      "Astrid Lindgrens Värld": [
        "Villa Villekula – replika slavného domečku",
        "Živá divadla a postavy z knih Astrid Lindgren",
        "Katthult a další kulisy z filmů o Emilovi ze Lönnebergy",
      ],
    },
  },
  17: {
    program:
      "Zastavit u megalitické památky Ales Stenar na útesu nad mořem u Kåsebergy – „švédské Stonehenge“ z 59 kamenů ve tvaru lodi. Večer nastoupit na trajekt Trelleborg–Rostock (odjezd 23:00).",
    logistics: "Odjezd trajektu 23:00",
    placeTips: {
      "Ales Stenar": [
        "Ales stenar – kamenná loď z doby železné s výhledem na Øresund",
        "Kåseberga – malebná rybářská vesnice pod památkou",
        "Krátká túra po útesu a kolem majáku",
      ],
    },
  },
  18: {
    program: "Po vylodění v Rostocku pokračovat po silnicích domů do Hradce Králové – závěr cesty.",
    logistics: "",
  },
};

/** Sloučit tipy a extra místa do dne. */
export function applyDayContent(day) {
  const content = DAY_CONTENT[day.day];
  if (!content) return day;

  if (content.program !== undefined) day.program = content.program;
  if (content.logistics !== undefined) day.logistics = content.logistics;

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
        day.places.unshift(extra);
      }
    }
  }

  return day;
}
