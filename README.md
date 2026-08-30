# hondje

Een klein HTML5-platformspel met **Jack** de hond.

Gemaakt door **Charlie en Silke**.

De gameplay is overgenomen van [*Jacky goes to Heaven*](https://guidovandiepen.github.io/jackygoestoheaven/)
van Guido van Diepen. De sprite van Jack komt uit het MakeCode Arcade-project *King Popla*.

## Spelen

Open `index.html` in een browser, of speel de gehoste versie via GitHub Pages.

- **← →** of **A / D** — lopen
- **Spatie / ↑ / W** — springen
- **P** — pauze · **M** — geluid · **R** — opnieuw

Verzamel hartjes (elke 20 = extra leven), spring op katten en honden, ontwijk
auto's en water, en breng Jack veilig thuis.

## Techniek

Alles zit in `game.js`: sprites, geluid (WebAudio) en levels worden in code
opgebouwd, geen externe bestanden. Canvas rendert op 384×224 en schaalt op.
