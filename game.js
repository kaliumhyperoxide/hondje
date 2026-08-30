/* ==========================================================================
   hondje - een 2D platformspel met Jack de hond.
   Gemaakt door Charlie en Silke. Sprite van Jack uit MakeCode Arcade (King Popla).
   De gameplay is overgenomen van "Jacky goes to Heaven" van Guido van Diepen:
   https://guidovandiepen.github.io/jackygoestoheaven/
   Alles (sprites, geluid, levels) zit in code - geen externe bestanden.
   ========================================================================== */
(() => {
"use strict";

/* --------------------------------------------------------------------------
   Constanten
   -------------------------------------------------------------------------- */
const TILE   = 16;
const VIEW_W = 384;          // interne resolutie (24 tiles breed)
const VIEW_H = 224;          // 14 tiles hoog
const ROWS   = VIEW_H / TILE;

const GRAVITY   = 0.36;      // iets luchtiger dan het origineel: Jack zweeft wat langer
const MAX_FALL  = 6.8;
const ACCEL     = 0.42;
const FRICTION  = 0.26;
const MAX_RUN   = 2.4;       // Jack rent harder
const JUMP_V    = -7.1;      // en springt hoger
const STOMP_V   = -4.6;
const COYOTE    = 6;         // frames na het verlaten van de grond
const BUFFER    = 7;         // frames dat een sprongdruk blijft "hangen"
const START_LIVES = 7;       // iets krapper dan het origineel (9)
const HEARTS_PER_LIFE = 15;  // om de 15 botjes een extra leven
const BOSS_JUMPS = 8;        // zo vaak moet je over de stofzuiger springen

const SKATE_MAX  = 3.3;      // topsnelheid op het skateboard (lopend is het 2.4)
const SKATE_FRIC = 0.09;     // op het board rem je zacht af, je glijdt door
const RAMP_LIFT  = 3.4;      // basiskracht van een halfpipe-schans (schaalt mee met je vaart)

const SWIM_SINK = 0.08;      // hoe snel Jack zakt in het water
const SWIM_RISE = 0.36;      // omhoog peddelen met spatie/omhoog ingedrukt
const SWIM_VMAX = 1.8;       // max verticale snelheid in het water
const SWIM_HMAX = 1.7;       // horizontale topsnelheid in het water
const SWIM_DRAG = 0.90;      // horizontale demping per frame in het water

const canvas = document.getElementById("game");
const ctx    = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

/* --------------------------------------------------------------------------
   Sprites: kleine pixelmaps die naar een offscreen canvas worden gebakken
   -------------------------------------------------------------------------- */
/* Jack, de hond (sprite uit het King Popla-project). De frames komen recht uit de MakeCode-Arcade
   sprite (img``): 1 teken = 1 pixel, en dit zijn de kleuren uit het Arcade-palet.
   Jack kijkt in de bron naar links; bakeJack() spiegelt en verkleint hem zodat
   hij past bij de rest van de wereld en naar rechts kijkt (net als de kat). */
const PAL_JACK = { ".": null, "0": null, "1": "#ffffff", "3": "#ff93c4", "d": "#e5cdc4", "e": "#91463d", "f": "#000000" };
// Met een visje op zak knippert Jack goudgeel (het schild).
const PAL_JACK_POWER = { ".": null, "0": null, "1": "#ffe066", "3": "#ff9ab0", "d": "#ffd23f", "e": "#c98a1f", "f": "#241f1c" };

const JACK_STIL = [
  "..................................",
  "....ffff..........................",
  "...fffffff........................",
  "..fffffffff.......................",
  "..ffffffffff......................",
  "..ffefffffff......................",
  "ffffffffffff......................",
  "ffffffffffff......................",
  "ffffffffffffff....................",
  ".fffffffffffffff..................",
  "....fffffffffffffffff.............",
  "....ffdffff11ffffffffff...........",
  ".....1d1ff1d1fffffffffff..........",
  ".....f11fdddefffffffffff..........",
  ".....ffdddddfffffffffffff..f......",
  ".....fddddd1fffffffffffffffd1f....",
  "......ed1dddffffffdfffffff1dde....",
  "......f111d1dfffff1dffffffdddf....",
  ".......fffdd1ffffffd11fffffdd1f...",
  ".......fff1d1f..ffffd1dffff11f....",
  ".......fff11df...fffed1df.fff.....",
  ".......f1f1d1.....f1f1d1f.........",
  ".......f1f111f....f1f111f.........",
  "......ff1f1df....f11f1d1f.........",
  "......ffffdde...ff1ffdd1..........",
  ".....ffffe11ff..fffff11fff........",
  ".......fffffffffffffffff..........",
];
const JACK_W1 = [
  "..................................",
  ".....fffff........................",
  ".....ffffff.......................",
  "....ffffffff......................",
  "..ffffffffffff....................",
  "...ffeffffffff....................",
  "..ffffffffffff....................",
  ".fffffffffffff....................",
  "fffffffffffffff...................",
  "fffffffffffffffff.................",
  "fffffffffffffffffffffff...........",
  ".ffffffffffffffffffffffff.........",
  "..fffffffffffffffffffffffff..fff..",
  ".....ff1ffff1dffffffffffffffffd1f.",
  ".....ff11ff1d1fffffffffffffff11def",
  "......f1df11dffffffffffffffff1ddef",
  "......ffdddddefffffffffffffff111f.",
  ".......f1d1d1d1ffffff1ffffffffff..",
  "......ffff11ddd1ffffff1ffffff.....",
  "......ffffff1df1fff.fffd11d1ff....",
  ".....ff1fffff1d1f....fffe1dddf....",
  "....ff11ff..f1d1f....ffffffddf....",
  "...ff1dff....fd1f...ff1f...fd1f...",
  "..f1dd1f.....fd1f..ff1ff...fddf...",
  "..ff1ef.....f1d1...f1ef....fd1f...",
  "...fffffffffffffffffffffffffff....",
  "....fffff1ffffff1fffffffffffff1...",
];
const JACK_W2 = [
  "..................................",
  "......fffff.......................",
  ".....ffffffff.....................",
  "....ffffffffff....................",
  "...ffffffffffff...................",
  "...ffefffffffff...................",
  "...fffffffffffff.............fff..",
  ".fffff1efffffff.............fddf..",
  "ffffffeffffffff...........ffddd1f.",
  "fffffffffffffffff......ffffd1ddf..",
  ".ffffffffffffffffffffffffffdddd1f.",
  "..ffffffffffffffffffffffffff11fff.",
  "..ff3fffffffff1ffffffffffffff1f...",
  "...ffff1fffff11fffffffffffffff....",
  ".....fff1fff1d1ffffffffffffff.....",
  "......ff1ffd11fffffffffffffff.....",
  ".......f11dddfffffffff1ffffff.....",
  ".......ffdfdddffffffff11fffffff...",
  ".......ffffddd1ffffffffddff1d1ef..",
  "......fffffddd1fffff..ff1d1d11def.",
  ".....fffff11d1f.........ffffffddef",
  "....ffff1dd1ff...............fed1f",
  "....f1d1d1fff.................feff",
  "....feddefff...................ff.",
  ".....ffffff.......................",
  ".......fffffffffffffffffff........",
  ".......ffff1ffffffff11fffff1f.....",
];
const JACK_W3 = [
  "..................................",
  "......ffff........................",
  ".....ffffff.......................",
  "...ffffffffff.....................",
  "...fffffffffff....................",
  "...ffefffffffff...................",
  "...ffffffffffff...................",
  "fffffffffffffff............fff....",
  "ffffffffffffffff..........f111f...",
  "ffffffffffffffffffffff...ffddd1f..",
  ".ffffffffffffffffffffffffff1dd1f..",
  "..fffffffffffffffffffffffff1dd1f..",
  ".....ffffffff1ffffffffffffff111ff.",
  ".....ff1ffffd1fffffffffffffffff...",
  ".....ffd1ffd1ffffffffffffffff.....",
  ".....ffd111d1fffffffffffff........",
  "......f1ddddffffffffd1fffff.......",
  "......ffffdd1fffff1f111ff1fff.....",
  ".....ffff1dddff1fffffed1ddd1f.....",
  "...ffff11d1dfffff....fffef1ddf....",
  "..ffffdd111ff...........fff111f...",
  ".ff11ddefff..............fffddf...",
  "..f1ddfff.................fffff...",
  "..ffefff....................ff....",
  "....ff............................",
  "........ffffffffffffffff..........",
  "......1fffffffffffffffff11........",
];

// Rivaliserende kat: dezelfde vorm, andere kleuren.
const PAL_RIVAL = {
  o: "#14121a",
  w: "#5a5f7a",
  s: "#464b63",
  k: "#22242f",
  b: "#3a3d52",
  p: "#c2566d",
  e: "#ff4d5e",
};

// Romp + kop (rijen 0..12). De poten worden per animatieframe geplakt.
// Staart staat rechtop (2 pixels dik), rug is een rechte lijn.
const JACKY_BODY = [
  "................",
  "...kk...........",
  "..kk....o...o...",
  "..kk...opo.opo..",
  ".kk....obbwwwwwo",
  ".kk....obewwewwo",
  ".kk....owwwwwpwo",
  "..kk...owwwwwwwo",
  "..oooooowwwwwwwo",
  "..owwwwwkkwwwwwo",
  "..owwwwwkkwwwwwo",
  "..owwwwwwwbbbwwo",
  "..owwwwwwwwbbwwo",
];

const JACKY_LEGS = {
  idle: [
    "..owwoowwwwoowwo",
    "..owwo.....owwo.",
    "..osso.....osso.",
  ],
  walkA: [
    ".owwoowwwwoowwo.",
    ".owwo......owwo.",
    "osso.......osso.",
  ],
  walkB: [
    "..owwoowwwwoowwo",
    "...owwo....owwo.",
    "...osso....osso.",
  ],
  jump: [
    "..owwoowwwwoowwo",
    "..owwo.....owwo.",
    "...oo.......oo..",
  ],
};

const PAL_DOG = {
  o: "#2a1b10",
  b: "#a8703c",
  d: "#7a4d26",
  w: "#f0e2cd",
  k: "#1a1410",
  e: "#241f1c",
};

const DOG_BODY = [
  "................",
  "..........oooo..",
  ".........obbbbo.",
  "oo.......obbbbbo",
  ".ob.....obbebbbo",
  ".obbbbbbbbbbbbwo",
  ".obbbbbbbbbbbwko",
  ".obbbbbbbbbbbbbo",
  "..obbbbbbbbbbbo.",
];
const DOG_LEGS = {
  a: ["..oddo...oddo...", "..oddo...oddo...", "..oooo...oooo..."],
  b: [".oddo.....oddo..", ".oddo.....oddo..", ".oooo.....oooo.."],
};

const PAL_BIRD = {
  o: "#161c2c",
  g: "#54739f",
  l: "#7e9fd0",
  y: "#f2a03d",
  e: "#ffffff",
};

const BIRD_BODY = [
  "............",
  "...oooooo...",
  "..oggggggo..",
  ".ogglggegoy.",
  ".oggggggggoy",
  "..oggggggo..",
  "...oooooo...",
  "............",
];

// Eend die op het water dobbert.
const PAL_DUCK = { o: "#2e2113", w: "#fdf5e2", e: "#241f1c", b: "#f0912e", d: "#e6d3a8" };
const DUCK_MAP = [
  "...oooo......",
  "..owwwwo.....",
  ".owwewwo.....",
  "bowwwwwo.....",
  "bowwwwwwooo..",
  ".owwwwwwwwwo.",
  ".owwddddwwwwo",
  "..ooooooooo..",
];

// Botje (hondenkluif) in plaats van een hartje. Var-namen blijven "HEART" zodat
// de rest van de code niet hoeft te veranderen.
const PAL_HEART = { o: "#8a6a2e", r: "#f2e2b0", h: "#fffbe8" };
const HEART_MAP = [
  ".oo.....oo.",
  "ohro...orho",
  "orrrooorrro",
  ".orrrrrrro.",
  "orrrooorrro",
  "ohro...orho",
  ".oo.....oo.",
];

// Visje: geeft Jack tijdelijk een schild tegen één klap. Groter dan een botje, zodat hij goed opvalt.
const PAL_FISH = { o: "#7a4a10", y: "#ffb020", l: "#ffe08a", e: "#1b1b22" };
const FISH_MAP = [
  ".....oooo........",
  "..oooyyyyooo....o",
  ".oyyylyyyyyyo..oy",
  "oyyeyylyyyyyyooyy",
  "oyyyyyyyyyyyooyyy",
  "oyyyyyyyyyyyooyyy",
  "oyyyyyyyyyyyyooyy",
  ".oyyyyyyyyyyo..oy",
  "..oooyyyyooo....o",
  ".....oooo........",
];

// Muisje: rent weg van Jack, vangen geeft +10 botjes. Grijs, zodat hij niet op het gele visje lijkt.
const PAL_MOUSE = { o: "#241f1c", g: "#b8b0c0", d: "#847c94", p: "#f2a3b0", e: "#1b1b22" };
const MOUSE_BODY = [
  "....................",
  "....oo..............",
  "...oppo.............",
  "...oppgoooooo.......",
  "...ogggggggggo......",
  "..egggggggggggo.....",
  ".poggggggggggddd....",
  "..oggggggggggooodd..",
  "...ogggggggggo..oodd",
  "....ooooooooo.....oo",
  "....................",
];

// Auto: rijdt hard over de weg, hier kun je NIET op springen.
const PAL_CAR = {
  o: "#2a1220", r: "#e0452f", d: "#a32a1c", g: "#a9d8f0",
  y: "#ffe36e", k: "#1b1b22", s: "#c9ccd6",
};
const CAR_BODY = [
  "...........oooooooooooooooo.................",
  "..........oggggggggggggggggo................",
  ".........oggggggggggggggggggo...............",
  "........orrggggggggggggggggrro..............",
  ".......orrrggggggggggggggggrrro.............",
  ".......orrrggggggggggggggggrrro.............",
  ".....oorrrrggggggggggggggggrrrroo...........",
  "...oorrrrrrrrrrrrrrrrrrrrrrrrrrrrrroo.......",
  ".oorrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrroo.....",
  "orrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrro..",
  "orrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrro..",
  "orrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrryyyro..",
  "orrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrryyyro..",
  "oddddddddddddddddddddddddddddddddddddddddo..",
  "oddddddddddddddddddddddddddddddddddddddddo..",
  ".oooooooooooooooooooooooooooooooooooooooo...",
  "....ookkkkoo............ookkkkoo............",
  "....okkkkkko............okkkkkko............",
  "....okkkkkko............okkkkkko............",
  "....okkkkkko............okkkkkko............",
  "....ookkkkoo............ookkkkoo............",
  "......oooo................oooo..............",
];

// Eindbaas: de stofzuiger.
const PAL_VAC = {
  o: "#1a1a26", b: "#4a5aa8", d: "#33407a", n: "#c9ccd6",
  e: "#ff4d5e", k: "#1b1b22", g: "#8f9ad8",
};
const VAC_BODY = [
  "....oooooooooooooo........",
  "...obbbbbbbbbbbbbbo.......",
  "..obbbbbbbbbbbbbbbbo......",
  "..obbeebbbbbbeebbbbo......",
  "..obbbbbbbbbbbbbbbboooo...",
  "..obbbbbbbbbbbbbbbbnnnno..",
  "..obbbbbbbbbbbbbbbbnnnno..",
  "..obbbbbbbbbbbbbbbboooo...",
  "..obbbbbbbbbbbbbbbbo......",
  "...obbbbbbbbbbbbbbo.......",
  "...okkobbbbbbokko.........",
  "...okko......okko.........",
  "....oo........oo..........",
];

// hondje: het baasje van Jack. De armen worden in code getekend.
const PAL_CHAR = {
  o: "#3a2a1e", h: "#ffe9a0", s: "#f6cfae", e: "#4aa3ef",
  f: "#dd9a72", t: "#ff8fb0", k: "#5f9be0", b: "#5a4a7a",
};
const CHARLIE_BODY = [
  "....................",
  "........oooo........",
  "......oohhhhoo......",
  ".....ohhhhhhhho.....",
  ".....ohssssssho.....",
  ".....ohsessesho.....",
  ".....ohfssssfho.....",
  ".....ohssoossho.....",
  ".....ohssssssho.....",
  ".....ohossssoho.....",
  ".....oh.ssss.ho.....",
  ".....oh.ssss.ho.....",
  "...ohhhtttttthhho...",
  "...ohhhtttttthhho...",
  "...ohhhtttttthhho...",
  "...ohhhtttttthhho...",
  "...ohhtttttttthho...",
  "...ohhtttttttthho...",
  "...ohhossssssohho...",
  "...ohhossssssohho...",
  "....ohossssssoho....",
  "......osssssso......",
  "....okkkkkkkkko.....",
  "...okkkkkkkkkkko....",
  "..okkkkkkkkkkkkko...",
  ".ooookkkkkkkkkoooo..",
  "......osso.osso.....",
  "......osso.osso.....",
  "......osso.osso.....",
  "......osso.osso.....",
  "......osso.osso.....",
  "......osso.osso.....",
  "......osso.osso.....",
  "......osso.osso.....",
  "......osso.osso.....",
  "......osso.osso.....",
  "......osso.osso.....",
  "......osso.osso.....",
  "......osso.osso.....",
  "......osso.osso.....",
  ".....obbbo.obbbo....",
  ".....ooooo.ooooo....",
];

// Wolkenkrabber op de achtergrond, geïnspireerd op de A'DAM Toren: een smalle
// torenflat met een uitkragend schijfvormig platform en een mast met drie
// Andreaskruisen (het Amsterdamse stadswapen).
const PAL_ADAM_TOWER = {
  o: "#232733", w: "#6a7a94", d: "#e8e6e0", g: "#5a93a8", m: "#cfd3da", x: "#ffcf4d",
};
const ADAM_TOWER_MAP = [
  ".................mm.................",
  ".................mm.................",
  "...............x.mmx................",
  "................xmx.................",
  ".................xm.................",
  "................xmx.................",
  "...............x.mmx................",
  ".................mm.................",
  ".................mm.................",
  ".................mm.................",
  "...............x.mmx................",
  "................xmx.................",
  ".................xm.................",
  "................xmx.................",
  "...............x.mmx................",
  ".................mm.................",
  ".................mm.................",
  ".................mm.................",
  "...............x.mmx................",
  "................xmx.................",
  ".................xm.................",
  "................xmx.................",
  "...............x.mmx................",
  ".................mm.................",
  ".................mm.................",
  ".................mm.................",
  ".dddddddddddddddddddddddddddddddddd.",
  ".dddddddddddddddddddddddddddddddddd.",
  ".dddddddddddddddddddddddddddddddddd.",
  ".dddddddddddddddddddddddddddddddddd.",
  "....gggggggggggggggggggggggggggg....",
  "....gggggggggggggggggggggggggggg....",
  "....gggggggggggggggggggggggggggg....",
  "....gggggggggggggggggggggggggggg....",
  "....gggggggggggggggggggggggggggg....",
  ".dddddddddddddddddddddddddddddddddd.",
  ".dddddddddddddddddddddddddddddddddd.",
  ".dddddddddddddddddddddddddddddddddd.",
  ".dddddddddddddddddddddddddddddddddd.",
  "....................................",
  "........oooooooooooooooooooo........",
  "........oooooooooooooooooooo........",
  "........oooooooooooooooooooo........",
  "........oooooooooooooooooooo........",
  "........oowwoowwoowwoowwoooo........",
  "........oooooooooooooooooooo........",
  "........oooooooooooooooooooo........",
  "........oooooooooooooooooooo........",
  "........oooooooooooooooooooo........",
  "........oooooooooooooooooooo........",
  "........oowwoowwoowwoowwoooo........",
  "........oooooooooooooooooooo........",
  "........oooooooooooooooooooo........",
  "........oooooooooooooooooooo........",
  "........oooooooooooooooooooo........",
  "........oooooooooooooooooooo........",
  "........oowwoowwoowwoowwoooo........",
  "........oooooooooooooooooooo........",
  "........oooooooooooooooooooo........",
  "........oooooooooooooooooooo........",
  "........oooooooooooooooooooo........",
  "........oooooooooooooooooooo........",
  "........oowwoowwoowwoowwoooo........",
  "........oooooooooooooooooooo........",
  "........oooooooooooooooooooo........",
  "........oooooooooooooooooooo........",
  "........oooooooooooooooooooo........",
  "........oooooooooooooooooooo........",
  "........oowwoowwoowwoowwoooo........",
  "........oooooooooooooooooooo........",
  "........oooooooooooooooooooo........",
  "........oooooooooooooooooooo........",
  "........oooooooooooooooooooo........",
  "........oooooooooooooooooooo........",
  "........oowwoowwoowwoowwoooo........",
  "........oooooooooooooooooooo........",
  "........oooooooooooooooooooo........",
  "........oooooooooooooooooooo........",
  "........oooooooooooooooooooo........",
  "........oooooooooooooooooooo........",
  "........oowwoowwoowwoowwoooo........",
  "........oooooooooooooooooooo........",
  "........oooooooooooooooooooo........",
  "........oooooooooooooooooooo........",
  "........oooooooooooooooooooo........",
  "........oooooooooooooooooooo........",
  "........oowwoowwoowwoowwoooo........",
  "........oooooooooooooooooooo........",
  "........oooooooooooooooooooo........",
  "........oooooooooooooooooooo........",
  "........oooooooooooooooooooo........",
  "........oooooooooooooooooooo........",
  "........oowwoowwoowwoowwoooo........",
  "........oooooooooooooooooooo........",
  "........oooooooooooooooooooo........",
  "........oooooooooooooooooooo........",
  "........oooooooooooooooooooo........",
  "........oooooooooooooooooooo........",
  "........oowwoowwoowwoowwoooo........",
  "........oooooooooooooooooooo........",
  "........oooooooooooooooooooo........",
  "........oooooooooooooooooooo........",
  "........oooooooooooooooooooo........",
  "........oooooooooooooooooooo........",
  "........oowwoowwoowwoowwoooo........",
  "........oooooooooooooooooooo........",
  "........oooooooooooooooooooo........",
  "........oooooooooooooooooooo........",
  "........oooooooooooooooooooo........",
  "........oooooooooooooooooooo........",
  "........oowwoowwoowwoowwoooo........",
  "........oooooooooooooooooooo........",
  "........oooooooooooooooooooo........",
  "........oooooooooooooooooooo........",
  "........oooooooooooooooooooo........",
  "........oooooooooooooooooooo........",
  "........oowwoowwoowwoowwoooo........",
  "........oooooooooooooooooooo........",
  "........oooooooooooooooooooo........",
  "........oooooooooooooooooooo........",
  "........oooooooooooooooooooo........",
  "........oooooooooooooooooooo........",
  "........oowwoowwoowwoowwoooo........",
  "........oooooooooooooooooooo........",
  "........oooooooooooooooooooo........",
  "........oooooooooooooooooooo........",
  "........oooooooooooooooooooo........",
  "........oooooooooooooooooooo........",
  "........oowwoowwoowwoowwoooo........",
  "........oooooooooooooooooooo........",
  "........oooooooooooooooooooo........",
  "........oooooooooooooooooooo........",
  "........oooooooooooooooooooo........",
  "........oooooooooooooooooooo........",
  "........oowwoowwoowwoowwoooo........",
  "........oooooooooooooooooooo........",
  "........oooooooooooooooooooo........",
  "........oooooooooooooooooooo........",
  "........oooooooooooooooooooo........",
  "........oooooooooooooooooooo........",
];

// Tuintje bij hondje: witte plantenbak met bloemetjes, bijtje en vogelhuisje.
const PAL_PLANTER = {
  o: "#7a7a86", b: "#f4f4f0", r: "#c7c7c0", d: "#5c4530",
  g: "#4caf50", p: "#ff6f91", y: "#ffcf4d", v: "#c81f4d",
};
const PLANTER_MAP = [
  "................",
  "...........vvv..",
  "....p...y..vpv..",
  "...ppp.yyy..g...",
  "....g...g...g...",
  "..dddddddddddd..",
  ".obbbbbbbbbbbbo.",
  ".obbbbbbbbbbbbo.",
  ".obbbbbbbbbbbbo.",
  ".obbbbbbbbbbbbo.",
  ".rrrrrrrrrrrrrr.",
];

const PAL_BEE = { o: "#241f1c", y: "#ffcf4d", w: "#eef3ff" };
const BEE_MAP = [
  "..ww.ww.",
  ".oyoyoyo",
  "oyoyoyoo",
  ".oyoyoyo",
  "..oooo..",
];

const PAL_BIRDHOUSE = {
  r: "#c0392b", w: "#c9a06b", d: "#7a4a2a", k: "#241f1c", s: "#9a9aa4",
};
const BIRDHOUSE_MAP = [
  "..................",
  "..................",
  "..................",
  "..................",
  "..................",
  "..................",
  "..................",
  "..................",
  ".rrrrrrrrrrrrrrrr.",
  ".rrrrrrrrrrrrrrrr.",
  "..rrrrrrrrrrrrrr..",
  "...wwwwwwwwwwww...",
  "...wwwwwwwwwwww...",
  "...wwwwwwwwwwww...",
  "...wwwwwwwwwwww...",
  "...wwwwwkkwwwww...",
  "...wwwwwkkwwwww...",
  "...wwwwdwwwwwww...",
  "...wwwwwwwwwwww...",
  "...wwwwwwwwwwww...",
  "........ww........",
  "........ww........",
  "........ww........",
  "........ww........",
  "........ww........",
  "........ww........",
  "........ww........",
  "........ww........",
  "........ww........",
  "........ww........",
  "........ww........",
  "........ww........",
  "........ww........",
  "........ww........",
  "........ww........",
  "........ww........",
  "ssssssssssssssssss",
  "ksssksssksssksssks",
  "ssssssssssssssssss",
  "ssssssssssssssssss",
  "ksssksssksssksssks",
  "ssssssssssssssssss",
  "ssssssssssssssssss",
  "ksssksssksssksssks",
];

// Musje: hergebruikt de vorm van de vogel, maar dan bruin/beige.
const PAL_SPARROW = { o: "#241f1c", g: "#8a6a4a", l: "#c9a878", y: "#5c4530", e: "#ffffff" };

// Olijfboom: dikke bruine stam in een grote witte pot, naast de plantenbak.
const PAL_OLIVE = { o: "#4a5a32", g: "#8a9a5b", l: "#6f7d47", e: "#332818", d: "#6b4a2a", w: "#f4f4f0" };
const OLIVE_TREE_MAP = [
  "................................",
  "................o...............",
  "...........oooogggoooo..........",
  ".........oogggggggggggoo........",
  ".......oogggggggggggggggoo......",
  "......oogggggggggggggggggoo.....",
  ".....oggggggggggggeggggggggo....",
  "....ooggggggggggggggglgggggoo...",
  "....ogggggggggggggggggggggggo...",
  "...ogggggglggggggggggggggggggo..",
  "...ogggggggggggggggggggggggggo..",
  "...ogggggggggggggggggggggegggo..",
  "..oogggggggggggggggggggggggggoo.",
  "..ogggggggggggggggggggggggggggo.",
  "..ooggggegggggggggggggglgggggoo.",
  "...ogggggggggggggggggggggggggo..",
  "...ogggggggggggggggggggggggggo..",
  "...oggggggggglgggggggggggggggo..",
  "....ogggggggggggggggggggggggo...",
  "....oogggggggggegggggggggggoo...",
  ".....ogggggggggggggggggggggo....",
  "......oogggggggggggggggggoo.....",
  ".......oogggggggggggggggoo......",
  ".........oogggggggggggoo........",
  "...........ooodddddooo..........",
  "..............ddddd.............",
  "..............ddddd.............",
  "..............ddddd.............",
  "..............ddddd.............",
  "..............ddddd.............",
  ".............ddddddd............",
  ".............ddddddd............",
  ".............ddddddd............",
  ".............ddddddd............",
  ".............ddddddd............",
  ".............ddddddd............",
  ".....oooooooooooooooooooooo.....",
  ".....owwwwwwwwwwwwwwwwwwwwo.....",
  ".....owwwwwwwwwwwwwwwwwwwwo.....",
  ".....owwwwwwwwwwwwwwwwwwwwo.....",
  ".....owwwwwwwwwwwwwwwwwwwwo.....",
  ".....owwwwwwwwwwwwwwwwwwwwo.....",
  ".....owwwwwwwwwwwwwwwwwwwwo.....",
  "...oooooooooooooooooooooooooo...",
];

/** Bakt een pixelmap naar een canvas zodat we hem snel kunnen blitten. */
function bake(rows, palette) {
  const w = Math.max(...rows.map(r => r.length));
  const h = rows.length;
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const g = c.getContext("2d");
  for (let y = 0; y < h; y++) {
    const row = rows[y];
    for (let x = 0; x < row.length; x++) {
      const col = palette[row[x]];
      if (!col) continue;
      g.fillStyle = col;
      g.fillRect(x, y, 1, 1);
    }
  }
  return c;
}

/** Bouwt de vier kattenframes (romp + wisselende poten). */
function bakeCat(pal) {
  const out = {};
  for (const key of Object.keys(JACKY_LEGS)) {
    out[key] = bake(JACKY_BODY.concat(JACKY_LEGS[key]), pal);
  }
  return out;
}

/** Bakt Jack: 4 frames, gespiegeld (kijkt dan naar rechts) en verkleind naar
    ~18px zodat hij bij de tegels van 16px past. */
function bakeJack(pal) {
  const SC = 18 / 34;                       // bronbreedte is 34
  const frames = { idle: JACK_STIL, walkA: JACK_W1, walkB: JACK_W3, jump: JACK_W2 };
  const out = {};
  for (const key of Object.keys(frames)) {
    const src = bake(frames[key], pal);
    const w = Math.round(src.width * SC), h = Math.round(src.height * SC);
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const g = c.getContext("2d");
    g.imageSmoothingEnabled = false;
    g.translate(w, 0); g.scale(-1, 1);      // horizontaal spiegelen
    g.drawImage(src, 0, 0, w, h);
    out[key] = c;
  }
  return out;
}

const SPR = {
  jacky: bakeJack(PAL_JACK),
  jackyPower: bakeJack(PAL_JACK_POWER),
  rival: bakeCat(PAL_RIVAL),
  dog: {
    a: bake(DOG_BODY.concat(DOG_LEGS.a), PAL_DOG),
    b: bake(DOG_BODY.concat(DOG_LEGS.b), PAL_DOG),
  },
  bird: bake(BIRD_BODY, PAL_BIRD),
  duck: bake(DUCK_MAP, PAL_DUCK),
  sparrow: bake(BIRD_BODY, PAL_SPARROW),
  heart: bake(HEART_MAP, PAL_HEART),
  fish: bake(FISH_MAP, PAL_FISH),
  mouse: bake(MOUSE_BODY, PAL_MOUSE),
  car: bake(CAR_BODY, PAL_CAR),
  vac: bake(VAC_BODY, PAL_VAC),
  charlie: bake(CHARLIE_BODY, PAL_CHAR),
  adamTower: bake(ADAM_TOWER_MAP, PAL_ADAM_TOWER),
  planter: bake(PLANTER_MAP, PAL_PLANTER),
  bee: bake(BEE_MAP, PAL_BEE),
  birdhouse: bake(BIRDHOUSE_MAP, PAL_BIRDHOUSE),
  oliveTree: bake(OLIVE_TREE_MAP, PAL_OLIVE),
};

/** Tekent een gebakken sprite, eventueel gespiegeld. Alles op hele pixels. */
function blit(spr, x, y, flip, scale = 1) {
  x = Math.round(x); y = Math.round(y);
  const w = spr.width * scale, h = spr.height * scale;
  if (flip) {
    ctx.save();
    ctx.translate(x + w, y);
    ctx.scale(-1, 1);
    ctx.drawImage(spr, 0, 0, w, h);
    ctx.restore();
  } else {
    ctx.drawImage(spr, x, y, w, h);
  }
}

/* --------------------------------------------------------------------------
   Handgetekende achtergronden (foto's van tekeningen van Charlie & Silke).
   Een level met `bg: "bestand.jpg"` gebruikt die tekening i.p.v. de lucht/heuvels.
   -------------------------------------------------------------------------- */
const BG_IMAGES = {};
function loadBg(src) {
  if (!BG_IMAGES[src]) { const i = new Image(); i.src = src; BG_IMAGES[src] = i; }
  return src;
}

/* --------------------------------------------------------------------------
   Levels
   Tekens: # grond   = zwevend platform   ~ water (gevaarlijk)
           P start   H botje   D hond   B vogel   C rivaliserende kat
           S skateboard   J halfpipe-schans (zet er grond onder!)
           G eindpoort  (einde level)    . leeg
   -------------------------------------------------------------------------- */
const LEVELS = [
  {
    name: "Het Grote Grasveld",
    sky: ["#8fd3ff", "#dff2ff"],
    bg: loadBg("achtergrond-grasveld.jpg"), bgHorizon: 0.64,
    hill: "#63b85f", hillDark: "#4a8f47",
    grass: "#5cc450", grassDark: "#43a03c",
    dirt: "#9c6b43", dirtDark: "#77502f",
    deep: "#2f2117",
    rows: [
      "....................|....................|....................|....................|....................|....................",
      "....................|....................|....................|....................|....................|....................",
      "....................|....................|....................|....................|....................|....................",
      "....................|....................|....................|....................|....................|....................",
      "....................|....................|....................|....................|....................|....................",
      "....................|........HHH.........|....................|....................|........HHH.........|....................",
      "....................|........===.........|....................|....................|........===.........|....................",
      "....................|....................|....................|.....HH.............|....................|....................",
      ".....HH.............|....................|......HH............|.....==.............|.....HH.............|.........HHH........",
      ".....==.............|...H................|......==............|...HH...............|.....==.............|.........===........",
      "....................|...==...............|....................|...==......H........|.............H......|....H...............",
      "..P...S....H...H....|......D.J.....H.....|..H......H....D.....|..S.H...J....H......|..D....J.H.....H....|....H....D.....H.G..",
      "####################|##########..########|########~~~#########|####################|###########..#######|####################",
      "####################|##########..########|########~~~#########|####################|###########..#######|####################",
    ],
  },
  {
    name: "Het Grote Meer",
    sky: ["#7ec8f0", "#cdeeff"],
    swim: true,                    // hier is water NIET dodelijk: Jack zwemt erin
    hill: "#5a86b0", hillDark: "#456a8f",
    grass: "#6fae6a", grassDark: "#4f8a4a",
    dirt: "#7a5a3a", dirtDark: "#5a4228",
    deep: "#173650",
    // waterlelie-bladeren: rustpunten waar je van onderaf op kunt klimmen (blokkeren niet zijwaarts)
    platforms: [
      { x: 300,  y: 132, w: 34, h: 6, axis: "x", range: 0, speed: 0 },
      { x: 780,  y: 130, w: 34, h: 6, axis: "x", range: 0, speed: 0 },
      { x: 1260, y: 132, w: 34, h: 6, axis: "x", range: 0, speed: 0 },
    ],
    rows: [
      "....................|....................|....................|....................|....................|....................",
      "....................|....................|....................|....................|....................|....................",
      "....................|....................|....................|....................|....................|....................",
      "....................|....................|....................|....................|....................|....................",
      "....................|....................|....................|....................|....................|....................",
      "....................|.........B..........|....................|....................|....................|.B..................",
      "....................|....................|....................|....................|....................|....................",
      "....................|....................|....................|....................|....................|....................",
      "....~~~~~E~~~~~~~~~~|~~~~~E~~~~~~~~~~~~~~|~~~~~E~~~~~~~~~~~~~~|~~~E~~~~~~~~~~~~~~~~|E~~~~~~~~~~~~~~~~E~~|~~~~~~~~~E~~~.......",
      "....~~~~~~~H~~~~~~~~|~~~~~~~~~~~~~~~~H~~~|~~~~~~~~~~~~~~~~~~~~|~H~~~~~~~~~~~~~~~~~~|~~~~~~~~H~~~~~~~~~~~|~~~~~~~~~~~~~.......",
      "....~~~~~~~~~~~~~~~H|~~~~~~~~~~~~~~~~~~~~|~~~~H~~~~~~~~~~~~~~~|~~~~~~~~~~H~F~~~~~~~|~~~~~~~~~~~~~~~~H~~~|~~~~~~~~~~~~~.......",
      "..P.~~~~~~~~~~~~~~~~|~~~~~~~H~~~~~~~~~~~~|~~~~~~~~~~~~H~~~~~~~|~~~~~~~~~~~~~~~~~~~H|~~~~~~~~~~~~~~~~~~~~|~~~~~H~~~~~~~...G...",
      "#####~~~~~~~~~~~~~~~|~~~~~~~~~~~~~~~~~~~~|~~~~~~~~~~~~~~~~~~~~|~~~~~~~~~~~~~~~~~~~~|~~~~~~~~~~~~~~~~~~~~|~~~~~~~~~~~~~#######",
      "####################|####################|####################|####################|####################|####################",
    ],
  },
  {
    name: "Langs de Beek",
    sky: ["#f4b8c8", "#ffe0d0"],
    bg: loadBg("achtergrond-beek-v2.jpg"), bgHorizon: 0.42,
    hill: "#7bbf5e", hillDark: "#5c9a45",
    grass: "#6fc24f", grassDark: "#4f9c37",
    dirt: "#7a5a38", dirtDark: "#5a4228",
    deep: "#3a2c1c",
    rows: [
      "....................|....................|....................|....................|....................|....................",
      "....................|....................|....................|....................|....................|....................",
      "....................|....................|....................|....................|....................|....................",
      "....................|....................|....................|....................|....................|....................",
      "....................|....................|....................|....................|....................|....................",
      "....................|.........B..........|....................|.......B............|....................|.........B..........",
      "....................|........HHH.........|....................|....................|........HHH.........|....................",
      "....................|........===.........|....................|.....HH.............|........===.........|....................",
      ".......B............|....................|.......F............|.....==.............|....................|.......HH...........",
      ".....HH.............|....................|.......==...........|....................|.....HH.............|.......==...........",
      ".....==.............|....H......H........|....................|...H.....H..........|.....==.............|....H...............",
      "..P......H.....H....|.....H.........H....|...H......H....H....|....H..........H....|...H......H....H....|.....H.........G....",
      "##################~~|##############~~####|########~~##########|###########~~#######|#######~~###########|#########~~#########",
      "##################~~|##############~~####|########~~##########|###########~~#######|#######~~###########|#########~~#########",
    ],
  },
  {
    name: "In de Boomkruinen",
    sky: ["#bcd9ea", "#d6e7ef"],
    bg: loadBg("achtergrond-boomkruinen.jpg"), bgFill: true,
    hill: "#5c9a4a", hillDark: "#447038",
    grass: "#6ab04a", grassDark: "#4f8a37",
    dirt: "#6b4a2a", dirtDark: "#4e3720",
    deep: "#cfe8bf",   // je bent hoog in de bomen: onder je een groene waas
    noGround: true,    // geen grond: alleen vaste zwevende takken (= tegels)
    platforms: [],
    cloudPlatforms: [],
    // Een doorlopende "takkenvloer" op rij 11: je kunt hier niet naar beneden vallen.
    // De hoogere takjes (rij 8-9) zijn optioneel, om botjes te pakken. Alleen de
    // vogels zijn gevaarlijk.
    rows: [
      "................|................|................|................|................|................",
      "................|................|................|................|................|................",
      "................|................|................|................|................|................",
      "................|................|................|................|................|................",
      "................|................|................|................|................|................",
      "................|................|................|................|................|................",
      "................|.........B......|................|......B.........|................|................",
      ".......H........|..........H.....|........H.......|....H...........|.....H..........|........H.......",
      "......====......|................|.......====.....|................|....====........|................",
      "................|.........====...|................|...====.........|................|.......====.....",
      ".P..............|................|................|................|................|............G...",
      "================|================|================|================|================|================",
      "................|................|................|................|................|................",
      "................|................|................|................|................|................",
    ],
  },
  {
    name: "Terug door de Stad",
    sky: ["#39406e", "#ef9d6f"],
    hill: "#464b78", hillDark: "#33375c",
    grass: "#69788c", grassDark: "#4d5a6b",
    dirt: "#585161", dirtDark: "#413c4b",
    deep: "#201d29",
    rows: [
      "....................|....................|....................|....................|....................|....................",
      "....................|....................|....................|....................|....................|....................",
      "....................|....................|....................|....................|....................|....................",
      "....................|....................|....................|....................|....................|....................",
      "....................|....................|....................|....................|....................|....................",
      "....................|....................|.......HHHH.........|....................|........HHHH........|....................",
      "....................|....................|.......====.........|....................|........====........|....................",
      "....................|....................|....................|......HH............|....................|....................",
      ".......HH...........|....................|....................|......==............|....................|.......HHH..........",
      ".......==...........|.....HH.............|....HH..............|....................|....HH..............|.......===..........",
      "....................|.....==......HH.....|....==..............|...H......==........|....==..............|....................",
      "..P.S...H...C...H...|..A....H......JC....|..H....C....H...A...|....J..H....C....A..|..A....H....C...JH..|..C....H....A...G...",
      "#########..#########|#######..###########|##########..########|########..##########|###########..#######|####################",
      "#########..#########|#######..###########|##########..########|########..##########|###########..#######|####################",
    ],
  },
];

/* Vlakke arena's voor de eindbaas en voor hondje: precies één scherm breed. */
const FLAT_ROWS = [
  "........................",
  "........................",
  "........................",
  "........................",
  "........................",
  "........................",
  "........................",
  "........................",
  "........................",
  "........................",
  "........................",
  "..P.....................",
  "########################",
  "########################",
];

const BOSS_STAGE = {
  name: "De Stofzuiger",
  sky: ["#4a3a6b", "#c98ab0"],
  hill: "#5c4a7a", hillDark: "#42355c",
  grass: "#8a7ab0", grassDark: "#6b5c8f",
  dirt: "#7a6a9a", dirtDark: "#5c4f78",
  deep: "#2a2340",
  rows: FLAT_ROWS,
};

const CHARLIE_STAGE = {
  name: "Thuis",
  sky: ["#ffb3d0", "#fff0c4"],
  hill: "#e0a6d8", hillDark: "#c186c0",
  grass: "#9adcc6", grassDark: "#77b8a4",
  dirt: "#d8b6e0", dirtDark: "#b593c4",
  deep: "#8a6fa0",
  checkerFloor: true,   // stenen terras: afwisselend witte en blauwe tegels
  checkerLight: "#f4f7ff", checkerDark: "#3f6fb8",
  noGround: true,        // geen heuvels: dan lijkt het duidelijk een terras i.p.v. een heuvel
  rows: FLAT_ROWS,
};

/* --------------------------------------------------------------------------
   Geluid (WebAudio, alles synthetisch)
   -------------------------------------------------------------------------- */
const Sound = {
  ctx: null,
  on: true,
  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) this.ctx = new AC();
  },
  tone(freq, dur, type = "square", vol = 0.05, slideTo = null, delay = 0) {
    if (!this.on || !this.ctx) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  },
  jump()  { this.tone(320, 0.14, "square", 0.05, 720); },
  heart() { this.tone(880, 0.07, "square", 0.05); this.tone(1320, 0.12, "square", 0.05, null, 0.07); },
  stomp() { this.tone(180, 0.12, "square", 0.06, 70); },
  hurt()  { this.tone(400, 0.35, "sawtooth", 0.06, 90); },
  meow()  { this.tone(620, 0.18, "sine", 0.06, 380); },
  bark()  { this.tone(300, 0.09, "square", 0.07, 150); this.tone(260, 0.11, "square", 0.07, 120, 0.12); },
  quack() { this.tone(420, 0.09, "sawtooth", 0.045, 300); this.tone(360, 0.10, "sawtooth", 0.045, 260, 0.09); },
  splash(){ this.tone(600, 0.14, "sine", 0.05, 180); },
  gate()  { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.20, "square", 0.05, null, i * 0.11)); },
  extraLife() { [659, 880, 1175].forEach((f, i) => this.tone(f, 0.16, "triangle", 0.06, null, i * 0.09)); },
  power() { [740, 988, 1480].forEach((f, i) => this.tone(f, 0.14, "sine", 0.06, null, i * 0.07)); },
  shield() { this.tone(520, 0.16, "square", 0.05, 220); },
  dodge() { this.tone(700, 0.09, "square", 0.045, 1100); },
  vacuum(){ this.tone(90, 0.30, "sawtooth", 0.035, 130); },
  boom()  { this.tone(160, 0.5, "sawtooth", 0.07, 40); },
  hug()   { [523, 587, 659, 784, 880].forEach((f, i) => this.tone(f, 0.24, "sine", 0.06, null, i * 0.13)); },
  win()   { [523, 659, 784, 1047, 1319, 1047, 1319, 1568].forEach((f, i) => this.tone(f, 0.28, "triangle", 0.06, null, i * 0.16)); },
  over()  { [392, 330, 262, 196].forEach((f, i) => this.tone(f, 0.35, "square", 0.06, null, i * 0.20)); },
};

/* --------------------------------------------------------------------------
   Invoer
   -------------------------------------------------------------------------- */
const keys = { left: false, right: false, jump: false };
let jumpPressed = false;   // stijgende flank van de sprongtoets

const KEYMAP = {
  ArrowLeft: "left", KeyA: "left",
  ArrowRight: "right", KeyD: "right",
  ArrowUp: "jump", KeyW: "jump", Space: "jump",
};

addEventListener("keydown", (e) => {
  // Naam intypen voor de topscorelijst: alle andere toetsen even negeren.
  if (game.state === STATE.NAME) {
    e.preventDefault();
    if (e.code === "Enter") { submitName(); return; }
    if (e.code === "Backspace") { nameEntry = nameEntry.slice(0, -1); return; }
    if (/^[a-zA-Z0-9 ]$/.test(e.key) && nameEntry.length < 8) nameEntry += e.key;
    return;
  }

  const k = KEYMAP[e.code];
  if (k) {
    e.preventDefault();
    if (k === "jump" && !keys.jump) jumpPressed = true;
    keys[k] = true;
    Sound.init();
  }
  if (e.code === "KeyP" || e.code === "Escape") togglePause();
  if (e.code === "KeyM") { Sound.on = !Sound.on; }
  if (e.code === "KeyR") { Sound.init(); restartGame(); }
  if (e.code === "Enter" || e.code === "Space") { Sound.init(); confirmScreen(); }
});
addEventListener("keyup", (e) => {
  const k = KEYMAP[e.code];
  if (k) { e.preventDefault(); keys[k] = false; }
});

// Aanraakbediening
function bindTouch(id, key) {
  const el = document.getElementById(id);
  if (!el) return;
  const down = (e) => {
    e.preventDefault();
    document.body.classList.add("touch");
    Sound.init();
    if (key === "jump" && !keys.jump) jumpPressed = true;
    keys[key] = true;
    confirmScreen();
  };
  const up = (e) => { e.preventDefault(); keys[key] = false; };
  el.addEventListener("touchstart", down, { passive: false });
  el.addEventListener("touchend", up, { passive: false });
  el.addEventListener("touchcancel", up, { passive: false });
  el.addEventListener("mousedown", down);
  addEventListener("mouseup", up);
}
bindTouch("btn-left", "left");
bindTouch("btn-right", "right");
bindTouch("btn-jump", "jump");
addEventListener("touchstart", () => document.body.classList.add("touch"), { once: true });
canvas.addEventListener("pointerdown", () => { Sound.init(); confirmScreen(); });

/* --------------------------------------------------------------------------
   Spelstatus
   -------------------------------------------------------------------------- */
const STATE = {
  TITLE: "title", STORY: "story", INTRO: "intro", PLAY: "play", DEAD: "dead",
  CLEAR: "clear", BOSS: "boss", BOSSWIN: "bosswin", CHARLIE: "charlie",
  HUG: "hug", OVER: "over", WIN: "win", NAME: "name", SCORES: "scores",
};

const game = {
  state: STATE.TITLE,
  timer: 0,
  levelIndex: 0,
  lives: START_LIVES,
  hearts: 0,
  paused: false,
  frame: 0,
  stage: "level",    // "level" | "boss" | "charlie"
  popup: { text: "", timer: 0, color: "#ffe36e" },   // korte melding boven in beeld (extra leven, schild, botjes...)
  finished: false,   // heeft de speler de hemel gehaald?
};

/** Toont kort een melding boven in beeld, bijvoorbeeld bij een extra leven of het vissenschild. */
function showPopup(text, color = "#ffe36e") {
  game.popup.text = text;
  game.popup.color = color;
  game.popup.timer = 90;
}

/* --------------------------------------------------------------------------
   Topscores (in localStorage)
   -------------------------------------------------------------------------- */
const SCORE_KEY = "jack-op-avontuur-scores";
const MAX_SCORES = 10;

function loadScores() {
  try {
    const raw = localStorage.getItem(SCORE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch (e) { return []; }
}
function saveScores(list) {
  try { localStorage.setItem(SCORE_KEY, JSON.stringify(list.slice(0, MAX_SCORES))); }
  catch (e) { /* privé-modus: dan onthouden we het gewoon niet */ }
}
/** Sorteert hoog-naar-laag; wie uitgespeeld heeft wint bij gelijk aantal. */
function sortScores(list) {
  return list.sort((a, b) => (b.hearts - a.hearts) || (b.finished - a.finished));
}
function qualifies(hearts) {
  const list = sortScores(loadScores());
  return list.length < MAX_SCORES || hearts > list[list.length - 1].hearts;
}
function addScore(name, hearts, finished, level) {
  const list = sortScores(loadScores());
  list.push({ name: name || "JACK", hearts, finished, level, date: Date.now() });
  const sorted = sortScores(list).slice(0, MAX_SCORES);
  saveScores(sorted);
  return sorted;
}

let scoreList = [];      // wordt gevuld als het scorescherm getoond wordt
let nameEntry = "";      // naam die de speler intypt
let newScoreIndex = -1;  // welke regel net is toegevoegd (om te laten oplichten)

let level = null;   // huidige, geparste level
let player = null;

/* --------------------------------------------------------------------------
   Level parsen
   -------------------------------------------------------------------------- */
function parseLevel(def) {
  // De '|' in de leveldata is puur voor de leesbaarheid van de bron.
  const rows = def.rows.map(r => r.split("|").join(""));
  const width = Math.max(...rows.map(r => r.length));
  const grid = rows.map(r => r.padEnd(width, ".").split(""));

  const lvl = {
    def, width, height: grid.length, grid,
    hearts: [], fish: [], mice: [], enemies: [], particles: [],
    skates: [], ramps: [], ducks: [],
    gate: null, spawn: { x: 32, y: 32 },
    clouds: [], decor: [],
    platforms: (def.platforms || []).map(makeMovingPlatform),
    cloudPlatforms: (def.cloudPlatforms || []).map(makeCloudPlatform),
  };

  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < width; x++) {
      const ch = grid[y][x];
      const px = x * TILE, py = y * TILE;
      switch (ch) {
        case "P": lvl.spawn = { x: px + 2, y: py + 3 }; grid[y][x] = "."; break;
        case "H": lvl.hearts.push({ x: px + 4, y: py + 4, w: 9, h: 8, got: false, t: Math.random() * 6 }); grid[y][x] = "."; break;
        case "F": lvl.fish.push({ x: px - 1, y: py + 2, w: 17, h: 10, got: false, expired: false, life: 0, t: Math.random() * 6 }); grid[y][x] = "."; break;
        case "M": lvl.mice.push(makeMouse(px, py)); grid[y][x] = "."; break;
        case "E": lvl.ducks.push(makeDuck(px, py)); grid[y][x] = "."; break;
        case "S": lvl.skates.push({ x: px + 1, y: py + 6, w: 15, h: 8, got: false, t: Math.random() * 6 }); grid[y][x] = "."; break;
        case "J": lvl.ramps.push({ x: px - 3, y: py - 6, w: TILE + 6, h: TILE + 10 }); grid[y][x] = "."; break;
        case "D": lvl.enemies.push(makeDog(px, py)); grid[y][x] = "."; break;
        case "B": lvl.enemies.push(makeBird(px, py)); grid[y][x] = "."; break;
        case "C": lvl.enemies.push(makeRival(px, py)); grid[y][x] = "."; break;
        case "A": lvl.enemies.push(makeCar(px, py)); grid[y][x] = "."; break;
        case "G":
          lvl.gate = { x: px - 8, y: py - 40, w: 30, h: 56 };
          // De trigger loopt van boven tot onder, zodat je er niet overheen springt.
          lvl.gateZone = { x: px - 10, y: 0, w: 34, h: grid.length * TILE };
          grid[y][x] = ".";
          break;
      }
    }
  }

  // Achtergronddecor: wolken en struiken/bomen, deterministisch verdeeld.
  for (let i = 0; i < Math.ceil(width / 6); i++) {
    lvl.clouds.push({
      x: i * 6 * TILE + (i * 37) % 60,
      y: 12 + ((i * 53) % 70),
      s: 0.4 + ((i * 17) % 10) / 14,
    });
  }
  for (let x = 2; x < width - 2; x += 5) {
    if (isSolid(lvl, x, ROWS - 2) && !isSolid(lvl, x, ROWS - 3)) {
      lvl.decor.push({ x: x * TILE + ((x * 13) % 8), kind: (x * 7) % 3 });
    }
  }
  return lvl;
}

function tileAt(lvl, tx, ty) {
  if (tx < 0 || tx >= lvl.width || ty < 0 || ty >= lvl.height) return ".";
  return lvl.grid[ty][tx];
}
function isSolid(lvl, tx, ty) {
  const t = tileAt(lvl, tx, ty);
  return t === "#" || t === "=";
}
function isWater(lvl, tx, ty) { return tileAt(lvl, tx, ty) === "~"; }

/** Zit deze entiteit met zijn midden in het water van een zwemlevel? */
function inWater(e) {
  if (!level.def.swim) return false;
  return isWater(level, Math.floor((e.x + e.w / 2) / TILE),
                        Math.floor((e.y + e.h / 2) / TILE));
}

/** Staat er vaste grond onder deze wereldpositie? (voor randdetectie) */
function groundBelow(lvl, wx, wy) {
  return isSolid(lvl, Math.floor(wx / TILE), Math.floor(wy / TILE));
}

/* --------------------------------------------------------------------------
   Entiteiten
   -------------------------------------------------------------------------- */
function makeDog(px, py) {
  return { type: "dog", x: px, y: py + 6, w: 15, h: 10, vx: -0.45, vy: 0,
           dead: false, deadT: 0, anim: 0 };
}
function makeRival(px, py) {
  return { type: "rival", x: px + 1, y: py + 3, w: 12, h: 13, vx: -0.8, vy: 0,
           dead: false, deadT: 0, anim: 0 };
}
function makeCar(px, py) {
  // Dubbel formaat: 44x22 beeld, iets krappere hitbox zodat het eerlijk voelt.
  return { type: "car", x: px - 13, y: py - 5, w: 41, h: 21, vx: -0.95, vy: 0,
           dead: false, deadT: 0, anim: 0 };
}
function makeBird(px, py) {
  return { type: "bird", x: px, y: py + 4, w: 11, h: 8, vx: 0.7, vy: 0,
           homeX: px, homeY: py + 4, range: 52, phase: Math.random() * 6.28,
           dead: false, deadT: 0, anim: 0 };
}

/** Eend: dobbert rustig op het water, geen gevaar. Vaart soms wat rond en kwaakt. */
function makeDuck(px, py) {
  return { x: px, y: py + 6, w: 12, h: 8,
           homeX: px, dir: Math.random() < 0.5 ? -1 : 1,
           phase: Math.random() * 6.28, quack: 60 + Math.random() * 200 };
}

/** Muisje: dwaalt rustig rond, maar sprint weg zodra Jack dichtbij komt. Geen gevaar, alleen vangen voor +10 botjes. */
const MOUSE_IDLE_SPEED = 0.5;
const MOUSE_FLEE_SPEED = 1.9;   // net iets langzamer dan Jack's topsnelheid: lastig, maar niet onmogelijk
const MOUSE_FLEE_RADIUS = 70;
const MOUSE_LIFETIME = 420;     // 7s: vang je hem niet op tijd, dan glipt hij weg
function makeMouse(px, py) {
  return { type: "mouse", x: px + 1, y: py + 5, w: 14, h: 9, vx: -MOUSE_IDLE_SPEED, vy: 0,
           onGround: false, caught: false, expired: false, life: 0, anim: 0,
           homeX: px + 1, homeY: py + 5, wanderDir: -1 };
}

/** Zwevend platform dat op en neer of heen en weer beweegt (buiten het tegel-raster). */
function makeMovingPlatform(p) {
  return {
    x: p.x, y: p.y, x0: p.x, y0: p.y, w: p.w, h: p.h,
    axis: p.axis, range: p.range, speed: p.speed, phase: p.phase || 0,
    dx: 0, dy: 0,
  };
}

/** Wolkplatform: lost op zodra je er ~1s op staat, en komt na een tijdje terug. */
function makeCloudPlatform(p) {
  return { x: p.x, y: p.y, w: p.w, h: p.h, state: "solid", timer: 0, dx: 0, dy: 0 };
}

function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function spawnParticles(x, y, color, n, spread = 1.6) {
  for (let i = 0; i < n; i++) {
    level.particles.push({
      x, y,
      vx: (Math.random() - 0.5) * spread * 2,
      vy: -Math.random() * spread - 0.4,
      life: 20 + Math.random() * 16,
      color,
    });
  }
}

/* --------------------------------------------------------------------------
   Speler
   -------------------------------------------------------------------------- */
function makePlayer(spawn) {
  return {
    x: spawn.x, y: spawn.y, w: 10, h: 13,
    vx: 0, vy: 0,
    onGround: false, facing: 1,
    coyote: 0, buffer: 0, anim: 0,
    invuln: 0, hurtFlash: 0,
    safe: { x: spawn.x, y: spawn.y }, safeTimer: 0,
    ascend: 0,
    powered: false, platform: null,
    skating: false, spin: 0, spinAngle: 0, spinDir: 1, launched: false,
  };
}

function movePlayer(p) {
  // --- meebewegen met een zwevend platform waar je op staat ---
  if (p.platform) { p.x += p.platform.dx; p.y += p.platform.dy; }

  const swimming = inWater(p);
  if (swimming && !p.swimming && p.vy > 1.4) {
    spawnParticles(p.x + p.w / 2, p.y + p.h, "#bfe6ff", 8, 2.2);
    Sound.splash();
  }
  p.swimming = swimming;
  if (swimming) { p.skating = false; p.spin = 0; p.spinAngle = 0; }

  // --- horizontaal ---  (skateboard = sneller; water = trager en met demping)
  const fric = p.skating ? SKATE_FRIC : FRICTION;
  const top  = swimming ? SWIM_HMAX : (p.skating ? SKATE_MAX : MAX_RUN);
  const dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  if (dir !== 0) {
    p.vx += dir * ACCEL * (swimming ? 0.5 : (p.skating ? 0.7 : 1));
    if (p.spin === 0) p.facing = dir;
  } else {
    if (p.vx > 0) p.vx = Math.max(0, p.vx - fric);
    else if (p.vx < 0) p.vx = Math.min(0, p.vx + fric);
  }
  if (swimming) p.vx *= SWIM_DRAG;
  p.vx = Math.max(-top, Math.min(top, p.vx));

  p.x += p.vx;
  resolveAxis(p, "x");
  // onzichtbare muren aan het begin en eind van het level
  const maxX = level.width * TILE - p.w;
  if (p.x < 0) { p.x = 0; p.vx = 0; }
  else if (p.x > maxX) { p.x = maxX; p.vx = 0; }

  // --- verticaal ---
  if (swimming) {
    p.vy += SWIM_SINK;                              // langzaam wegzakken
    if (keys.jump) p.vy -= SWIM_RISE;               // spatie/omhoog = omhoog peddelen
    p.vy = Math.max(-SWIM_VMAX, Math.min(SWIM_VMAX, p.vy));
  } else {
    p.vy = Math.min(MAX_FALL, p.vy + GRAVITY);
  }
  p.y += p.vy;
  const wasAir = !p.onGround;
  p.onGround = false;
  resolveAxis(p, "y");

  // --- landen op een zwevend platform (buiten het tegel-raster) ---
  p.platform = null;
  if (!p.onGround) {
    const plat = findLandingPlatform(p);
    if (plat) {
      p.y = plat.y - p.h;
      p.vy = 0;
      p.onGround = true;
      p.platform = plat;
    }
  }
  if (p.onGround && wasAir && p.vy >= 0) spawnParticles(p.x + p.w / 2, p.y + p.h, "#ffffff", 3, 0.9);

  // --- springen ---
  if (p.onGround) p.coyote = COYOTE; else if (p.coyote > 0) p.coyote--;
  if (jumpPressed) p.buffer = BUFFER; else if (p.buffer > 0) p.buffer--;

  if (p.buffer > 0 && p.coyote > 0) {
    p.vy = JUMP_V;
    p.onGround = false;
    p.coyote = 0; p.buffer = 0;
    Sound.jump();
  }
  // korte tik = lagere sprong (geldt NIET voor een lancering van de halfpipe)
  if (!keys.jump && p.vy < -2 && !p.launched) p.vy = -2;
  if (p.vy >= 0 || p.onGround) p.launched = false;

  // --- salto op de halfpipe ---
  if (p.spin > 0) {
    p.spin--;
    p.spinAngle += p.spinDir * 0.34;
    if (p.onGround) { p.spin = 0; p.spinAngle = 0; }   // netjes landen = klaar met draaien
  } else {
    p.spinAngle = 0;
  }

  // --- animatie ---
  if (Math.abs(p.vx) > 0.15) p.anim += Math.abs(p.vx) * 0.35; else p.anim = 0;
  if (p.invuln > 0) p.invuln--;

  // --- veilige plek onthouden (om na een val te herstarten) ---
  p.safeTimer++;
  if (p.onGround && p.safeTimer > 10) {
    const tx = Math.floor((p.x + p.w / 2) / TILE);
    const ty = Math.floor((p.y + p.h + 2) / TILE);
    // alleen onthouden als er ook links en rechts vaste grond ligt
    if (isSolid(level, tx, ty) && (isSolid(level, tx - 1, ty) || isSolid(level, tx + 1, ty))) {
      p.safe = { x: p.x, y: p.y - 2 };
      p.safeTimer = 0;
    }
  }
}

/** Tegelbotsing per as. */
function resolveAxis(e, axis) {
  const left   = Math.floor(e.x / TILE);
  const right  = Math.floor((e.x + e.w - 0.01) / TILE);
  const top    = Math.floor(e.y / TILE);
  const bottom = Math.floor((e.y + e.h - 0.01) / TILE);

  for (let ty = top; ty <= bottom; ty++) {
    for (let tx = left; tx <= right; tx++) {
      if (!isSolid(level, tx, ty)) continue;
      if (axis === "x") {
        if (e.vx > 0) e.x = tx * TILE - e.w;
        else if (e.vx < 0) e.x = (tx + 1) * TILE;
        e.vx = 0;
      } else {
        if (e.vy > 0) { e.y = ty * TILE - e.h; e.onGround = true; }
        else if (e.vy < 0) e.y = (ty + 1) * TILE;
        e.vy = 0;
      }
      return;
    }
  }
}

/** Zoekt een zwevend platform (bewegend of wolk) waar de speler nu op kan landen. */
function findLandingPlatform(p) {
  if (p.vy < 0) return null;   // springend omhoog: platforms van onderaf niet blokkeren
  const feetY = p.y + p.h;
  const candidates = level.platforms.concat(level.cloudPlatforms.filter(c => c.state !== "gone"));
  for (const pl of candidates) {
    const withinX = p.x + p.w > pl.x + 2 && p.x < pl.x + pl.w - 2;
    if (withinX && feetY >= pl.y - 1 && feetY <= pl.y + 8) return pl;
  }
  return null;
}

/** Beweegt een zwevend platform langs zijn as en onthoudt de verplaatsing (voor het meedragen van de speler). */
function updateMovingPlatform(pl) {
  const prevX = pl.x, prevY = pl.y;
  pl.phase += pl.speed;
  const off = Math.sin(pl.phase) * pl.range;
  if (pl.axis === "x") pl.x = pl.x0 + off; else pl.y = pl.y0 + off;
  pl.dx = pl.x - prevX;
  pl.dy = pl.y - prevY;
}

/** Wolkplatform: telt af zodra Jack erop staat, lost dan op en komt na een tijdje terug. */
function updateCloudPlatform(cl, standing) {
  if (cl.state === "solid") {
    if (standing) {
      cl.timer++;
      if (cl.timer > 30) { cl.state = "gone"; cl.timer = 0; }   // korter blijven staan: sneller weg
    } else if (cl.timer > 0) {
      cl.timer--;
    }
  } else if (cl.state === "gone") {
    cl.timer++;
    if (cl.timer > 90) { cl.state = "solid"; cl.timer = 0; }
  }
}

/* --------------------------------------------------------------------------
   Vijanden bijwerken
   -------------------------------------------------------------------------- */
function updateEnemy(en) {
  if (en.dead) { en.deadT++; en.y += 1.4; en.vy += 0.3; return; }
  en.anim++;

  if (en.type === "bird") {
    en.x += en.vx;
    if (en.x < en.homeX - en.range || en.x > en.homeX + en.range) en.vx *= -1;
    en.phase += 0.05;
    en.y = en.homeY + Math.sin(en.phase) * 9;
    return;
  }

  // lopende vijanden: zwaartekracht + omkeren bij muur of afgrond
  en.vy = Math.min(MAX_FALL, en.vy + GRAVITY);
  const oldX = en.x;
  en.x += en.vx;
  resolveAxis(en, "x");
  if (en.x !== oldX + en.vx) en.vx *= -1;      // tegen een muur gelopen

  en.y += en.vy;
  en.onGround = false;
  resolveAxis(en, "y");

  if (en.onGround) {
    const aheadX = en.vx > 0 ? en.x + en.w + 1 : en.x - 1;
    if (!groundBelow(level, aheadX, en.y + en.h + 2)) en.vx *= -1;  // rand van het platform
  }
  if (en.y > level.height * TILE + 40) en.dead = true;
}

/** Is deze wereldpositie ongeveer binnen het zichtbare scherm? */
function isOnScreen(x) {
  const sx = x - cam.x;
  return sx > -40 && sx < VIEW_W + 40;
}

/** Muisje: rent op de grond steeds weg van Jack, maar loopt niet van een rand af. */
function updateMouseEntity(m) {
  if (m.caught || m.expired) return;
  m.anim++;

  // de tijdslimiet telt alleen mee zolang hij ook echt in beeld is
  if (isOnScreen(m.x)) m.life++;
  if (m.life > MOUSE_LIFETIME) {
    m.expired = true;
    spawnParticles(m.x + m.w / 2, m.y + m.h / 2, "#c9bdb0", 6, 1.2);
    return;
  }

  const dist = (player.x + player.w / 2) - (m.x + m.w / 2);
  const fleeing = Math.abs(dist) < MOUSE_FLEE_RADIUS;
  let dir = fleeing ? (dist < 0 ? 1 : -1) : m.wanderDir;

  // liever niet van het platform af rennen, ook al is dat de kant die van Jack wegvlucht
  if (m.onGround) {
    const stepsOff = (d) => !groundBelow(level, d > 0 ? m.x + m.w + 1 : m.x - 1, m.y + m.h + 2);
    if (stepsOff(dir)) dir = stepsOff(-dir) ? 0 : -dir;
  }
  if (!fleeing && dir !== 0) m.wanderDir = dir;
  m.vx = dir * (fleeing ? MOUSE_FLEE_SPEED : MOUSE_IDLE_SPEED);

  m.vy = Math.min(MAX_FALL, m.vy + GRAVITY);
  m.x += m.vx;
  resolveAxis(m, "x");
  m.y += m.vy;
  m.onGround = false;
  resolveAxis(m, "y");

  // vangnet: mocht hij toch ooit in het niets vallen, dan komt hij terug op zijn eigen plek
  if (m.y > level.height * TILE + 40) {
    m.x = m.homeX; m.y = m.homeY; m.vx = 0; m.vy = 0;
  }
}

const FISH_LIFETIME = 420;   // 7s: pak je het visje niet op tijd, dan zwemt het weg

/** Visje: zweeft ter plekke en bobt wat, maar zwemt weg als je het niet op tijd pakt. */
function updateFishEntity(f) {
  if (f.got || f.expired) return;
  f.t += 0.08;
  // de tijdslimiet telt alleen mee zolang het ook echt in beeld is
  if (isOnScreen(f.x)) f.life++;
  if (f.life > FISH_LIFETIME) {
    f.expired = true;
    spawnParticles(f.x + f.w / 2, f.y + f.h / 2, "#ffe066", 6, 1.2);
  }
}

/** Eend: dobbert op en neer, vaart traag rond zijn plekje, kwaakt af en toe. */
function updateDuckEntity(d) {
  d.phase += 0.06;
  d.x += d.dir * 0.15;
  if (d.x < d.homeX - 22 || d.x > d.homeX + 22) d.dir *= -1;
  if (isOnScreen(d.x)) {
    d.quack--;
    if (d.quack <= 0) { Sound.quack(); d.quack = 180 + Math.random() * 260; }
  }
}

/* --------------------------------------------------------------------------
   Speler tegen wereld: botjes, vijanden, water, gaten, poort
   -------------------------------------------------------------------------- */
function checkInteractions() {
  const p = player;

  // botjes
  for (const h of level.hearts) {
    if (h.got) continue;
    if (overlaps(p, h)) {
      h.got = true;
      Sound.heart();
      spawnParticles(h.x + 4, h.y + 4, "#ff8fa8", 7, 1.4);
      addHearts(1, p.x + p.w / 2, p.y);
    }
  }

  // visjes: geven een schild tegen de volgende klap (Jack wordt geel en knippert)
  for (const f of level.fish) {
    if (f.got || f.expired) continue;
    if (overlaps(p, f)) {
      f.got = true;
      p.powered = true;
      Sound.power();
      spawnParticles(f.x + 5, f.y + 4, "#ffe066", 8, 1.6);
      showPopup("SCHILD!", "#ffe066");
    }
  }

  // muisjes: rennen weg, vangen geeft +10 botjes
  for (const m of level.mice) {
    if (m.caught || m.expired) continue;
    if (overlaps(p, m)) {
      m.caught = true;
      Sound.heart();
      spawnParticles(m.x + m.w / 2, m.y + 4, "#c9bdb0", 8, 1.6);
      showPopup("+10 BOTJES!", "#ff8fa8");
      addHearts(10, p.x + p.w / 2, p.y);
    }
  }

  // skateboard oppakken
  for (const s of level.skates) {
    if (s.got) continue;
    if (overlaps(p, s)) {
      s.got = true;
      p.skating = true;
      Sound.power();
      spawnParticles(s.x + 7, s.y + 4, "#7ec7ff", 10, 1.8);
      showPopup("SKATEBOARD!", "#7ec7ff");
    }
  }

  // halfpipe / schans: met vaart erin -> lanceren. Op het board veel hoger, plus een salto.
  for (const r of level.ramps) {
    if (p.onGround && Math.abs(p.vx) > 1.1 && overlaps(p, r)) {
      const power = RAMP_LIFT + Math.abs(p.vx) * (p.skating ? 1.5 : 0.7);
      p.vy = -power;
      p.onGround = false;
      p.coyote = 0;
      p.launched = true;
      spawnParticles(p.x + p.w / 2, p.y + p.h, "#ffffff", 7, 2.2);
      if (p.skating) {
        p.spin = 26 + Math.round(Math.abs(p.vx) * 7);
        p.spinDir = p.vx < 0 ? -1 : 1;
        Sound.dodge();
      }
      Sound.jump();
    }
  }

  // Jack blaft één keer zodra hij een kat in de buurt ziet
  for (const en of level.enemies) {
    if (en.type === "rival" && !en.dead && !en.barked &&
        isOnScreen(en.x) && Math.abs(en.x - p.x) < 110) {
      en.barked = true;
      Sound.bark();
    }
  }

  // vijanden
  for (const en of level.enemies) {
    if (en.dead) continue;
    if (!overlaps(p, en)) continue;

    const fromAbove = p.vy > 0 && (p.y + p.h) - p.vy <= en.y + 6;
    const trick = p.spin > 0;   // tijdens een salto ram je vijanden gewoon omver

    if (trick && en.type !== "car") {
      en.dead = true; en.vy = -2;
      Sound.stomp();
      spawnParticles(en.x + en.w / 2, en.y, "#ffe08a", 7, 1.8);
      continue;
    }

    if (en.type === "car") {
      // Een auto gaat niet kapot, maar op het dak landen mag: je stuitert weg.
      if (fromAbove) {
        p.vy = STOMP_V;
        p.y = en.y - p.h;
        Sound.stomp();
        spawnParticles(p.x + p.w / 2, en.y, "#ffffff", 4, 1.4);
      } else if (p.invuln === 0) {
        hurtPlayer(en.x + en.w / 2 < p.x + p.w / 2 ? 1 : -1);
      }
    } else if (fromAbove) {
      en.dead = true; en.vy = -2;
      p.vy = STOMP_V;
      Sound.stomp();
      spawnParticles(en.x + en.w / 2, en.y, "#ffe08a", 6, 1.6);
    } else if (p.invuln === 0) {
      hurtPlayer(en.x + en.w / 2 < p.x + p.w / 2 ? 1 : -1);
    }
  }

  // water: dodelijk, behalve in een zwemlevel (daar zwem je erin)
  const footTx = Math.floor((p.x + p.w / 2) / TILE);
  const footTy = Math.floor((p.y + p.h - 2) / TILE);
  if (isWater(level, footTx, footTy) && !level.def.swim) killPlayer("water");

  // in een gat gevallen
  if (p.y > level.height * TILE + 8) killPlayer("val");

  // eindpoort
  if (level.gateZone && overlaps(p, level.gateZone) && game.state === STATE.PLAY) {
    game.state = STATE.CLEAR;
    game.timer = 0;
    p.vx = 0;
    Sound.gate();
  }
}

/** Telt botjes op en geeft, indien van toepassing, extra levens (ook gebruikt voor het vangen van een muisje). */
function addHearts(n, x, y) {
  const before = Math.floor(game.hearts / HEARTS_PER_LIFE);
  game.hearts += n;
  const after = Math.floor(game.hearts / HEARTS_PER_LIFE);
  if (after > before) {
    game.lives += after - before;
    showPopup("+1 LEVEN!", "#ffe36e");
    Sound.extraLife();
    spawnParticles(x, y, "#ffe36e", 12, 2.2);
  }
}

function hurtPlayer(knockDir) {
  const p = player;
  p.invuln = 90;
  p.hurtFlash = 18;
  p.vx = knockDir * 2.2;
  p.vy = -3.2;
  if (p.powered) {
    // het visje-schild vangt deze klap op: geen leven kwijt, wel weer normaal
    p.powered = false;
    Sound.shield();
  } else if (p.skating) {
    // de klap schopt alleen het skateboard onder Jack vandaan: geen leven kwijt
    p.skating = false; p.spin = 0; p.spinAngle = 0;
    Sound.shield();
    spawnParticles(p.x + p.w / 2, p.y + p.h, "#a97444", 8, 2.2);
  } else {
    game.lives--;
    Sound.hurt();
    if (game.lives <= 0) gameOver();
  }
}

function killPlayer(cause) {
  const p = player;
  if (game.state !== STATE.PLAY) return;
  p.powered = false;   // een val in een gat of het water kost ook de vissenkracht
  p.skating = false; p.spin = 0; p.spinAngle = 0;
  game.lives--;
  Sound.meow();
  if (game.lives <= 0) { gameOver(); return; }
  game.state = STATE.DEAD;
  game.timer = 0;
  p.vy = -4.5;
  p.deathCause = cause;
}

function gameOver() {
  game.lives = 0;
  game.state = STATE.OVER;
  game.timer = 0;
  Sound.over();
}

/* --------------------------------------------------------------------------
   Eindbaas: de stofzuiger
   Hij scheert over de vloer heen en weer; tien keer goed overheen springen.
   -------------------------------------------------------------------------- */
const boss = {
  x: 0, y: 0, w: 26, h: 13,
  vx: 0, dir: -1, phase: "wait", wait: 60,
  jumps: 0, hit: false, side: 0, broken: false, shake: 0,
};

function resetBoss() {
  boss.jumps = 0; boss.broken = false; boss.phase = "wait";
  boss.wait = 70; boss.dir = -1; boss.shake = 0;
  boss.y = (ROWS - 2) * TILE - boss.h;
  boss.x = VIEW_W - boss.w - 4;
  boss.hit = false;
  boss.counted = false;
}

function bossSpeed() { return 2.3 + boss.jumps * 0.33; }

/** Hoe ver hij nog doorrijdt nadat hij Jack is gepasseerd: steeds korter. */
function bossTurnDistance() { return Math.max(65, 165 - boss.jumps * 12); }

function updateBoss() {
  movePlayer(player);
  const p = player;

  if (boss.broken) {
    boss.shake++;
    if (boss.shake % 6 === 0) {
      spawnParticles(boss.x + boss.w / 2, boss.y + 6, "#8f9ad8", 5, 2.2);
      Sound.boom();
    }
    if (boss.shake > 90) { game.state = STATE.BOSSWIN; game.timer = 0; Sound.win(); }
    return;
  }

  if (boss.phase === "wait") {
    if (--boss.wait <= 0) {
      boss.phase = "charge";
      boss.hit = false;
      boss.counted = false;
      // altijd op Jack af, zodat hij haar ook echt passeert
      boss.dir = Math.sign((p.x + p.w / 2) - (boss.x + boss.w / 2)) || -1;
      boss.vx = bossSpeed() * boss.dir;
      boss.side = Math.sign((boss.x + boss.w / 2) - (p.x + p.w / 2));
      Sound.vacuum();
    }
    return;
  }

  boss.x += boss.vx;

  // Raakt hij Jack? Dan kost het een leven en telt deze aanval niet.
  const box = { x: boss.x + 3, y: boss.y + 3, w: boss.w - 6, h: boss.h - 3 };
  if (!boss.hit && p.invuln === 0 && overlaps(p, box)) {
    boss.hit = true;
    hurtPlayer(boss.vx < 0 ? -1 : 1);
  }

  // Netjes overheen gesprongen? Dan is de stofzuiger van kant gewisseld.
  // Eén keer tellen per aanval, anders kun je bij een stilstaande stofzuiger
  // heen en weer springen om snel af te tellen.
  const nowSide = Math.sign((boss.x + boss.w / 2) - (p.x + p.w / 2));
  if (nowSide !== 0 && boss.side !== 0 && nowSide !== boss.side) {
    if (!boss.hit && !boss.counted) {
      boss.counted = true;
      boss.jumps++;
      Sound.dodge();
      spawnParticles(p.x + p.w / 2, p.y + p.h, "#ffe36e", 8, 1.8);
      if (boss.jumps >= BOSS_JUMPS) {
        boss.broken = true;
        boss.shake = 0;
        boss.vx = 0;
      }
    }
    boss.side = nowSide;
  }

  // Hij keert om zodra hij ver genoeg voorbij Jack is - en dat wordt elke
  // ronde korter, dus hij komt steeds sneller terug. De schermrand is de grens.
  const links = -4, rechts = VIEW_W - boss.w + 4;
  const afstand = (boss.x + boss.w / 2) - (p.x + p.w / 2);
  const ver = boss.vx < 0 ? afstand < -bossTurnDistance() : afstand > bossTurnDistance();
  const rand = (boss.vx < 0 && boss.x <= links) || (boss.vx > 0 && boss.x >= rechts);
  if (ver || rand) {
    boss.x = Math.max(links, Math.min(rechts, boss.x));
    boss.phase = "wait";
    boss.wait = Math.max(12, 30 - boss.jumps * 2);
  }
}

/* --------------------------------------------------------------------------
   hondje: het baasje. Spring in zijn armen.
   -------------------------------------------------------------------------- */
const charlie = { x: 0, y: 0, w: 20, h: 42, arms: 0, caught: false };

function resetCharlie() {
  charlie.x = 19 * TILE;
  charlie.y = (ROWS - 2) * TILE - charlie.h;
  charlie.arms = 0;
  charlie.caught = false;
  resetGarden();
}

/* --------------------------------------------------------------------------
   Tuintje bij hondje: plantenbakken met bijen, en een vogelhuisje met musjes.
   -------------------------------------------------------------------------- */
const garden = {
  planters: [
    { x: 35, y: (ROWS - 2) * TILE, scale: 3.6 },   // 40% kleiner dan de eerdere 6x
    { x: 145, y: (ROWS - 2) * TILE, scale: 4.8 },  // 40% kleiner dan de eerdere 8x
  ],
  oliveTree: { x: 236, y: (ROWS - 2) * TILE, scale: 1.35 },
  birdhouse: { x: 345, y: (ROWS - 2) * TILE },
  bees: [], sparrows: [],
};

function resetGarden() {
  garden.bees = garden.planters.flatMap((p, i) => {
    const w = SPR.planter.width * p.scale, h = SPR.planter.height * p.scale;
    const flowerY = p.y - h + h * 0.16;   // de bloemen zitten boven in de (geschaalde) bak
    const range = 6 + p.scale * 2;
    return [
      { homeX: p.x + w * 0.3, homeY: flowerY, range, phase: i * 2 },
      { homeX: p.x + w * 0.7, homeY: flowerY - range * 0.3, range: range * 0.8, phase: i * 2 + 3 },
    ];
  });
  garden.sparrows = [
    { homeX: garden.birdhouse.x - 4, homeY: garden.birdhouse.y - 38, range: 16, phase: 0 },
    { homeX: garden.birdhouse.x + 12, homeY: garden.birdhouse.y - 33, range: 14, phase: 3 },
  ];
}

function updateGarden() {
  for (const b of garden.bees) b.phase += 0.12;
  for (const s of garden.sparrows) s.phase += 0.045;
}

function drawGarden() {
  for (const p of garden.planters) {
    blit(SPR.planter, p.x - cam.x, p.y - SPR.planter.height * p.scale, false, p.scale);
  }
  blit(SPR.oliveTree, garden.oliveTree.x - cam.x, garden.oliveTree.y - SPR.oliveTree.height * garden.oliveTree.scale, false, garden.oliveTree.scale);
  blit(SPR.birdhouse, garden.birdhouse.x - cam.x, garden.birdhouse.y - SPR.birdhouse.height);
  for (const b of garden.bees) {
    const x = b.homeX + Math.cos(b.phase) * b.range - cam.x;
    const y = b.homeY + Math.sin(b.phase * 1.7) * (b.range * 0.5);
    blit(SPR.bee, x, y, Math.cos(b.phase) < 0);
  }
  for (const s of garden.sparrows) {
    const x = s.homeX + Math.cos(s.phase) * s.range - cam.x;
    const y = s.homeY + Math.sin(s.phase * 1.3) * (s.range * 0.4);
    blit(SPR.sparrow, x, y, Math.cos(s.phase) < 0);
  }
}

/** Het vangvlak zit vóór haar: ruim, zodat een sprong ernaartoe altijd raakt. */
function charlieCatchZone() {
  return { x: charlie.x - 20, y: charlie.y + 6, w: 30, h: 36 };
}

function updateCharlie() {
  movePlayer(player);
  const p = player;
  if (charlie.caught) return;

  // armen gaan open als Jack in de buurt komt
  const dist = Math.abs((p.x + p.w / 2) - (charlie.x + charlie.w / 2));
  charlie.arms = Math.max(0, Math.min(1, (90 - dist) / 60));

  if (!p.onGround && overlaps(p, charlieCatchZone())) {
    charlie.caught = true;
    game.state = STATE.HUG;
    game.timer = 0;
    p.vx = 0; p.vy = 0;
    p.x = charlie.x - 13;
    p.y = charlie.y + 9;     // op haar arm, tegen haar borst aan
    Sound.hug();
  }
}

/* --------------------------------------------------------------------------
   Naar het scorescherm (en eventueel eerst een naam intypen)
   -------------------------------------------------------------------------- */
function finishGame(finished) {
  game.finished = finished;
  if (finished) game.hearts += 25;          // bonus voor het halen van de hemel
  nameEntry = "";
  newScoreIndex = -1;
  if (qualifies(game.hearts)) {
    game.state = STATE.NAME;
  } else {
    scoreList = sortScores(loadScores());
    game.state = STATE.SCORES;
  }
  game.timer = 0;
}

function submitName() {
  const naam = (nameEntry.trim() || "JACK").slice(0, 8);
  scoreList = addScore(naam, game.hearts, game.finished, game.levelIndex + 1);
  newScoreIndex = scoreList.findIndex(s => s.name === naam && s.hearts === game.hearts);
  game.state = STATE.SCORES;
  game.timer = 0;
}

/* --------------------------------------------------------------------------
   Camera
   -------------------------------------------------------------------------- */
const cam = { x: 0, y: 0 };
function updateCamera() {
  const target = player.x + player.w / 2 - VIEW_W / 2;
  cam.x += (target - cam.x) * 0.12;
  cam.x = Math.max(0, Math.min(level.width * TILE - VIEW_W, cam.x));
}

/* --------------------------------------------------------------------------
   Spelverloop
   -------------------------------------------------------------------------- */
function loadStage(def) {
  level = parseLevel(def);
  player = makePlayer(level.spawn);
  cam.x = Math.max(0, Math.min(level.width * TILE - VIEW_W, player.x - VIEW_W / 2));
  game.state = STATE.INTRO;
  game.timer = 0;
}

function loadLevel(i) {
  game.levelIndex = i;
  game.stage = "level";
  loadStage(LEVELS[i]);
}

function loadBossStage() {
  game.stage = "boss";
  loadStage(BOSS_STAGE);
  resetBoss();
}

function loadCharlieStage() {
  game.stage = "charlie";
  loadStage(CHARLIE_STAGE);
  resetCharlie();
}

function restartGame() {
  game.lives = START_LIVES;
  game.hearts = 0;
  game.paused = false;
  game.finished = false;
  game.popup.timer = 0;
  loadLevel(0);
}

function togglePause() {
  if (game.state === STATE.PLAY || game.state === STATE.BOSS || game.state === STATE.CHARLIE) {
    game.paused = !game.paused;
  }
}

/** Enter / spatie / tik op de schermen zonder spel. */
function confirmScreen() {
  switch (game.state) {
    case STATE.TITLE:  game.state = STATE.STORY; game.timer = 0; break;
    case STATE.STORY:  if (game.timer > 30) restartGame(); break;
    case STATE.OVER:   if (game.timer > 60) finishGame(false); break;
    case STATE.WIN:    if (game.timer > 120) finishGame(true); break;
    case STATE.SCORES: if (game.timer > 45) { game.state = STATE.TITLE; game.timer = 0; } break;
  }
}

function update() {
  game.frame++;
  game.timer++;

  switch (game.state) {
    case STATE.TITLE:
      break;

    case STATE.INTRO:
      if (game.timer > 100) {
        game.state = game.stage === "boss" ? STATE.BOSS
                   : game.stage === "charlie" ? STATE.CHARLIE
                   : STATE.PLAY;
        game.timer = 0;
      }
      break;

    case STATE.PLAY:
      if (game.paused) break;
      level.platforms.forEach(updateMovingPlatform);
      level.cloudPlatforms.forEach(cl => updateCloudPlatform(cl, player.platform === cl));
      movePlayer(player);
      level.enemies.forEach(updateEnemy);
      level.mice.forEach(updateMouseEntity);
      level.fish.forEach(updateFishEntity);
      level.ducks.forEach(updateDuckEntity);
      checkInteractions();
      updateCamera();
      break;

    case STATE.DEAD:
      player.vy = Math.min(MAX_FALL, player.vy + GRAVITY);
      player.y += player.vy;
      if (game.timer > 80) {
        // terug naar de laatste veilige plek
        player.x = player.safe.x; player.y = player.safe.y;
        player.vx = 0; player.vy = 0;
        player.invuln = 60;
        game.state = STATE.PLAY;
        game.timer = 0;
      }
      break;

    case STATE.CLEAR:
      // Jack heeft de eindpoort gehaald: vrolijk sprongetje, geen hemelvaart
      if (game.timer === 1) {
        spawnParticles(player.x + player.w / 2, player.y, "#ffe36e", 16, 2.6);
        player.vy = -3.4;
      }
      player.vx = 0;
      player.vy = Math.min(MAX_FALL, player.vy + GRAVITY);
      player.y += player.vy;
      player.onGround = false;
      resolveAxis(player, "y");
      if (game.timer > 100) {
        if (game.levelIndex + 1 < LEVELS.length) loadLevel(game.levelIndex + 1);
        else loadBossStage();          // na het laatste level wacht de stofzuiger
      }
      break;

    case STATE.BOSS:
      if (game.paused) break;
      updateBoss();
      break;

    case STATE.BOSSWIN:
      if (game.timer > 120) loadCharlieStage();
      break;

    case STATE.CHARLIE:
      if (game.paused) break;
      updateCharlie();
      break;

    case STATE.HUG:
      // knuffel bij het baasje, daarna het winscherm (geen hemelvaart)
      if (game.timer === 96) Sound.gate();
      if (game.timer > 260) { game.state = STATE.WIN; game.timer = 0; Sound.win(); }
      break;

    case STATE.OVER:
    case STATE.WIN:
    case STATE.STORY:
    case STATE.NAME:
    case STATE.SCORES:
      break;
  }

  if (game.popup.timer > 0) game.popup.timer--;

  if (level) {
    for (let i = level.particles.length - 1; i >= 0; i--) {
      const pt = level.particles[i];
      pt.x += pt.vx; pt.y += pt.vy; pt.vy += 0.14; pt.life--;
      if (pt.life <= 0) level.particles.splice(i, 1);
    }
    for (const h of level.hearts) h.t += 0.08;
  }
  if (game.stage === "charlie" && !game.paused) updateGarden();
  if (player && player.hurtFlash > 0) player.hurtFlash--;

  jumpPressed = false;
}

/* --------------------------------------------------------------------------
   Tekenen
   -------------------------------------------------------------------------- */
/** Tekent de handgetekende achtergrond. Geeft false terug als het plaatje nog
    niet geladen is (dan valt render() terug op de gewone lucht). */
function drawHandBg(def) {
  const im = BG_IMAGES[def.bg];
  if (!im || !im.complete || !im.naturalWidth) return false;
  ctx.fillStyle = def.sky ? def.sky[0] : "#bfe3ff";
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  if (def.bgFill) {
    // tekening vult het hele scherm (voor plaatjes met dezelfde verhouding als de canvas)
    const s = Math.max(VIEW_W / im.naturalWidth, VIEW_H / im.naturalHeight) * 1.05;
    const dw = Math.round(im.naturalWidth * s), dh = Math.round(im.naturalHeight * s);
    const pan = Math.min(Math.max(0, dw - VIEW_W), Math.round(cam.x * 0.05));
    ctx.drawImage(im, -pan, Math.round((VIEW_H - dh) / 2), dw, dh);
    return true;
  }

  const groundTop = def.noGround ? VIEW_H : (ROWS - 2) * TILE;
  const horizon = def.bgHorizon || 0.64;
  const w = VIEW_W + 44;                         // net iets breder dan het scherm: klein beetje parallax
  const h = Math.round(w * im.naturalHeight / im.naturalWidth);
  const pan = Math.min(w - VIEW_W, Math.round(cam.x * 0.04));
  ctx.drawImage(im, -pan, Math.round(groundTop - h * horizon), w, h);
  return true;
}

function drawSky(def) {
  const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  g.addColorStop(0, def.sky[0]);
  g.addColorStop(1, def.sky[1]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

function drawClouds() {
  ctx.fillStyle = "rgba(255,255,255,.85)";
  for (const c of level.clouds) {
    const x = Math.round(c.x - cam.x * c.s);
    if (x < -70 || x > VIEW_W + 70) continue;
    const y = Math.round(c.y);
    const w = 22 + c.s * 26;
    ctx.fillRect(x, y + 4, w, 7);
    ctx.fillRect(x + 5, y, w - 14, 7);
    ctx.fillRect(x + 12, y - 4, w - 26, 8);
  }
}

function drawHills(def) {
  // twee parallaxlagen van blokkerige heuvels
  // De heuvels eindigen exact op de grondlijn, zodat gaten echt sky tonen.
  const groundTop = (ROWS - 2) * TILE;
  const layers = [
    { s: 0.25, col: def.hillDark, h: 46, step: 96 },
    { s: 0.45, col: def.hill,     h: 34, step: 64 },
  ];
  for (const L of layers) {
    ctx.fillStyle = L.col;
    const off = -(cam.x * L.s) % L.step;
    for (let x = off - L.step; x < VIEW_W + L.step; x += L.step) {
      const px = Math.round(x);
      for (let i = 0; i < 5; i++) {
        const w = L.step - i * 14;
        if (w <= 0) break;
        const top = groundTop - L.h - i * (L.h / 5);
        ctx.fillRect(px + i * 7, Math.round(top), w, groundTop - Math.round(top));
      }
    }
  }
}

/** Silhouet van gebouwen op de achtergrond, voor het gevoel van op de daken in de nacht. */
function drawBuildings(def) {
  const layers = [
    { s: 0.2, col: "#100c26", h: 70, step: 74 },
    { s: 0.4, col: "#1c1640", h: 46, step: 48 },
  ];
  for (const L of layers) {
    const off = -(cam.x * L.s) % L.step;
    for (let x = off - L.step; x < VIEW_W + L.step; x += L.step) {
      const px = Math.round(x);
      const slot = Math.round(x / L.step);
      const h = L.h - (Math.abs(slot) % 3) * 12;
      const w = L.step - 12;
      ctx.fillStyle = L.col;
      ctx.fillRect(px, VIEW_H - h, w, h);
      // een paar verlichte raampjes
      ctx.fillStyle = "#ffe9a0";
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 3; col++) {
          if ((slot * 7 + row * 3 + col) % 4 === 0) {
            ctx.fillRect(px + 5 + col * 7, VIEW_H - h + 8 + row * 11, 2, 3);
          }
        }
      }
    }
  }
}

/** De A'DAM Toren, ver op de achtergrond: een vast herkenningspunt in elk level. */
function drawAdamTower(def) {
  const s = 0.12;   // heel ver weg: beweegt maar langzaam mee met de camera
  const anchor = def.noGround ? VIEW_H : (ROWS - 2) * TILE;
  const x = Math.round(260 - cam.x * s);
  if (x < -60 || x > VIEW_W + 60) return;
  blit(SPR.adamTower, x, anchor - SPR.adamTower.height);
}

/** Wat losse struiken en boompjes ver op de achtergrond bij hondje, voor meer groen. */
function drawGreenery() {
  const groundTop = (ROWS - 2) * TILE;   // struiken staan vóór het terras, niet erdoorheen verstopt
  const bushes = [
    { x: 6, w: 34, h: 15 }, { x: 55, w: 24, h: 11 }, { x: 108, w: 30, h: 17 },
    { x: 190, w: 26, h: 12 }, { x: 260, w: 22, h: 14 }, { x: 330, w: 32, h: 16 },
  ];
  for (const b of bushes) {
    const x = Math.round(b.x - cam.x * 0.5);
    ctx.fillStyle = "rgba(110,165,115,.55)";
    ctx.fillRect(x, groundTop - b.h, b.w, b.h);
    ctx.fillStyle = "rgba(80,135,90,.55)";
    ctx.fillRect(x + 3, groundTop - b.h + 6, b.w - 6, b.h - 6);
  }
}

function drawTiles(def) {
  // donkere band onder de grondlijn: gaten lezen als echte gaten
  const groundTop = (ROWS - 2) * TILE;
  ctx.fillStyle = def.deep;
  ctx.fillRect(0, groundTop, VIEW_W, VIEW_H - groundTop);

  const x0 = Math.max(0, Math.floor(cam.x / TILE) - 1);
  const x1 = Math.min(level.width - 1, Math.ceil((cam.x + VIEW_W) / TILE));

  for (let ty = 0; ty < level.height; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      const t = level.grid[ty][tx];
      if (t === ".") continue;
      const sx = Math.round(tx * TILE - cam.x);
      const sy = ty * TILE;

      if (t === "#" && def.checkerFloor) {
        // stenen terras: afwisselend witte en blauwe tegels, met een dun voegje
        ctx.fillStyle = (tx + ty) % 2 === 0 ? def.checkerLight : def.checkerDark;
        ctx.fillRect(sx, sy, TILE, TILE);
        ctx.fillStyle = "rgba(0,0,0,.15)";
        ctx.fillRect(sx, sy + TILE - 2, TILE, 2);
        ctx.fillRect(sx + TILE - 2, sy, 2, TILE);
        continue;
      }

      if (t === "#" || t === "=") {
        const topOpen = !isSolid(level, tx, ty - 1);
        ctx.fillStyle = def.dirt;
        ctx.fillRect(sx, sy, TILE, TILE);
        ctx.fillStyle = def.dirtDark;
        ctx.fillRect(sx, sy + TILE - 3, TILE, 3);
        ctx.fillRect(sx + TILE - 2, sy, 2, TILE);
        // wat korrel
        ctx.fillRect(sx + 3, sy + 7, 2, 2);
        ctx.fillRect(sx + 10, sy + 11, 2, 2);
        if (topOpen) {
          ctx.fillStyle = def.grass;
          ctx.fillRect(sx, sy, TILE, 5);
          ctx.fillStyle = def.grassDark;
          ctx.fillRect(sx, sy + 5, TILE, 2);
          ctx.fillStyle = def.grass;
          ctx.fillRect(sx + 2, sy - 2, 2, 2);
          ctx.fillRect(sx + 9, sy - 3, 2, 3);
        }
        if (t === "=") {   // zwevend platform: donkere onderrand
          ctx.fillStyle = def.dirtDark;
          ctx.fillRect(sx, sy + TILE - 4, TILE, 4);
        }
      } else if (t === "~") {
        const wave = Math.sin((game.frame * 0.06) + tx * 0.7) * 1.5;
        ctx.fillStyle = "#2f7fd4";
        ctx.fillRect(sx, sy, TILE, TILE);
        ctx.fillStyle = "#4aa3ef";
        ctx.fillRect(sx, sy + Math.round(wave) + 2, TILE, 4);
        ctx.fillStyle = "rgba(255,255,255,.55)";
        ctx.fillRect(sx + 3, sy + Math.round(wave) + 2, 4, 1);
        ctx.fillRect(sx + 10, sy + Math.round(-wave) + 6, 3, 1);
      }
    }
  }
}

function drawDecor(def) {
  for (const d of level.decor) {
    const x = Math.round(d.x - cam.x);
    if (x < -30 || x > VIEW_W + 30) continue;
    const groundY = (ROWS - 2) * TILE;
    if (d.kind === 0) {          // struik
      ctx.fillStyle = def.grassDark;
      ctx.fillRect(x, groundY - 6, 12, 6);
      ctx.fillStyle = def.grass;
      ctx.fillRect(x + 2, groundY - 9, 8, 5);
    } else if (d.kind === 1) {   // bloemetje
      ctx.fillStyle = "#3c7a3f";
      ctx.fillRect(x + 3, groundY - 6, 1, 6);
      ctx.fillStyle = "#ffe36e";
      ctx.fillRect(x + 2, groundY - 9, 3, 3);
    } else {                      // steen
      ctx.fillStyle = "rgba(0,0,0,.18)";
      ctx.fillRect(x, groundY - 4, 8, 4);
    }
  }
}

function drawHearts() {
  for (const h of level.hearts) {
    if (h.got) continue;
    const x = h.x - cam.x;
    if (x < -20 || x > VIEW_W + 20) continue;
    blit(SPR.heart, x, h.y + Math.sin(h.t) * 2);
  }
}

function drawFish() {
  for (const f of level.fish) {
    if (f.got || f.expired) continue;
    const x = f.x - cam.x;
    if (x < -20 || x > VIEW_W + 20) continue;
    // knippert sneller vlak voor het wegzwemt, als laatste waarschuwing
    if (f.life > FISH_LIFETIME - 90 && Math.floor(game.frame / 5) % 2 === 0) continue;
    // en anders af en toe kort, zodat het extra opvalt tussen de botjes
    const cycle = (game.frame + Math.floor(f.t * 20)) % 50;
    if (cycle < 4) continue;
    blit(SPR.fish, x, f.y + Math.sin(f.t) * 2);
  }
}

function drawDucks() {
  for (const d of level.ducks) {
    const x = d.x - cam.x;
    if (x < -20 || x > VIEW_W + 20) continue;
    const y = d.y + Math.sin(d.phase) * 1.5;
    // spiegelbeeld en een rimpeltje op het water
    ctx.fillStyle = "rgba(255,255,255,.35)";
    ctx.fillRect(Math.round(x), Math.round(y + 8), 12, 1);
    blit(SPR.duck, x, y, d.dir > 0);
  }
}

function drawMice() {
  for (const m of level.mice) {
    if (m.caught || m.expired) continue;
    // knippert vlak voor hij wegglipt, als laatste waarschuwing
    if (m.life > MOUSE_LIFETIME - 90 && Math.floor(game.frame / 5) % 2 === 0) continue;
    const x = m.x - cam.x - 3;
    if (x < -30 || x > VIEW_W + 30) continue;
    blit(SPR.mouse, x, m.y - 1, m.vx > 0);
  }
}

/** Zwevende platforms: bewegend en wolk (die vervaagt naarmate hij oplost). */
function drawPlatforms() {
  const lily = level.def.swim;   // in het zwemlevel zijn de platforms waterlelie-bladeren
  for (const pl of level.platforms) {
    const x = Math.round(pl.x - cam.x), y = Math.round(pl.y);
    if (x < -60 || x > VIEW_W + 60) continue;
    if (lily) {
      ctx.fillStyle = "#3f8f4a";
      ctx.fillRect(x, y, pl.w, pl.h);
      ctx.fillStyle = "#5fb85f";
      ctx.fillRect(x, y, pl.w, 2);
      ctx.fillStyle = "#2c6b38";
      ctx.fillRect(x, y + pl.h - 2, pl.w, 2);
      ctx.fillRect(x + pl.w / 2 - 1, y + 1, 2, pl.h - 2);   // nerf in het blad
    } else {
      ctx.fillStyle = "#8f7ad8";
      ctx.fillRect(x, y, pl.w, pl.h);
      ctx.fillStyle = "#c9bdf5";
      ctx.fillRect(x, y, pl.w, 2);
      ctx.fillStyle = "#5c4a9e";
      ctx.fillRect(x, y + pl.h - 2, pl.w, 2);
    }
  }
  for (const cl of level.cloudPlatforms) {
    if (cl.state === "gone") continue;
    const x = Math.round(cl.x - cam.x), y = Math.round(cl.y);
    if (x < -60 || x > VIEW_W + 60) continue;
    ctx.globalAlpha = cl.timer > 0 ? Math.max(0.25, 1 - cl.timer / 30) : 1;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x, y + 3, cl.w, cl.h - 3);
    ctx.fillRect(x + 4, y, cl.w - 8, 4);
    ctx.globalAlpha = 1;
  }
}

function drawEnemies() {
  for (const en of level.enemies) {
    const x = en.x - cam.x;
    if (x < -40 || x > VIEW_W + 40) continue;
    const flip = en.vx > 0;

    if (en.dead) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - en.deadT / 40);
      ctx.translate(0, 0);
    }

    if (en.type === "dog") {
      const spr = (Math.floor(en.anim / 9) % 2) ? SPR.dog.b : SPR.dog.a;
      blit(spr, x, en.y - 2, !flip);
    } else if (en.type === "rival") {
      const spr = (Math.floor(en.anim / 8) % 2) ? SPR.rival.walkA : SPR.rival.walkB;
      blit(spr, x - 2, en.y - 3, !flip);
      // rode halsband
      ctx.fillStyle = "#c2233a";
      ctx.fillRect(Math.round(x + (flip ? 1 : 8)), Math.round(en.y + 4), 4, 2);
    } else if (en.type === "car") {
      const bob = Math.floor(en.anim / 5) % 2;   // hobbelt over de weg
      blit(SPR.car, x - 1, en.y - 1 + bob, !flip);
      // uitlaatwolkje aan de achterkant
      if (en.anim % 14 < 4) {
        ctx.fillStyle = "rgba(200,200,210,.5)";
        ctx.fillRect(Math.round(x + (flip ? en.w : -4)), Math.round(en.y + 15), 4, 3);
      }
    } else if (en.type === "bird") {
      const up = Math.floor(en.anim / 7) % 2 === 0;
      blit(SPR.bird, x, en.y, !flip);
      ctx.fillStyle = "#3f5a86";
      const wx = Math.round(x + 3), wy = Math.round(en.y);
      if (up) { ctx.fillRect(wx, wy - 4, 7, 3); ctx.fillRect(wx + 1, wy - 6, 4, 2); }
      else    { ctx.fillRect(wx, wy + 7, 7, 3); ctx.fillRect(wx + 1, wy + 9, 4, 2); }
    }

    if (en.dead) ctx.restore();
  }
}

function drawGate() {
  const g = level.gate;
  if (!g) return;
  const x = Math.round(g.x - cam.x), y = Math.round(g.y);
  if (x < -60 || x > VIEW_W + 60) return;

  // lichtbundel
  const grad = ctx.createLinearGradient(0, y - 40, 0, y + g.h);
  grad.addColorStop(0, "rgba(255,255,255,0)");
  grad.addColorStop(1, "rgba(255,255,190,.45)");
  ctx.fillStyle = grad;
  ctx.fillRect(x - 4, y - 40, g.w + 8, g.h + 40);

  // wolkjes onderaan
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x - 6, y + g.h - 6, g.w + 12, 6);
  ctx.fillRect(x - 2, y + g.h - 10, g.w + 4, 5);

  // gouden poort
  ctx.fillStyle = "#e8b63c";
  ctx.fillRect(x, y + 8, 5, g.h - 12);
  ctx.fillRect(x + g.w - 5, y + 8, 5, g.h - 12);
  ctx.fillRect(x + 3, y + 4, g.w - 6, 5);
  ctx.fillRect(x + 8, y, g.w - 16, 5);
  ctx.fillStyle = "#fff0b0";
  ctx.fillRect(x + 1, y + 8, 2, g.h - 12);
  ctx.fillRect(x + g.w - 4, y + 8, 2, g.h - 12);

  // glinstering
  if (Math.floor(game.frame / 12) % 2 === 0) {
    ctx.fillStyle = "rgba(255,255,255,.9)";
    ctx.fillRect(x + 6, y + 12, 2, 2);
    ctx.fillRect(x + g.w - 9, y + 26, 2, 2);
  }
}

function drawPlayer() {
  const p = player;
  const blinking = p.invuln > 0 && Math.floor(game.frame / 4) % 2 === 0;
  if (blinking && (game.state === STATE.PLAY || game.state === STATE.BOSS)) return;

  // met een visje op zak knippert Jack geel: zo zie je dat ze een schild heeft
  const catSet = (p.powered && Math.floor(game.frame / 8) % 2 === 0) ? SPR.jackyPower : SPR.jacky;

  let spr;
  if (game.state === STATE.DEAD || !p.onGround) spr = catSet.jump;
  else if (Math.abs(p.vx) > 0.15) spr = (Math.floor(p.anim / 2) % 2) ? catSet.walkA : catSet.walkB;
  else spr = catSet.idle;
  if (game.state === STATE.HUG) spr = catSet.idle;

  const x = p.x - cam.x - 3;
  const y = p.y - 3;

  /** Tekent het skateboard onder Jack. */
  function board(bx, by, flip) {
    const d = flip ? -1 : 1;
    ctx.fillStyle = "#8a5730";
    ctx.fillRect(Math.round(bx), Math.round(by), 16, 3);
    ctx.fillStyle = "#c98a4a";
    ctx.fillRect(Math.round(bx + 1), Math.round(by), 14, 1);
    ctx.fillStyle = "#241f1c";
    ctx.fillRect(Math.round(bx + 2), Math.round(by + 3), 3, 2);
    ctx.fillRect(Math.round(bx + 11), Math.round(by + 3), 3, 2);
    // opgewipte neus
    ctx.fillStyle = "#8a5730";
    ctx.fillRect(Math.round(bx + (d > 0 ? 15 : 0)), Math.round(by - 2), 1, 3);
  }

  // zacht schaduwtje zodat Jack ook tegen een drukke tekening goed te zien is
  if (game.state !== STATE.DEAD && !p.swimming) {
    ctx.fillStyle = "rgba(0,0,0,.22)";
    const shy = p.onGround ? p.y + p.h - 1 : p.y + p.h + 3;
    ctx.fillRect(Math.round(x + 2), Math.round(shy - cam.y), 14, 3);
  }

  if (p.spin > 0) {
    // salto: sprite + board samen ronddraaien
    const cx = x + spr.width / 2, cy = y + spr.height / 2;
    ctx.save();
    ctx.translate(Math.round(cx), Math.round(cy));
    ctx.rotate(p.spinAngle);
    ctx.drawImage(spr, Math.round(-spr.width / 2), Math.round(-spr.height / 2));
    ctx.fillStyle = "#8a5730";
    ctx.fillRect(-8, Math.round(spr.height / 2 - 3), 16, 3);
    ctx.restore();
  } else if (p.swimming) {
    // zwemmen: Jack ligt schuin in het water en peddelt, onderlijf onder water
    const swimSpr = (Math.floor(game.frame / 8) % 2) ? catSet.walkA : catSet.walkB;
    const bob = Math.sin(game.frame * 0.22) * 1.2;
    const cx = x + swimSpr.width / 2, cy = y + swimSpr.height / 2 + 3 + bob;
    ctx.save();
    ctx.translate(Math.round(cx), Math.round(cy));
    if (p.facing < 0) ctx.scale(-1, 1);
    ctx.rotate(0.24);
    ctx.drawImage(swimSpr, Math.round(-swimSpr.width / 2), Math.round(-swimSpr.height / 2));
    ctx.restore();
    // waterlijn over het onderlijf + peddelrimpeltjes
    ctx.fillStyle = "rgba(120,190,235,.55)";
    ctx.fillRect(Math.round(x - 2), Math.round(p.y + p.h - 3), 20, 6);
    if (game.frame % 10 < 4) {
      ctx.fillStyle = "rgba(255,255,255,.7)";
      ctx.fillRect(Math.round(x + (p.facing < 0 ? -3 : 15)), Math.round(p.y + p.h - 2), 3, 2);
    }
  } else {
    if (p.skating) board(x + 1, p.y - cam.y + p.h - 4, p.facing < 0);
    blit(spr, x, y, p.facing < 0);
  }
}

/** Skateboard dat nog op de grond ligt om op te rapen. */
function drawSkates() {
  for (const s of level.skates) {
    if (s.got) continue;
    const bx = s.x - cam.x, by = s.y + Math.sin(s.t + game.frame * 0.08) * 1.5;
    ctx.fillStyle = "#8a5730";
    ctx.fillRect(Math.round(bx), Math.round(by + 4), 15, 3);
    ctx.fillStyle = "#c98a4a";
    ctx.fillRect(Math.round(bx + 1), Math.round(by + 4), 13, 1);
    ctx.fillStyle = "#241f1c";
    ctx.fillRect(Math.round(bx + 2), Math.round(by + 7), 3, 2);
    ctx.fillRect(Math.round(bx + 10), Math.round(by + 7), 3, 2);
  }
}

/** De halfpipe-schansen (J-tegels): een houten kicker die naar rechts omhoog krult. */
function drawRamps() {
  const gt = (ROWS - 2) * TILE;
  for (const r of level.ramps) {
    const rx = r.x + 3 - cam.x;
    if (rx < -TILE * 2 || rx > VIEW_W + TILE) continue;
    ctx.fillStyle = "#a06a3c";
    ctx.beginPath();
    ctx.moveTo(rx, gt);
    ctx.quadraticCurveTo(rx + TILE * 0.8, gt, rx + TILE, gt - 15);
    ctx.lineTo(rx + TILE, gt);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#7a4a28";
    ctx.fillRect(Math.round(rx + TILE - 2), Math.round(gt - 19), 3, 8);
    ctx.fillStyle = "rgba(255,255,255,.25)";
    ctx.fillRect(Math.round(rx + 2), Math.round(gt - 3), TILE - 3, 1);
  }
}

/* ---- eindbaas en hondje ------------------------------------------------ */
function drawBoss() {
  let x = boss.x, y = boss.y;

  // tijdens het keren: waarschuwingsteken boven de stofzuiger
  if (boss.phase === "wait" && !boss.broken && Math.floor(game.frame / 6) % 2 === 0) {
    ctx.fillStyle = "#ffe36e";
    ctx.fillRect(Math.round(x + boss.w / 2 - 4), Math.round(y - 16), 8, 10);
    ctx.fillStyle = "#c0392b";
    ctx.fillRect(Math.round(x + boss.w / 2 - 1), Math.round(y - 14), 2, 5);
    ctx.fillRect(Math.round(x + boss.w / 2 - 1), Math.round(y - 8), 2, 2);
  }
  if (boss.broken) {
    x += Math.sin(boss.shake * 0.9) * 2;
    y += Math.sin(boss.shake * 1.7) * 1;
  }
  blit(SPR.vac, x, y, boss.vx > 0);

  // slang: boog van de bovenkant naar de zuigmond (meespiegelend)
  const flip = boss.vx > 0;
  const mir = (px) => flip ? boss.w - px : px;
  ctx.fillStyle = PAL_VAC.n;
  for (const [px, py] of [[9, -5], [13, -7], [17, -6], [20, -3], [21, 1]]) {
    ctx.fillRect(Math.round(x + mir(px) - 1), Math.round(y + py), 3, 3);
  }

  // stofwolkje achter de stofzuiger (de arena scrollt niet, dus cam.x is 0)
  if (!boss.broken && game.frame % 3 === 0) {
    spawnParticles(boss.x + (boss.vx < 0 ? boss.w : 0), boss.y + boss.h - 2,
                   "rgba(210,210,220,.7)", 1, 0.8);
  }
}

function drawCharlie() {
  const x = Math.round(charlie.x - cam.x);
  const y = Math.round(charlie.y);

  // armen: open als Jack dichtbij is, dicht bij de knuffel
  const open = charlie.caught ? 0 : charlie.arms;
  const armY = y + 16;
  const reach = Math.round(3 + open * 8);
  const lift  = Math.round(open * 4);

  // De armen sluiten aan op de zijkant van de romp (die begint 4px in de sprite).
  const rompL = x + 4, rompR = x + charlie.w - 4;
  ctx.fillStyle = PAL_CHAR.o;
  ctx.fillRect(rompL - reach - 1, armY - lift - 1, reach + 2, 4);
  ctx.fillRect(rompR - 1, armY - lift - 1, reach + 2, 4);
  ctx.fillStyle = PAL_CHAR.s;
  ctx.fillRect(rompL - reach, armY - lift, reach + 1, 2);
  ctx.fillRect(rompR, armY - lift, reach, 2);

  blit(SPR.charlie, x, y);

  // zwevende botjes tijdens de knuffel
  if (game.state === STATE.HUG) {
    for (let i = 0; i < 4; i++) {
      const t = (game.timer * 0.6 + i * 22) % 90;
      const hx = x - 6 + i * 7 + Math.sin(t * 0.1 + i) * 3;
      blit(SPR.heart, hx, y - t * 0.5 + 6);
    }
  }
}

/** Tekstballon met "Kom mee naar huis, Jack!". */
function drawSpeech(px, py, str) {
  ctx.font = '9px "Courier New", monospace';
  const w = ctx.measureText(str).width + 10;
  const x = Math.round(px - w / 2), y = Math.round(py);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x, y, w, 14);
  ctx.fillRect(x + w / 2 - 3, y + 14, 6, 4);
  ctx.fillStyle = "rgba(0,0,0,.25)";
  ctx.fillRect(x, y + 13, w, 1);
  text(str, px, y + 3, 9, "#7a2d55", "center", false);
}

function drawParticles() {
  for (const pt of level.particles) {
    ctx.fillStyle = pt.color;
    ctx.globalAlpha = Math.min(1, pt.life / 16);
    ctx.fillRect(Math.round(pt.x - cam.x), Math.round(pt.y), 2, 2);
  }
  ctx.globalAlpha = 1;
}

/* ---- tekst -------------------------------------------------------------- */
function text(str, x, y, size = 8, color = "#ffffff", align = "left", shadow = true) {
  ctx.font = `${size}px "Courier New", monospace`;
  ctx.textAlign = align;
  ctx.textBaseline = "top";
  if (shadow) {
    ctx.fillStyle = "rgba(0,0,0,.55)";
    ctx.fillText(str, Math.round(x) + 1, Math.round(y) + 1);
  }
  ctx.fillStyle = color;
  ctx.fillText(str, Math.round(x), Math.round(y));
}

function drawHUD() {
  // levens
  ctx.fillStyle = "rgba(0,0,0,.28)";
  ctx.fillRect(0, 0, VIEW_W, 14);

  blit(SPR.jacky.idle, 2, -2);
  text(`x${game.lives}`, 19, 3, 9, "#ffffff");

  const hx = 52;
  blit(SPR.heart, hx, 3);
  text(`x${game.hearts}`, hx + 11, 3, 9, "#ffd6e0");

  // blijvend schild-icoontje zolang de vissenkracht actief is
  if (player && player.powered && Math.floor(game.frame / 8) % 2 === 0) {
    blit(SPR.fish, hx + 34, 2);
  }
  // skateboard-icoontje zolang Jack skate't
  if (player && player.skating) {
    ctx.fillStyle = "#8a5730";
    ctx.fillRect(hx + 34, 8, 15, 3);
    ctx.fillStyle = "#241f1c";
    ctx.fillRect(hx + 36, 11, 3, 2);
    ctx.fillRect(hx + 44, 11, 3, 2);
  }

  if (game.stage === "boss") {
    text("STOFZUIGER", VIEW_W - 4, 3, 9, "#ffd6e0", "right");
    // tien blokjes: zo vaak moet je er nog overheen
    for (let i = 0; i < BOSS_JUMPS; i++) {
      ctx.fillStyle = i < boss.jumps ? "#ffe36e" : "rgba(255,255,255,.25)";
      ctx.fillRect(VIEW_W / 2 - 40 + i * 8, 4, 6, 6);
    }
  } else if (game.stage === "charlie") {
    text("THUIS", VIEW_W - 4, 3, 9, "#ffd6e0", "right");
    if (!charlie.caught) text("Spring in zijn armen!", VIEW_W / 2, 3, 9, "#ffffff", "center");
  } else {
    text(`LEVEL ${game.levelIndex + 1}/${LEVELS.length}`, VIEW_W - 4, 3, 9, "#ffffff", "right");
    // voortgangsbalk naar huis
    const prog = Math.max(0, Math.min(1, (player.x) / (level.gate ? level.gate.x : level.width * TILE)));
    ctx.fillStyle = "rgba(255,255,255,.25)";
    ctx.fillRect(VIEW_W / 2 - 40, 5, 80, 4);
    ctx.fillStyle = "#ffe36e";
    ctx.fillRect(VIEW_W / 2 - 40, 5, Math.round(80 * prog), 4);
  }

  if (game.popup.timer > 0) {
    text(game.popup.text, VIEW_W / 2, 22, 12, game.popup.color, "center");
  }
}

function panel(w, h) {
  const x = (VIEW_W - w) / 2, y = (VIEW_H - h) / 2;
  ctx.fillStyle = "rgba(12,14,26,.82)";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "rgba(255,255,255,.22)";
  ctx.fillRect(x, y, w, 1); ctx.fillRect(x, y + h - 1, w, 1);
  ctx.fillRect(x, y, 1, h); ctx.fillRect(x + w - 1, y, 1, h);
  return { x, y };
}

function drawTitle() {
  drawSky(LEVELS[LEVELS.length - 1]);   // de Ochtendspits: het zonnigste level, mooi als titelscherm
  drawClouds2();
  const cx = VIEW_W / 2;

  text("JACK", cx, 34, 30, "#fff6d0", "center");
  text("op avontuur", cx, 66, 14, "#b8336a", "center");

  // Jack die vrolijk op en neer wipt
  const bob = Math.abs(Math.sin(game.frame * 0.09)) * 4;
  const px = cx - 8, py = 104 - bob;
  blit(SPR.jacky.walkB, px, py);

  if (Math.floor(game.frame / 30) % 2 === 0) {
    text("DRUK OP SPATIE OM TE BEGINNEN", cx, 148, 10, "#8f2f6b", "center", false);
  }
  text("Breng Jack veilig thuis", cx, 176, 9, "#5c3a7a", "center", false);
  const beste = sortScores(loadScores())[0];
  if (beste) {
    text(`Beste: ${String(beste.name).toUpperCase()} - ${beste.hearts} botjes`,
         cx, 190, 9, "#8f2f6b", "center", false);
  } else {
    text("Pas op voor katten, auto's en boze honden", cx, 190, 9, "#5c3a7a", "center", false);
  }
}

/** Wolkjes voor het titel-/eindscherm (zonder level). */
function drawClouds2() {
  ctx.fillStyle = "rgba(255,255,255,.8)";
  for (let i = 0; i < 7; i++) {
    const x = ((i * 71 + game.frame * (0.15 + i * 0.04)) % (VIEW_W + 80)) - 60;
    const y = 18 + (i * 29) % 150;
    const w = 26 + (i % 3) * 12;
    ctx.fillRect(Math.round(x), y + 4, w, 6);
    ctx.fillRect(Math.round(x) + 5, y, w - 12, 7);
  }
}

function drawOverlays() {
  const cx = VIEW_W / 2;

  if (game.state === STATE.INTRO) {
    const p = panel(230, 62);
    if (game.stage === "boss") {
      text("EINDBAAS", cx, p.y + 12, 14, "#ffffff", "center");
      text("De Stofzuiger", cx, p.y + 32, 10, "#ffd6e0", "center");
      text(`Spring er ${BOSS_JUMPS}x overheen!`, cx, p.y + 46, 9, "#cfe6ff", "center");
    } else if (game.stage === "charlie") {
      text("CHARLIE!", cx, p.y + 12, 14, "#ffffff", "center");
      text("Daar is je baasje", cx, p.y + 32, 10, "#ffd6e0", "center");
      text("Spring in zijn armen", cx, p.y + 46, 9, "#cfe6ff", "center");
    } else {
      text(`LEVEL ${game.levelIndex + 1}`, cx, p.y + 12, 14, "#ffffff", "center");
      text(LEVELS[game.levelIndex].name, cx, p.y + 32, 10, "#ffd6e0", "center");
      text(`Levens: ${game.lives}`, cx, p.y + 46, 9, "#cfe6ff", "center");
    }
  }

  if (game.state === STATE.BOSSWIN) {
    text("STOFZUIGER KAPOT!", cx, 60, 16, "#fff6d0", "center");
    text("Nu snel naar huis...", cx, 80, 10, "#ffffff", "center");
  }

  if (game.state === STATE.HUG) {
    if (game.timer > 96 && game.timer < 240) {
      drawSpeech(charlie.x - cam.x + 7, charlie.y - 22, "Kom mee naar huis, Jack!");
    }
    if (game.timer > 250) {
      text("Jack is eindelijk thuis...", cx, 40, 10, "#ffffff", "center");
    }
  }

  if (game.paused && (game.state === STATE.PLAY || game.state === STATE.BOSS || game.state === STATE.CHARLIE)) {
    const p = panel(150, 40);
    text("PAUZE", cx, p.y + 10, 14, "#ffffff", "center");
    text("druk op P", cx, p.y + 26, 9, "#cfe6ff", "center");
  }

  if (game.state === STATE.DEAD) {
    text("Woef!", cx, 70, 14, "#ffd6e0", "center");
  }

  if (game.state === STATE.CLEAR) {
    text("LEVEL GEHAALD!", cx, 60, 16, "#fff6d0", "center");
    text("Jack rent naar huis...", cx, 80, 10, "#ffffff", "center");
  }

  if (game.state === STATE.OVER) {
    const p = panel(230, 76);
    text("GAME OVER", cx, p.y + 12, 18, "#ff8a9c", "center");
    text(`Botjes verzameld: ${game.hearts}`, cx, p.y + 36, 10, "#ffffff", "center");
    if (game.timer > 60 && Math.floor(game.frame / 30) % 2 === 0) {
      text("SPATIE = topscores   R = opnieuw", cx, p.y + 54, 9, "#cfe6ff", "center");
    }
  }
}

/** Piepkleine, vervaagde skyline diep beneden: het gevoel van hoog boven de stad hangen. */
function drawFarCity() {
  ctx.fillStyle = "rgba(110,85,135,.55)";
  for (let x = 0; x < VIEW_W; x += 17) {
    const h = 7 + ((x * 7) % 13);
    ctx.fillRect(x, VIEW_H - h, 13, h);
  }
  ctx.fillStyle = "rgba(80,130,185,.5)";
  ctx.fillRect(0, VIEW_H - 4, VIEW_W, 4);   // het IJ
}

/** Jack, ontspannen schommelend op de rode swing, hoog boven Amsterdam. */
function drawSwing() {
  const pivotX = VIEW_W / 2 + 66, pivotY = 30;
  const angle = Math.sin(game.timer * 0.026) * 0.32;
  const armLen = 74;

  // bevestiging boven aan de mast
  ctx.fillStyle = "#9a9aa4";
  ctx.fillRect(pivotX - 3, pivotY - 7, 6, 9);

  ctx.save();
  ctx.translate(pivotX, pivotY);
  ctx.rotate(angle);

  ctx.strokeStyle = "#c0392b";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-6, 0); ctx.lineTo(-15, armLen);
  ctx.moveTo(6, 0); ctx.lineTo(15, armLen);
  ctx.stroke();

  ctx.fillStyle = "#c0392b";
  ctx.fillRect(-20, armLen, 40, 6);
  ctx.fillStyle = "#8f2318";
  ctx.fillRect(-20, armLen + 6, 40, 2);

  blit(SPR.jacky.idle, -8, armLen - 13);

  ctx.restore();

  // "Woef... woef..." -- komt en gaat, net als een tevreden hond
  const t = game.timer % 140;
  if (t > 15 && t < 105) {
    const seatX = pivotX + Math.sin(angle) * armLen;
    const seatY = pivotY + Math.cos(angle) * armLen;
    drawSpeech(seatX, seatY - 32, "Woef... woef...");
  }
}

function drawWin() {
  drawSky({ sky: ["#ffb37a", "#fff4c9"] });
  drawClouds2();
  drawFarCity();
  const cx = VIEW_W / 2;

  text("JACK IS WEER THUIS!", cx, 14, 16, "#8f2f6b", "center");
  text("Samen weer thuis...", cx, 34, 9, "#5f4a8f", "center", false);

  drawSwing();

  text(`Botjes verzameld: ${game.hearts}`, cx, VIEW_H - 42, 12, "#c02c50", "center", false);
  text(`Levens over: ${game.lives}`, cx, VIEW_H - 26, 10, "#5f4a8f", "center", false);
  if (game.timer > 120 && Math.floor(game.frame / 30) % 2 === 0) {
    text("SPATIE = naar de topscores", cx, VIEW_H - 10, 9, "#4a3a6b", "center", false);
  }
}

/* ---- verhaal, naam en topscores ---------------------------------------- */
function drawStory() {
  drawSky({ sky: ["#2b2f55", "#6b4a7a"] });
  drawClouds2();
  ctx.fillStyle = "rgba(20,16,40,.45)";   // wolken dempen zodat de tekst leest
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  const cx = VIEW_W / 2;

  const regels = [
    "Hond Jack is zijn baasje kwijt.",
    "Zijn baasje is nergens te vinden...",
    "",
    "Dus gaat Jack op pad: langs katten,",
    "vogels, boze honden en drukke wegen.",
    "",
    "Verzamel botjes: elke 15 geeft een",
    "extra leven om langer door te gaan.",
    "",
    "Als hij thuiskomt, is alles weer goed.",
  ];
  text("HET VERHAAL", cx, 22, 14, "#ffe36e", "center");
  regels.forEach((r, i) => text(r, cx, 50 + i * 13, 10, "#ffffff", "center"));

  // Jack loopt onderaan voorbij
  const wx = (game.frame * 0.7) % (VIEW_W + 40) - 20;
  const frame = (Math.floor(game.frame / 8) % 2) ? SPR.jacky.walkA : SPR.jacky.walkB;
  blit(frame, wx, VIEW_H - 26);

  if (game.timer > 30 && Math.floor(game.frame / 30) % 2 === 0) {
    text("SPATIE = beginnen", cx, VIEW_H - 46, 9, "#ffd6e0", "center");
  }
}

function drawNameEntry() {
  drawSky({ sky: ["#2b2f55", "#6b4a7a"] });
  drawClouds2();
  const cx = VIEW_W / 2;
  const p = panel(260, 110);

  text("TOP 10!", cx, p.y + 10, 16, "#ffe36e", "center");
  text(`Je hebt ${game.hearts} botjes`, cx, p.y + 32, 10, "#ffffff", "center");
  text("Typ je naam:", cx, p.y + 50, 9, "#cfe6ff", "center");

  const naam = nameEntry + (Math.floor(game.frame / 20) % 2 ? "_" : " ");
  ctx.fillStyle = "rgba(255,255,255,.12)";
  ctx.fillRect(cx - 60, p.y + 64, 120, 18);
  text(naam.toUpperCase(), cx, p.y + 68, 14, "#ffffff", "center");
  text("ENTER = klaar", cx, p.y + 90, 9, "#cfe6ff", "center");
}

function drawScores() {
  drawSky({ sky: ["#2b2f55", "#8a5a9a"] });
  drawClouds2();
  const cx = VIEW_W / 2;

  ctx.fillStyle = "rgba(12,14,26,.78)";
  ctx.fillRect(40, 16, VIEW_W - 80, VIEW_H - 46);

  text("TOP 10", cx, 22, 14, "#ffe36e", "center");

  if (scoreList.length === 0) {
    text("Nog geen scores...", cx, 90, 10, "#ffffff", "center");
  }
  for (let i = 0; i < scoreList.length; i++) {
    const s = scoreList[i];
    const y = 42 + i * 14;
    const nieuw = i === newScoreIndex && Math.floor(game.frame / 15) % 2 === 0;
    const kleur = nieuw ? "#ffe36e" : (i === newScoreIndex ? "#fff6d0" : "#ffffff");
    text(`${i + 1}.`, 52, y, 9, kleur);
    text(String(s.name).toUpperCase().slice(0, 8), 74, y, 9, kleur);
    text(`${s.hearts}`, VIEW_W - 76, y, 9, "#ff9ab0", "right");
    text(s.finished ? "THUIS" : `lvl ${s.level || 1}`, VIEW_W - 52, y, 9,
         s.finished ? "#ffe36e" : "#8d93b5");
  }

  if (game.timer > 45 && Math.floor(game.frame / 30) % 2 === 0) {
    text("SPATIE = terug naar het begin", cx, VIEW_H - 24, 9, "#ffd6e0", "center");
  }
}

function render() {
  ctx.imageSmoothingEnabled = false;

  if (game.state === STATE.TITLE)  { drawTitle(); return; }
  if (game.state === STATE.STORY)  { drawStory(); return; }
  if (game.state === STATE.WIN)    { drawWin(); return; }
  if (game.state === STATE.NAME)   { drawNameEntry(); return; }
  if (game.state === STATE.SCORES) { drawScores(); return; }

  const def = level.def;
  if (def.bg && drawHandBg(def)) {
    // de tekening vervangt lucht, wolken, heuvels en de toren
  } else {
    drawSky(def);
    drawAdamTower(def);
    drawClouds();
    if (def.buildings) drawBuildings(def);
    else if (!def.noGround) drawHills(def);
  }
  if (game.stage === "charlie") drawGreenery();
  drawDecor(def);
  drawTiles(def);
  drawRamps();
  drawGate();
  drawPlatforms();
  drawSkates();
  drawDucks();
  drawHearts();
  drawFish();
  drawMice();
  drawEnemies();
  if (game.stage === "boss") drawBoss();
  if (game.stage === "charlie") { drawGarden(); drawCharlie(); }
  drawParticles();
  drawPlayer();
  drawHUD();
  drawOverlays();

  if (player.hurtFlash > 0) {
    ctx.fillStyle = `rgba(255,60,90,${player.hurtFlash / 60})`;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }
}

/* --------------------------------------------------------------------------
   Hoofdlus met vaste tijdstap (60 Hz)
   -------------------------------------------------------------------------- */
let last = performance.now(), acc = 0;
const STEP = 1000 / 60;

function loop(now) {
  acc += Math.min(100, now - last);
  last = now;
  while (acc >= STEP) { update(); acc -= STEP; }
  render();
  requestAnimationFrame(loop);
}

/* --------------------------------------------------------------------------
   Schaal het canvas naar het venster (hele pixels voor scherpe randen)
   -------------------------------------------------------------------------- */
function resize() {
  const pad = document.body.classList.contains("touch") ? 20 : 90;
  const s = Math.max(1, Math.min(
    Math.floor(window.innerWidth / VIEW_W),
    Math.floor((window.innerHeight - pad) / VIEW_H)
  ));
  canvas.style.width  = VIEW_W * s + "px";
  canvas.style.height = VIEW_H * s + "px";
}
addEventListener("resize", resize);
resize();

loadLevel(0);
game.state = STATE.TITLE;
game.timer = 0;
requestAnimationFrame(loop);

// Kleine debug-haak (handig om in de console rond te kijken of te testen).
window.JACK = {
  game, STATE, keys, SPR,
  get level() { return level; },
  get player() { return player; },
  boss, charlie,
  step(n = 1) { for (let i = 0; i < n; i++) update(); },   // handig om te testen
  draw() { render(); },
  goto(i) { loadLevel(i); },
  gotoBoss() { loadBossStage(); },
  gotoBaasje() { loadCharlieStage(); },
  teleport(tx, ty) { player.x = tx * TILE; player.y = ty * TILE; player.vx = player.vy = 0; },
};

})();
