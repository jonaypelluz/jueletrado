# Words per level per game — summary

`eligible` = distinct words the game can show at that level after every filter in the code. `shown` = words played per session. `sessions until first repeat` = median over 300 simulated players of the session in which a word already seen comes back (uniform independent refills, as `DBService.getRandomWords` does). It ignores the code bugs that repeat earlier (see the report).

| game | locale | level | eligible | shown/session | sessions until first repeat | note |
|---|---|---|---:|---:|---:|---|
| spellTower | es | beginner | 2795 | 15 | 5 | today: single-option words included |
| spellTower | es | intermediate | 73.240 | 15 | 24 | today: single-option words included |
| spellTower | es | advanced | 667.099 | 15 | 62 | today: single-option words included |
| spellTower (≥2 opciones, tras job 3) | es | beginner | 2478 | 15 | 5 | only words with ≥1 distractor |
| spellTower (≥2 opciones, tras job 3) | es | intermediate | 72.128 | 15 | 24 | only words with ≥1 distractor |
| spellTower (≥2 opciones, tras job 3) | es | advanced | 633.058 | 15 | 61 | only words with ≥1 distractor |
| wordsRain | es | beginner | 2795 | 150 | 1 | cycles the same 150 words for 1 h; single-option words included |
| wordsRain | es | intermediate | 73.240 | 150 | 1 | cycles the same 150 words for 1 h; single-option words included |
| wordsRain | es | advanced | 667.099 | 150 | 1 | cycles the same 150 words for 1 h; single-option words included |
| wordFinder | es | beginner | 421 | 10 | 3 |  |
| wordFinder | es | intermediate | 9686 | 10 | 12 |  |
| wordFinder | es | advanced | 256.829 | 10 | 64 |  |
| accentFixer | es | beginner | 1234 | 10 | 5 |  |
| accentFixer | es | intermediate | 30.475 | 10 | 23 |  |
| accentFixer | es | advanced | 557.784 | 10 | 88 |  |
| syllableSplitter | es | beginner | 1308 | 10 | 5 |  |
| syllableSplitter | es | intermediate | 31.056 | 10 | 22 |  |
| syllableSplitter | es | advanced | 534.602 | 10 | 89 |  |
| letterMatcher | es | beginner | 409 | 10 | 3 |  |
| letterMatcher | es | intermediate | 14.462 | 10 | 16 |  |
| letterMatcher | es | advanced | 354.113 | 10 | 69 |  |
| dailyWord | es | beginner (always) | 3000 | 1 | 63 | level ignored; 1 word/day |
| definitionMaster | es | beginner | 9010 | 10 | 12 |  |
| definitionMaster | es | intermediate | 7872 | 10 | 11 |  |
| definitionMaster | es | advanced | 6625 | 10 | 11 |  |
| spellingBee | es | beginner | 7882 | 5 | 22 |  |
| spellingBee | es | intermediate | 8147 | 5 | 22 |  |
| spellingBee | es | advanced | 8160 | 5 | 22 |  |
| wordBuilder | es | all (level ignored) | 100 | — | — | median words findable per letter set |
| spellTower | en | beginner | 2722 | 15 | 5 | today: single-option words included |
| spellTower | en | intermediate | 31.084 | 15 | 15 | today: single-option words included |
| spellTower | en | advanced | 353.299 | 15 | 48 | today: single-option words included |
| spellTower (≥2 opciones, tras job 3) | en | beginner | 818 | 15 | 3 | only words with ≥1 distractor |
| spellTower (≥2 opciones, tras job 3) | en | intermediate | 12.287 | 15 | 9 | only words with ≥1 distractor |
| spellTower (≥2 opciones, tras job 3) | en | advanced | 145.314 | 15 | 30 | only words with ≥1 distractor |
| wordsRain | en | beginner | 2722 | 150 | 1 | cycles the same 150 words for 1 h; single-option words included |
| wordsRain | en | intermediate | 31.084 | 150 | 1 | cycles the same 150 words for 1 h; single-option words included |
| wordsRain | en | advanced | 353.299 | 150 | 1 | cycles the same 150 words for 1 h; single-option words included |
| wordFinder | en | beginner | 678 | 10 | 4 |  |
| wordFinder | en | intermediate | 5559 | 10 | 9 |  |
| wordFinder | en | advanced | 163.592 | 10 | 48 |  |
| letterMatcher | en | beginner | 300 | 10 | 3 |  |
| letterMatcher | en | intermediate | 3980 | 10 | 8 |  |
| letterMatcher | en | advanced | 141.488 | 10 | 45 |  |
| dailyWord | en | beginner (always) | 2993 | 1 | 65 | level ignored; 1 word/day |
| definitionMaster | en | beginner | 45.984 | 10 | 27 |  |
| definitionMaster | en | intermediate | 33.462 | 10 | 23 |  |
| definitionMaster | en | advanced | 24.441 | 10 | 20 |  |
| spellingBee | en | beginner | 41.456 | 5 | 48 |  |
| spellingBee | en | intermediate | 43.788 | 5 | 48 |  |
| spellingBee | en | advanced | 43.924 | 5 | 51 |  |
| wordBuilder | en | all (level ignored) | 144 | — | — | median words findable per letter set |

# ES

## Level lists (public/words)

| level | entries | unique | duplicates | also in beginner | also in intermediate | also in advanced | not lowercase letters only | length ≤ 2 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| beginner | 3000 | 3000 | 0 | — | 40 | 50 | 1 | 86 |
| intermediate | 73.416 | 73.416 | 0 | 40 | — | 66.829 | 2 | 59 |
| advanced | 668.063 | 668.063 | 0 | 50 | 66.829 | — | 6 | 112 |

- beginner sample of entries that are not lowercase letters: `när`
- intermediate sample of entries that are not lowercase letters: `ampère`, `º`
- advanced sample of entries that are not lowercase letters: `ampère`, `déjà`, `grâce`, `maëlstrom`, `où`, `procès`

## Blocklisted words still present in the level lists

- beginner: 0
- intermediate: 0
- advanced: 0

## Difficulty profile of each level (raw list, before game filters)

| set | words | len min–median–max | freq rank median | in top-10k | not in freq list | with accent | with ñ | with hiatus |
|---|---:|---|---:|---:|---:|---:|---:|---:|
| beginner | 3000 | 1–6–15 | 1494 | 97.8% | 2.2% | 15.5% | 1.4% | 5.2% |
| intermediate | 73.416 | 1–9–25 | 6418 | 8.8% | 91.2% | 19.1% | 2.9% | 10.1% |
| advanced | 668.063 | 1–10–23 | 78.482 | 0.0% | 86.6% | 36.1% | 2.2% | 22.7% |

| set | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13+ |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| beginner | 24 | 62 | 119 | 302 | 529 | 509 | 503 | 366 | 242 | 159 | 89 | 37 | 59 |
| intermediate | 5 | 54 | 117 | 706 | 2751 | 6229 | 9899 | 12.241 | 12.432 | 10.380 | 7538 | 4759 | 6305 |
| advanced | 3 | 109 | 852 | 4146 | 13.150 | 29.246 | 52.614 | 77.984 | 96.985 | 105.180 | 96.722 | 76.483 | 114.589 |

## Games

### spellTower + wordsRain — distractor generation (`processWord` → `processWordWithAccent`)

| level | in length window (≥4) | 1 option (no distractor) | 2 options | 3 options | eligible (≥2 options) |
|---|---:|---:|---:|---:|---:|
| beginner | 2795 | 317 (11.3%) | 1536 | 942 | 2478 |
| intermediate | 73.240 | 1112 (1.5%) | 34.602 | 37.526 | 72.128 |
| advanced | 667.099 | 34.041 (5.1%) | 332.932 | 300.126 | 633.058 |

### spellTower

| set | words | len min–median–max | freq rank median | in top-10k | not in freq list | with accent | with ñ | with hiatus |
|---|---:|---|---:|---:|---:|---:|---:|---:|
| beginner | 2795 | 4–7–15 | 1553 | 97.7% | 2.3% | 16.0% | 1.5% | 5.0% |
| intermediate | 73.240 | 4–9–25 | 6430 | 8.6% | 91.4% | 19.1% | 2.9% | 10.1% |
| advanced | 667.099 | 4–10–23 | 78.988 | 0.0% | 86.7% | 36.1% | 2.2% | 22.8% |

| set | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13+ |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| beginner | 0 | 302 | 529 | 509 | 503 | 366 | 242 | 159 | 89 | 37 | 59 |
| intermediate | 0 | 706 | 2751 | 6229 | 9899 | 12.241 | 12.432 | 10.380 | 7538 | 4759 | 6305 |
| advanced | 0 | 4146 | 13.150 | 29.246 | 52.614 | 77.984 | 96.985 | 105.180 | 96.722 | 76.483 | 114.589 |

| set | a | b | c | d | e | f | g | h | i | j | k | l | m | n | ñ | o | p | q | r | s | t | u | v | w | x | y | z | other |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| beginner | 211 | 60 | 356 | 187 | 228 | 91 | 54 | 85 | 104 | 36 | 3 | 97 | 174 | 70 | 0 | 60 | 355 | 29 | 122 | 171 | 137 | 26 | 104 | 5 | 0 | 2 | 4 | 24 |
| intermediate | 9827 | 3093 | 10.348 | 4962 | 6092 | 2315 | 2471 | 1867 | 2126 | 805 | 73 | 1965 | 4263 | 1082 | 88 | 1111 | 5991 | 473 | 3385 | 3774 | 3967 | 386 | 1583 | 29 | 56 | 204 | 717 | 187 |
| advanced | 101.021 | 18.121 | 68.897 | 86.116 | 96.188 | 15.581 | 13.844 | 11.864 | 20.147 | 5765 | 358 | 13.083 | 29.706 | 5650 | 312 | 7871 | 43.764 | 2150 | 49.041 | 29.090 | 28.848 | 2382 | 11.057 | 94 | 194 | 882 | 4699 | 374 |

### wordFinder — game window vs prefetched pool (WORD_GROUP_FETCH_CONFIG 4–9)

| level | game window | eligible by game window | eligible by prefetch window (first ≥60 words after a level change) | of those, outside the game window |
|---|---|---:|---:|---:|
| beginner | 3–4 | 421 | 2451 | 2149 (87.7%) |
| intermediate | 4–6 | 9686 | 44.258 | 34.572 (78.1%) |
| advanced | 6–9 | 256.829 | 274.125 | 17.296 (6.3%) |

### wordFinder

| set | words | len min–median–max | freq rank median | in top-10k | not in freq list | with accent | with ñ | with hiatus |
|---|---:|---|---:|---:|---:|---:|---:|---:|
| beginner | 421 | 3–4–4 | 902 | 98.8% | 1.2% | 12.4% | 1.9% | 9.0% |
| intermediate | 9686 | 4–6–6 | 6095 | 20.8% | 79.2% | 21.6% | 3.7% | 9.0% |
| advanced | 256.829 | 6–8–9 | 75.684 | 0.0% | 80.5% | 31.3% | 2.7% | 18.6% |

| set | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13+ |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| beginner | 119 | 302 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| intermediate | 0 | 706 | 2751 | 6229 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| advanced | 0 | 0 | 0 | 29.246 | 52.614 | 77.984 | 96.985 | 0 | 0 | 0 | 0 |

| set | a | b | c | d | e | f | g | h | i | j | k | l | m | n | ñ | o | p | q | r | s | t | u | v | w | x | y | z | other |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| beginner | 35 | 11 | 37 | 38 | 19 | 9 | 9 | 17 | 8 | 6 | 0 | 17 | 26 | 7 | 0 | 12 | 48 | 2 | 22 | 34 | 24 | 8 | 23 | 1 | 0 | 3 | 1 | 4 |
| intermediate | 1041 | 590 | 1188 | 281 | 284 | 411 | 399 | 289 | 120 | 253 | 17 | 436 | 582 | 202 | 56 | 229 | 779 | 64 | 540 | 484 | 645 | 106 | 274 | 10 | 11 | 93 | 153 | 149 |
| advanced | 44.157 | 9225 | 26.221 | 17.237 | 29.637 | 7648 | 6986 | 5599 | 6087 | 3133 | 185 | 7130 | 13.311 | 2734 | 166 | 4344 | 17.482 | 919 | 20.425 | 11.456 | 12.706 | 1248 | 5481 | 48 | 49 | 554 | 2450 | 211 |

### accentFixer — `buildChallenge` eligibility

| level | in window | eligible | with accent | without accent | accented share | prefetch pool (≥4) words outside window |
|---|---:|---:|---:|---:|---:|---:|
| beginner | 1340 | 1234 | 103 | 1131 | 8.3% | 52.1% |
| intermediate | 31.120 | 30.475 | 5175 | 25.300 | 17.0% | 57.5% |
| advanced | 649.803 | 557.784 | 142.972 | 414.812 | 25.6% | 2.6% |

### accentFixer

| set | words | len min–median–max | freq rank median | in top-10k | not in freq list | with accent | with ñ | with hiatus |
|---|---:|---|---:|---:|---:|---:|---:|---:|
| beginner | 1234 | 4–5–6 | 1290 | 98.9% | 1.1% | 8.3% | 1.8% | 5.5% |
| intermediate | 30.475 | 5–7–8 | 6312 | 11.7% | 88.3% | 17.0% | 3.6% | 9.7% |
| advanced | 557.784 | 6–10–23 | 79.339 | 0.0% | 86.3% | 25.6% | 2.2% | 23.7% |

| set | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13+ |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| beginner | 0 | 259 | 497 | 478 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| intermediate | 0 | 0 | 2595 | 6032 | 9730 | 12.118 | 0 | 0 | 0 | 0 | 0 |
| advanced | 0 | 0 | 0 | 22.980 | 42.645 | 64.833 | 82.540 | 90.853 | 84.480 | 67.336 | 102.117 |

| set | a | b | c | d | e | f | g | h | i | j | k | l | m | n | ñ | o | p | q | r | s | t | u | v | w | x | y | z | other |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| beginner | 93 | 42 | 136 | 80 | 57 | 47 | 32 | 48 | 17 | 25 | 0 | 59 | 98 | 33 | 0 | 23 | 135 | 14 | 44 | 92 | 67 | 12 | 66 | 1 | 0 | 0 | 2 | 11 |
| intermediate | 3931 | 1655 | 4256 | 1191 | 1764 | 1122 | 1237 | 794 | 500 | 545 | 32 | 1096 | 1891 | 512 | 64 | 562 | 2434 | 168 | 1643 | 1489 | 1877 | 203 | 762 | 11 | 26 | 158 | 409 | 143 |
| advanced | 83.727 | 14.917 | 58.292 | 72.293 | 80.691 | 12.907 | 11.479 | 9836 | 17.474 | 4558 | 254 | 10.606 | 24.775 | 4590 | 216 | 6416 | 37.002 | 1821 | 41.426 | 24.693 | 23.918 | 1894 | 9133 | 64 | 147 | 640 | 3830 | 185 |

### syllableSplitter — `isEligible`

| level | window | in window | eligible | share of prefetch pool (≥4) that passes `isEligible` with the level window |
|---|---|---:|---:|---:|
| beginner | 4–6 | 1340 | 1308 | 46.8% |
| intermediate | 5–8 | 31.120 | 31.056 | 42.4% |
| advanced | 6–12 | 535.214 | 534.602 | 80.1% |

| level | 2 syll. | 3 | 4 | 5 | 6+ |
|---|---:|---:|---:|---:|---:|
| beginner | 1039 | 267 | 2 | 0 | 0 |
| intermediate | 5066 | 18.406 | 7463 | 121 | 0 |
| advanced | 14.085 | 126.354 | 232.393 | 142.871 | 18.899 |

### syllableSplitter

| set | words | len min–median–max | freq rank median | in top-10k | not in freq list | with accent | with ñ | with hiatus |
|---|---:|---|---:|---:|---:|---:|---:|---:|
| beginner | 1308 | 4–5–6 | 1294 | 98.8% | 1.2% | 14.8% | 1.7% | 6.3% |
| intermediate | 31.056 | 5–7–8 | 6311 | 12.1% | 87.9% | 18.7% | 3.5% | 9.8% |
| advanced | 534.602 | 6–10–12 | 79.193 | 0.0% | 86.0% | 33.6% | 2.3% | 21.8% |

| set | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13+ |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| beginner | 0 | 272 | 527 | 509 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| intermediate | 0 | 0 | 2720 | 6221 | 9889 | 12.226 | 0 | 0 | 0 | 0 | 0 |
| advanced | 0 | 0 | 0 | 29.136 | 52.527 | 77.901 | 96.886 | 105.064 | 96.654 | 76.434 | 0 |

| set | a | b | c | d | e | f | g | h | i | j | k | l | m | n | ñ | o | p | q | r | s | t | u | v | w | x | y | z | other |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| beginner | 99 | 41 | 142 | 81 | 64 | 49 | 36 | 52 | 19 | 25 | 0 | 66 | 103 | 34 | 0 | 24 | 140 | 15 | 45 | 99 | 71 | 12 | 69 | 1 | 0 | 1 | 2 | 18 |
| intermediate | 3965 | 1672 | 4359 | 1211 | 1793 | 1144 | 1261 | 803 | 511 | 551 | 33 | 1123 | 1924 | 520 | 64 | 575 | 2493 | 176 | 1676 | 1512 | 1914 | 204 | 783 | 11 | 28 | 158 | 416 | 176 |
| advanced | 87.332 | 15.602 | 54.489 | 56.352 | 76.413 | 13.355 | 11.923 | 9861 | 14.922 | 4954 | 234 | 11.173 | 24.666 | 4575 | 255 | 6820 | 35.489 | 1768 | 41.418 | 22.754 | 23.791 | 1924 | 9376 | 58 | 118 | 681 | 4079 | 220 |

### letterMatcher — `buildLetterChallenge` eligibility (es)

| level | in window | eligible | share | prefetch pool (≥4) words outside window |
|---|---:|---:|---:|---:|
| beginner | 1340 | 409 | 30.5% | 52.1% |
| intermediate | 31.826 | 14.462 | 45.4% | 56.5% |
| advanced | 649.803 | 354.113 | 54.5% | 2.6% |

### letterMatcher

| set | words | len min–median–max | freq rank median | in top-10k | not in freq list | with accent | with ñ | with hiatus |
|---|---:|---|---:|---:|---:|---:|---:|---:|
| beginner | 409 | 4–5–6 | 1344 | 98.3% | 1.7% | 14.9% | 0.2% | 4.4% |
| intermediate | 14.462 | 4–7–8 | 6370 | 11.0% | 89.0% | 17.4% | 2.5% | 9.3% |
| advanced | 354.113 | 6–11–23 | 82.243 | 0.0% | 88.9% | 34.8% | 1.2% | 22.1% |

| set | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13+ |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| beginner | 0 | 61 | 167 | 181 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| intermediate | 0 | 192 | 994 | 2518 | 4685 | 6073 | 0 | 0 | 0 | 0 | 0 |
| advanced | 0 | 0 | 0 | 11.357 | 22.936 | 37.055 | 49.202 | 56.387 | 55.311 | 45.867 | 75.998 |

| set | a | b | c | d | e | f | g | h | i | j | k | l | m | n | ñ | o | p | q | r | s | t | u | v | w | x | y | z | other |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| beginner | 31 | 40 | 35 | 24 | 20 | 7 | 11 | 39 | 4 | 8 | 0 | 30 | 11 | 15 | 0 | 9 | 14 | 2 | 7 | 25 | 9 | 0 | 61 | 1 | 0 | 2 | 1 | 3 |
| intermediate | 1885 | 1667 | 2224 | 427 | 613 | 313 | 603 | 756 | 132 | 298 | 16 | 462 | 605 | 223 | 17 | 244 | 703 | 35 | 667 | 537 | 598 | 80 | 753 | 7 | 4 | 166 | 381 | 46 |
| advanced | 56.952 | 16.885 | 38.649 | 43.796 | 50.394 | 6217 | 7559 | 10.875 | 9713 | 2954 | 82 | 6136 | 12.198 | 2677 | 83 | 4046 | 18.318 | 854 | 22.818 | 15.838 | 10.871 | 941 | 10.229 | 34 | 23 | 671 | 4238 | 62 |

### Daily word (`loadDailyWordForLocale`: `getRandomWords(1)` from beginner, no length filter)

- beginner words: 3000; shorter than 4 letters (WORDS_DAILY's minLength, which the daily word never reads): 205 (6.8%) — e.g. `a`, `acá`, `ah`, `ahí`, `ahi`, `al`, `am`, `ama`, `amo`, `ana`, `and`, `año`
- beginner words with an entry in public/definitions/es: 2705 (90.2%)

## Definitions data (public/definitions)

| metric | value |
|---|---:|
| words with an entry | 9010 |
| … not in any level list | 0 (0.0%) |
| … with no definitions | 0 |
| `level` field | (none): 8425, beginner: 337, intermediate: 5, advanced: 243 |
| definitions | 61.115 |
| … empty text | 0 |
| … HTML/entity junk | 0 |
| … under 10 letters after `formatDefinition` (cut at first '.') | 1407 (2.3%) |
| … raw text contains the word | 7648 (12.5%) |
| … formatted text (what definitionMaster shows) contains the word | 2829 (4.6%) |
| … ES entry with an English part-of-speech label | 4501 (7.4%) |

Per letter (words with an entry):

| a | b | c | d | e | f | g | h | i | j | k | l | m | n | o | p | q | r | s | t | u | v | w | x | y | z |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1035 | 196 | 1188 | 599 | 717 | 278 | 191 | 206 | 425 | 80 | 5 | 291 | 516 | 176 | 227 | 925 | 67 | 489 | 587 | 397 | 77 | 284 | 10 | 1 | 19 | 24 |

- Short-after-format samples: `abre: "hacer. Abrir un agujero, un ojal, una ranura, un camino, un " → "Hacer"`; `abren: "hacer. Abrir un agujero, un ojal, una ranura, un camino, un " → "Hacer"`; `abría: "hacer. Abrir un agujero, un ojal, una ranura, un camino, un " → "Hacer"`; `abriendo: "hacer. Abrir un agujero, un ojal, una ranura, un camino, un " → "Hacer"`; `abrieron: "hacer. Abrir un agujero, un ojal, una ranura, un camino, un " → "Hacer"`; `abrió: "hacer. Abrir un agujero, un ojal, una ranura, un camino, un " → "Hacer"`; `abrir: "hacer. Abrir un agujero, un ojal, una ranura, un camino, un " → "Hacer"`; `abrirse: "hacer. Abrir un agujero, un ojal, una ranura, un camino, un " → "Hacer"`
- Shown definition contains the word: `abanico: "Cosa en forma de abanico desplegado"`; `abanico: "En algunas armaduras antiguas, parte lateral del codal o de la rodillera, en for"`; `abanico: "Señal ferroviaria en forma de abanico para indicar al maquinista dónde se bifurc"`; `abstracto: "Dicho de una obra de arte o de un artista: Que sigue el arte abstracto"`; `abundan: "Dotar en abundancia"`; `académica: "Individuo perteneciente a una corporación académica"`
- English labels in ES: `a [preposition]: Precede al complemento directo cuando este es de persona det`; `a [preposition]: Precede al complemento indirecto.`; `a [preposition]: Introduce un complemento regido por determinados verbos, adj`; `a [preposition]: Precede al complemento directo cuando este es de persona det`; `a [preposition]: Precede al complemento indirecto.`; `a [preposition]: Introduce un complemento regido por determinados verbos, adj`

### definitionMaster — words per letter with enough definitions (`minDefs` 1/2/3, max 10 per letter session)

| level | total eligible | letters with < 5 words (fewer than 5 options) | letters with < 10 words (short quiz) | sessions per letter before repeat (eligible/10) min–median |
|---|---:|---|---|---|
| beginner | 9010 | — | k | 0.5–27.8 |
| intermediate | 7872 | k w | k w | 0.1–24.3 |
| advanced | 6625 | k w | k w | 1.0–21.7 |

- Words whose first formatted definition repeats another word's in the same letter file (identical answer options): 3481 — e.g. `abandonada / abandonado: "descuidado, desidioso"`; `abandona / abandonar: "dejar solo algo o a alguien alejándose de ello o d"`; `abierta / abierto: "dicho comúnmente del campo: desembarazado, llano, "`; `abre / abren: "descubrir o hacer patente lo que está cerrado u oc"`; `abre / abría: "descubrir o hacer patente lo que está cerrado u oc"`; `abre / abriendo: "descubrir o hacer patente lo que está cerrado u oc"`
- The level does not pick the words, only how many definitions they need: beginner: 30.2% are beginner-list words; intermediate: 31.7% are beginner-list words; advanced: 33.9% are beginner-list words.

### definitionMaster

| set | words | len min–median–max | freq rank median | in top-10k | not in freq list | with accent | with ñ | with hiatus |
|---|---:|---|---:|---:|---:|---:|---:|---:|
| beginner | 9010 | 1–7–19 | 5470 | 77.6% | 0.6% | 17.2% | 1.3% | 5.6% |
| intermediate | 7872 | 1–7–17 | 5226 | 79.6% | 0.3% | 17.1% | 1.3% | 5.7% |
| advanced | 6625 | 1–7–17 | 4917 | 81.1% | 0.2% | 16.9% | 1.4% | 5.8% |

| set | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13+ |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| beginner | 24 | 50 | 147 | 549 | 1075 | 1284 | 1493 | 1438 | 1053 | 784 | 484 | 298 | 331 |
| intermediate | 22 | 35 | 117 | 488 | 992 | 1191 | 1367 | 1289 | 899 | 660 | 382 | 225 | 205 |
| advanced | 13 | 29 | 101 | 435 | 895 | 1066 | 1197 | 1078 | 741 | 507 | 276 | 157 | 130 |

| set | a | b | c | d | e | f | g | h | i | j | k | l | m | n | ñ | o | p | q | r | s | t | u | v | w | x | y | z | other |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| beginner | 1013 | 196 | 1188 | 599 | 710 | 278 | 191 | 206 | 422 | 80 | 5 | 291 | 516 | 174 | 2 | 226 | 925 | 67 | 489 | 587 | 397 | 71 | 284 | 10 | 1 | 19 | 24 | 39 |
| intermediate | 867 | 169 | 1051 | 527 | 600 | 243 | 171 | 190 | 346 | 62 | 3 | 249 | 437 | 156 | 1 | 201 | 825 | 60 | 436 | 522 | 364 | 66 | 259 | 1 | 1 | 12 | 18 | 35 |
| advanced | 711 | 137 | 916 | 448 | 489 | 199 | 139 | 171 | 262 | 55 | 0 | 217 | 366 | 127 | 1 | 173 | 693 | 56 | 381 | 435 | 317 | 49 | 223 | 0 | 1 | 10 | 15 | 34 |

### spellingBee — words ≥4 letters with a usable clue for the level

| level | words ≥4 | with ≥1 usable clue among the level's definitions | share |
|---|---:|---:|---:|
| beginner | 8789 | 7882 | 89.7% |
| intermediate | 8789 | 8147 | 92.7% |
| advanced | 8789 | 8160 | 92.8% |

### spellingBee

| set | words | len min–median–max | freq rank median | in top-10k | not in freq list | with accent | with ñ | with hiatus |
|---|---:|---|---:|---:|---:|---:|---:|---:|
| beginner | 7882 | 4–8–19 | 5581 | 79.3% | 0.2% | 16.6% | 1.3% | 5.4% |
| intermediate | 8147 | 4–8–19 | 5556 | 79.4% | 0.2% | 16.5% | 1.3% | 5.3% |
| advanced | 8160 | 4–8–19 | 5552 | 79.4% | 0.2% | 16.5% | 1.3% | 5.3% |

| set | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13+ |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| beginner | 0 | 451 | 913 | 1141 | 1341 | 1277 | 965 | 723 | 457 | 290 | 324 |
| intermediate | 0 | 484 | 962 | 1185 | 1384 | 1327 | 984 | 738 | 467 | 292 | 324 |
| advanced | 0 | 486 | 966 | 1187 | 1387 | 1329 | 984 | 738 | 467 | 292 | 324 |

| set | a | b | c | d | e | f | g | h | i | j | k | l | m | n | ñ | o | p | q | r | s | t | u | v | w | x | y | z | other |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| beginner | 694 | 174 | 1095 | 537 | 649 | 249 | 164 | 184 | 381 | 68 | 2 | 249 | 466 | 160 | 1 | 201 | 859 | 56 | 449 | 526 | 356 | 56 | 232 | 6 | 0 | 14 | 22 | 32 |
| intermediate | 723 | 184 | 1135 | 560 | 666 | 258 | 169 | 187 | 394 | 70 | 4 | 255 | 482 | 163 | 1 | 206 | 877 | 61 | 460 | 540 | 366 | 59 | 251 | 6 | 0 | 15 | 22 | 33 |
| advanced | 725 | 185 | 1135 | 560 | 666 | 258 | 169 | 188 | 395 | 70 | 4 | 257 | 482 | 164 | 1 | 206 | 878 | 61 | 460 | 541 | 368 | 59 | 252 | 6 | 0 | 15 | 22 | 33 |

### crossWordPuzzle — definitions words (accents stripped), 6 random letters per batch, 3 batches

- words: 9010; accent-stripping collisions (two words become one key, one definition lost): 98; keys with non-letters: 0

| level | target words | trials | full layout | failed after 3 batches | median placed-word length | words ≥ 10 letters placed |
|---|---:|---:|---:|---:|---:|---:|
| beginner | 4 | 150 | 150 | 0 | 7 | 85 |
| intermediate | 6 | 150 | 150 | 0 | 7 | 124 |
| advanced | 8 | 150 | 150 | 0 | 7 | 147 |

| set | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13+ |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| pool (all levels, accents stripped) | 24 | 44 | 141 | 534 | 1055 | 1269 | 1474 | 1425 | 1052 | 781 | 484 | 298 | 331 |
| placed, beginner (150 trials) | 0 | 0 | 13 | 5 | 103 | 54 | 166 | 62 | 112 | 15 | 45 | 5 | 20 |
| placed, intermediate (150 trials) | 0 | 0 | 34 | 43 | 139 | 94 | 216 | 90 | 160 | 27 | 60 | 5 | 32 |
| placed, advanced (150 trials) | 0 | 0 | 58 | 86 | 195 | 111 | 284 | 122 | 197 | 28 | 73 | 15 | 31 |

| set | a | b | c | d | e | f | g | h | i | j | k | l | m | n | ñ | o | p | q | r | s | t | u | v | w | x | y | z | other |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| pool (all levels, accents stripped) | 1019 | 195 | 1177 | 595 | 710 | 277 | 187 | 204 | 421 | 80 | 5 | 284 | 510 | 174 | 2 | 227 | 912 | 64 | 488 | 581 | 390 | 76 | 281 | 10 | 1 | 18 | 24 | 0 |
| placed, beginner (150 trials) | 110 | 9 | 78 | 59 | 29 | 13 | 26 | 11 | 18 | 7 | 0 | 19 | 20 | 15 | 0 | 12 | 62 | 4 | 26 | 46 | 15 | 11 | 10 | 0 | 0 | 0 | 0 | 0 |
| placed, intermediate (150 trials) | 149 | 36 | 91 | 68 | 56 | 29 | 17 | 21 | 33 | 9 | 1 | 22 | 47 | 30 | 0 | 18 | 89 | 7 | 47 | 56 | 29 | 9 | 28 | 2 | 0 | 1 | 5 | 0 |
| placed, advanced (150 trials) | 195 | 25 | 133 | 111 | 89 | 37 | 46 | 49 | 50 | 9 | 0 | 37 | 48 | 21 | 0 | 32 | 86 | 5 | 62 | 59 | 45 | 11 | 45 | 1 | 0 | 3 | 1 | 0 |

### wordBuilder — 4 random consonants + 2 random vowels, words from all three levels

| metric (1000 random letter sets) | value |
|---|---:|
| findable words p10 / median / p90 | 40 / 100 / 326 |
| … of which beginner-list words, median | 9 |
| sets with 0 findable words | 0 (0.0%) |
| sets with 0 beginner-list words | 5 (0.5%) |
| dictionary words never findable (letters outside the set, e.g. ü) | 945 |

- The level is not used by wordBuilder (same letters rule and same dictionary on every level).

| set | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13+ |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| findable dictionary (all levels) | 0 | 223 | 1069 | 4800 | 14.379 | 30.643 | 54.135 | 79.317 | 97.878 | 105.784 | 97.060 | 76.624 | 114.711 |
| found in 1000 letter sets (union) | 0 | 223 | 1065 | 4144 | 6464 | 7024 | 5669 | 3701 | 1903 | 812 | 234 | 61 | 12 |

| set | a | b | c | d | e | f | g | h | i | j | k | l | m | n | ñ | o | p | q | r | s | t | u | v | w | x | y | z | other |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| findable dictionary (all levels) | 101.646 | 18.410 | 70.157 | 86.786 | 96.825 | 15.918 | 14.028 | 12.137 | 20.571 | 5899 | 383 | 13.341 | 30.231 | 5876 | 319 | 8150 | 44.775 | 2233 | 49.568 | 29.703 | 29.334 | 2514 | 11.436 | 115 | 210 | 899 | 4719 | 440 |
| found in 1000 letter sets (union) | 6712 | 1739 | 3038 | 1401 | 2140 | 819 | 799 | 727 | 357 | 588 | 92 | 1023 | 1370 | 519 | 55 | 570 | 2086 | 22 | 2434 | 1383 | 1778 | 234 | 693 | 36 | 40 | 165 | 347 | 145 |

# EN

## Level lists (public/words)

| level | entries | unique | duplicates | also in beginner | also in intermediate | also in advanced | not lowercase letters only | length ≤ 2 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| beginner | 2993 | 2993 | 0 | — | 73 | 73 | 0 | 84 |
| intermediate | 31.518 | 31.518 | 0 | 73 | — | 24.666 | 0 | 146 |
| advanced | 355.242 | 355.242 | 0 | 73 | 24.666 | — | 0 | 279 |


## Blocklisted words still present in the level lists

- beginner: 0
- intermediate: 0
- advanced: 0

## Difficulty profile of each level (raw list, before game filters)

| set | words | len min–median–max | freq rank median | in top-10k | not in freq list | with accent | with ñ |
|---|---:|---|---:|---:|---:|---:|---:|
| beginner | 2993 | 1–6–22 | 1511 | 97.6% | 2.4% | 0.0% | 0.0% |
| intermediate | 31.518 | 1–9–29 | 6487 | 21.7% | 78.3% | 0.0% | 0.0% |
| advanced | 355.242 | 2–9–31 | 69.291 | 0.0% | 75.2% | 0.0% | 0.0% |

| set | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13+ |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| beginner | 25 | 59 | 187 | 491 | 547 | 504 | 470 | 316 | 184 | 117 | 48 | 20 | 25 |
| intermediate | 1 | 145 | 288 | 802 | 1775 | 2982 | 3800 | 4438 | 4654 | 4052 | 3275 | 2176 | 3130 |
| advanced | 0 | 279 | 1664 | 6519 | 16.973 | 26.905 | 38.692 | 47.727 | 50.268 | 47.245 | 38.700 | 29.419 | 50.851 |

## Games

### spellTower + wordsRain — distractor generation (`processWord` → `processWordWithAccent`)

| level | in length window (≥4) | 1 option (no distractor) | 2 options | 3 options | eligible (≥2 options) |
|---|---:|---:|---:|---:|---:|
| beginner | 2722 | 1904 (69.9%) | 691 | 127 | 818 |
| intermediate | 31.084 | 18.797 (60.5%) | 9906 | 2381 | 12.287 |
| advanced | 353.299 | 207.985 (58.9%) | 115.076 | 30.238 | 145.314 |

### spellTower

| set | words | len min–median–max | freq rank median | in top-10k | not in freq list | with accent | with ñ |
|---|---:|---|---:|---:|---:|---:|---:|
| beginner | 2722 | 4–6–22 | 1569 | 97.4% | 2.6% | 0.0% | 0.0% |
| intermediate | 31.084 | 4–9–29 | 6477 | 20.7% | 79.3% | 0.0% | 0.0% |
| advanced | 353.299 | 4–9–31 | 70.575 | 0.0% | 75.6% | 0.0% | 0.0% |

| set | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13+ |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| beginner | 0 | 491 | 547 | 504 | 470 | 316 | 184 | 117 | 48 | 20 | 25 |
| intermediate | 0 | 802 | 1775 | 2982 | 3800 | 4438 | 4654 | 4052 | 3275 | 2176 | 3130 |
| advanced | 0 | 6519 | 16.973 | 26.905 | 38.692 | 47.727 | 50.268 | 47.245 | 38.700 | 29.419 | 50.851 |

| set | a | b | c | d | e | f | g | h | i | j | k | l | m | n | o | p | q | r | s | t | u | v | w | x | y | z | other |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| beginner | 192 | 131 | 260 | 148 | 132 | 154 | 68 | 90 | 83 | 29 | 26 | 115 | 145 | 51 | 60 | 205 | 11 | 146 | 316 | 163 | 35 | 33 | 112 | 0 | 14 | 3 | 0 |
| intermediate | 2861 | 1618 | 3218 | 1708 | 1254 | 1003 | 917 | 1111 | 1259 | 260 | 241 | 1083 | 1723 | 788 | 760 | 2655 | 161 | 1262 | 3071 | 1608 | 1264 | 575 | 465 | 63 | 54 | 102 | 0 |
| advanced | 23.554 | 17.245 | 30.385 | 18.257 | 13.410 | 11.157 | 10.977 | 13.578 | 12.579 | 2667 | 3857 | 9832 | 20.003 | 9601 | 11.315 | 34.275 | 1837 | 16.383 | 38.562 | 18.999 | 19.742 | 5507 | 6481 | 529 | 1136 | 1431 | 0 |

### wordFinder — game window vs prefetched pool (WORD_GROUP_FETCH_CONFIG 4–9)

| level | game window | eligible by game window | eligible by prefetch window (first ≥60 words after a level change) | of those, outside the game window |
|---|---|---:|---:|---:|
| beginner | 3–4 | 678 | 2512 | 2021 (80.5%) |
| intermediate | 4–6 | 5559 | 18.451 | 12.892 (69.9%) |
| advanced | 6–9 | 163.592 | 187.084 | 23.492 (12.6%) |

### wordFinder

| set | words | len min–median–max | freq rank median | in top-10k | not in freq list | with accent | with ñ |
|---|---:|---|---:|---:|---:|---:|---:|
| beginner | 678 | 3–4–4 | 942 | 99.3% | 0.7% | 0.0% | 0.0% |
| intermediate | 5559 | 4–6–6 | 6349 | 47.3% | 52.7% | 0.0% | 0.0% |
| advanced | 163.592 | 6–8–9 | 66.302 | 0.0% | 70.4% | 0.0% | 0.0% |

| set | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13+ |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| beginner | 187 | 491 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| intermediate | 0 | 802 | 1775 | 2982 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| advanced | 0 | 0 | 0 | 26.905 | 38.692 | 47.727 | 50.268 | 0 | 0 | 0 | 0 |

| set | a | b | c | d | e | f | g | h | i | j | k | l | m | n | o | p | q | r | s | t | u | v | w | x | y | z | other |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| beginner | 30 | 47 | 33 | 33 | 15 | 52 | 27 | 40 | 12 | 15 | 13 | 44 | 41 | 19 | 15 | 32 | 1 | 30 | 67 | 46 | 8 | 6 | 42 | 0 | 8 | 2 | 0 |
| intermediate | 456 | 387 | 424 | 314 | 193 | 246 | 208 | 184 | 127 | 102 | 94 | 252 | 314 | 159 | 136 | 377 | 24 | 283 | 559 | 312 | 83 | 151 | 119 | 5 | 24 | 26 | 0 |
| advanced | 10.541 | 10.232 | 13.880 | 8117 | 5917 | 6342 | 6065 | 5839 | 3922 | 1674 | 2295 | 5416 | 9130 | 3520 | 4980 | 12.959 | 877 | 8197 | 18.830 | 9400 | 6940 | 2773 | 4080 | 212 | 646 | 808 | 0 |

### letterMatcher — `buildLetterChallenge` eligibility (en)

| level | in window | eligible | share | prefetch pool (≥4) words outside window |
|---|---:|---:|---:|---:|
| beginner | 1542 | 300 | 19.5% | 43.4% |
| intermediate | 13.797 | 3980 | 28.8% | 55.6% |
| advanced | 329.807 | 141.488 | 42.9% | 6.6% |

### letterMatcher

| set | words | len min–median–max | freq rank median | in top-10k | not in freq list | with accent | with ñ |
|---|---:|---|---:|---:|---:|---:|---:|
| beginner | 300 | 4–5–6 | 1442 | 98.3% | 1.7% | 0.0% | 0.0% |
| intermediate | 3980 | 4–7–8 | 6440 | 34.1% | 65.9% | 0.0% | 0.0% |
| advanced | 141.488 | 6–10–31 | 71.798 | 0.0% | 78.4% | 0.0% | 0.0% |

| set | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13+ |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| beginner | 0 | 54 | 102 | 144 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| intermediate | 0 | 76 | 327 | 756 | 1199 | 1622 | 0 | 0 | 0 | 0 | 0 |
| advanced | 0 | 0 | 0 | 7098 | 13.392 | 18.535 | 20.940 | 20.986 | 18.303 | 14.564 | 27.670 |

| set | a | b | c | d | e | f | g | h | i | j | k | l | m | n | o | p | q | r | s | t | u | v | w | x | y | z | other |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| beginner | 25 | 26 | 19 | 15 | 19 | 20 | 9 | 13 | 6 | 1 | 5 | 15 | 16 | 7 | 4 | 11 | 6 | 7 | 36 | 19 | 4 | 5 | 11 | 0 | 1 | 0 | 0 |
| intermediate | 348 | 317 | 315 | 203 | 139 | 158 | 144 | 126 | 84 | 60 | 59 | 133 | 204 | 97 | 78 | 294 | 60 | 194 | 448 | 225 | 79 | 86 | 96 | 4 | 9 | 20 | 0 |
| advanced | 8621 | 7150 | 11.630 | 6984 | 4839 | 4602 | 4384 | 4896 | 5777 | 1020 | 1206 | 3360 | 6862 | 3812 | 4613 | 14.324 | 1664 | 6780 | 16.349 | 6855 | 9944 | 1826 | 2890 | 182 | 351 | 567 | 0 |

### Daily word (`loadDailyWordForLocale`: `getRandomWords(1)` from beginner, no length filter)

- beginner words: 2993; shorter than 4 letters (WORDS_DAILY's minLength, which the daily word never reads): 271 (9.1%) — e.g. `a`, `act`, `ad`, `add`, `age`, `ago`, `ah`, `aid`, `aim`, `air`, `al`, `all`
- beginner words with an entry in public/definitions/en: 2786 (93.1%)

## Definitions data (public/definitions)

| metric | value |
|---|---:|
| words with an entry | 45.984 |
| … not in any level list | 17 (0.0%) |
| … with no definitions | 0 |
| `level` field | (none): 1517, beginner: 2695, intermediate: 10.889, advanced: 30.883 |
| definitions | 208.750 |
| … empty text | 0 |
| … HTML/entity junk | 0 |
| … under 10 letters after `formatDefinition` (cut at first '.') | 6660 (3.2%) |
| … raw text contains the word | 20.620 (9.9%) |
| … formatted text (what definitionMaster shows) contains the word | 19.595 (9.4%) |

Per letter (words with an entry):

| a | b | c | d | e | f | g | h | i | j | k | l | m | n | o | p | q | r | s | t | u | v | w | x | y | z |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 5367 | 2501 | 4364 | 2597 | 1798 | 1851 | 1407 | 1555 | 1806 | 337 | 349 | 1373 | 2335 | 890 | 1068 | 3600 | 220 | 2088 | 4752 | 2190 | 1591 | 719 | 1002 | 22 | 120 | 82 |

- Short-after-format samples: `a: "Of." → "Of"`; `a: "All." → "All"`; `a: "All." → "All"`; `absent: "Leave." → "Leave"`; `abuse: "Disuse." → "Disuse"`; `accent: "Utterance." → "Utterance"`; `acre: "A field." → "A field"`; `acute: "Urgent." → "Urgent"`
- Shown definition contains the word: `a: "The name of the Latin script letter A/a"`; `a: "(crosswords) across"`; `a: "To do with position or direction; In, on, at, by, towards, onto"`; `a: "To do with separation; In, into"`; `a: "To do with time; Each, per, in, on, by"`; `a: "To do with role or capacity; In"`

### definitionMaster — words per letter with enough definitions (`minDefs` 1/2/3, max 10 per letter session)

| level | total eligible | letters with < 5 words (fewer than 5 options) | letters with < 10 words (short quiz) | sessions per letter before repeat (eligible/10) min–median |
|---|---:|---|---|---|
| beginner | 45.984 | — | — | 12.0–180.6 |
| intermediate | 33.462 | — | — | 10.0–133.3 |
| advanced | 24.441 | — | — | 7.6–93.6 |

- Words whose first formatted definition repeats another word's in the same letter file (identical answer options): 7119 — e.g. `accept / accepted: "to receive, especially with a consent, with favour"`; `account / accounts: "a registry of pecuniary transactions; a written or"`; `action / actions: "something done so as to accomplish a purpose"`; `activities / activity: "the state or quality of being active; activeness"`; `act / acts: "something done, a deed"`; `added / adding: "to join or unite (e"`
- The level does not pick the words, only how many definitions they need: beginner: 6.1% are beginner-list words; intermediate: 8.2% are beginner-list words; advanced: 10.7% are beginner-list words.

### definitionMaster

| set | words | len min–median–max | freq rank median | in top-10k | not in freq list | with accent | with ñ |
|---|---:|---|---:|---:|---:|---:|---:|
| beginner | 45.984 | 1–8–29 | 30.932 | 19.4% | 15.4% | 0.0% | 0.0% |
| intermediate | 33.462 | 1–8–20 | 24.121 | 25.2% | 9.5% | 0.0% | 0.0% |
| advanced | 24.441 | 1–7–18 | 18.666 | 31.9% | 5.6% | 0.0% | 0.0% |

| set | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13+ |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| beginner | 23 | 245 | 838 | 2528 | 3984 | 5775 | 6782 | 7009 | 6399 | 4907 | 3349 | 2044 | 2101 |
| intermediate | 22 | 183 | 737 | 2247 | 3406 | 4732 | 5300 | 5028 | 4457 | 3175 | 2041 | 1124 | 1010 |
| advanced | 20 | 139 | 649 | 2007 | 2914 | 3865 | 4065 | 3601 | 2951 | 1959 | 1206 | 605 | 460 |

| set | a | b | c | d | e | f | g | h | i | j | k | l | m | n | o | p | q | r | s | t | u | v | w | x | y | z | other |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| beginner | 5367 | 2501 | 4364 | 2597 | 1798 | 1851 | 1407 | 1555 | 1806 | 337 | 349 | 1373 | 2335 | 890 | 1068 | 3600 | 220 | 2088 | 4752 | 2190 | 1591 | 719 | 1002 | 22 | 120 | 82 | 0 |
| intermediate | 3481 | 1939 | 3265 | 2017 | 1333 | 1445 | 991 | 1098 | 1268 | 256 | 223 | 1013 | 1640 | 583 | 735 | 2651 | 180 | 1680 | 3689 | 1656 | 836 | 525 | 800 | 11 | 100 | 47 | 0 |
| advanced | 2314 | 1467 | 2451 | 1539 | 936 | 1121 | 744 | 806 | 868 | 204 | 163 | 758 | 1115 | 409 | 516 | 1931 | 135 | 1288 | 2817 | 1260 | 469 | 376 | 643 | 6 | 76 | 29 | 0 |

### spellingBee — words ≥4 letters with a usable clue for the level

| level | words ≥4 | with ≥1 usable clue among the level's definitions | share |
|---|---:|---:|---:|
| beginner | 44.878 | 41.456 | 92.4% |
| intermediate | 44.878 | 43.788 | 97.6% |
| advanced | 44.878 | 43.924 | 97.9% |

### spellingBee

| set | words | len min–median–max | freq rank median | in top-10k | not in freq list | with accent | with ñ |
|---|---:|---|---:|---:|---:|---:|---:|
| beginner | 41.456 | 4–8–29 | 32.427 | 18.3% | 15.9% | 0.0% | 0.0% |
| intermediate | 43.788 | 4–8–29 | 31.760 | 18.7% | 15.5% | 0.0% | 0.0% |
| advanced | 43.924 | 4–8–29 | 31.607 | 18.8% | 15.4% | 0.0% | 0.0% |

| set | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13+ |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| beginner | 0 | 2086 | 3475 | 5232 | 6247 | 6512 | 6036 | 4656 | 3209 | 1971 | 2032 |
| intermediate | 0 | 2407 | 3845 | 5632 | 6595 | 6828 | 6279 | 4819 | 3298 | 2013 | 2072 |
| advanced | 0 | 2455 | 3870 | 5652 | 6619 | 6837 | 6282 | 4821 | 3301 | 2014 | 2073 |

| set | a | b | c | d | e | f | g | h | i | j | k | l | m | n | o | p | q | r | s | t | u | v | w | x | y | z | other |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| beginner | 4933 | 2281 | 3981 | 2340 | 1593 | 1689 | 1245 | 1393 | 1661 | 286 | 300 | 1207 | 2077 | 769 | 942 | 3254 | 199 | 1899 | 4284 | 1965 | 1461 | 637 | 895 | 17 | 84 | 64 | 0 |
| intermediate | 5151 | 2397 | 4202 | 2469 | 1705 | 1784 | 1332 | 1460 | 1745 | 304 | 316 | 1277 | 2210 | 824 | 994 | 3433 | 214 | 1999 | 4579 | 2070 | 1520 | 672 | 951 | 18 | 93 | 69 | 0 |
| advanced | 5156 | 2401 | 4212 | 2484 | 1710 | 1790 | 1336 | 1469 | 1751 | 304 | 316 | 1280 | 2222 | 824 | 998 | 3443 | 214 | 2013 | 4597 | 2078 | 1520 | 673 | 953 | 18 | 93 | 69 | 0 |

### crossWordPuzzle — definitions words (accents stripped), 6 random letters per batch, 3 batches

- words: 45.984; accent-stripping collisions (two words become one key, one definition lost): 0; keys with non-letters: 0

| level | target words | trials | full layout | failed after 3 batches | median placed-word length | words ≥ 10 letters placed |
|---|---:|---:|---:|---:|---:|---:|
| beginner | 4 | 150 | 150 | 0 | 8 | 99 |
| intermediate | 6 | 150 | 150 | 0 | 8 | 165 |
| advanced | 8 | 150 | 150 | 0 | 7 | 209 |

| set | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13+ |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| pool (all levels, accents stripped) | 23 | 245 | 838 | 2528 | 3984 | 5775 | 6782 | 7009 | 6399 | 4907 | 3349 | 2044 | 2101 |
| placed, beginner (150 trials) | 0 | 0 | 11 | 3 | 78 | 62 | 143 | 55 | 149 | 11 | 54 | 5 | 29 |
| placed, intermediate (150 trials) | 0 | 0 | 22 | 41 | 107 | 88 | 173 | 101 | 203 | 37 | 74 | 14 | 40 |
| placed, advanced (150 trials) | 0 | 0 | 57 | 68 | 145 | 114 | 256 | 128 | 223 | 57 | 87 | 26 | 39 |

| set | a | b | c | d | e | f | g | h | i | j | k | l | m | n | o | p | q | r | s | t | u | v | w | x | y | z | other |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| pool (all levels, accents stripped) | 5367 | 2501 | 4364 | 2597 | 1798 | 1851 | 1407 | 1555 | 1806 | 337 | 349 | 1373 | 2335 | 890 | 1068 | 3600 | 220 | 2088 | 4752 | 2190 | 1591 | 719 | 1002 | 22 | 120 | 82 | 0 |
| placed, beginner (150 trials) | 74 | 37 | 63 | 35 | 25 | 46 | 27 | 18 | 21 | 8 | 6 | 10 | 24 | 9 | 17 | 53 | 3 | 27 | 39 | 23 | 13 | 6 | 12 | 0 | 3 | 1 | 0 |
| placed, intermediate (150 trials) | 129 | 48 | 63 | 53 | 29 | 47 | 38 | 49 | 18 | 8 | 8 | 28 | 43 | 20 | 31 | 79 | 7 | 47 | 50 | 51 | 20 | 9 | 23 | 0 | 2 | 0 | 0 |
| placed, advanced (150 trials) | 205 | 86 | 104 | 73 | 53 | 40 | 36 | 79 | 32 | 9 | 6 | 41 | 35 | 32 | 23 | 91 | 7 | 43 | 86 | 57 | 25 | 10 | 23 | 0 | 1 | 3 | 0 |

### wordBuilder — 4 random consonants + 2 random vowels, words from all three levels

| metric (1000 random letter sets) | value |
|---|---:|
| findable words p10 / median / p90 | 74 / 144 / 292 |
| … of which beginner-list words, median | 11 |
| sets with 0 findable words | 0 (0.0%) |
| sets with 0 beginner-list words | 0 (0.0%) |
| dictionary words never findable (letters outside the set, e.g. ü) | 0 |

- The level is not used by wordBuilder (same letters rule and same dictionary on every level).

| set | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13+ |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| findable dictionary (all levels) | 0 | 483 | 2133 | 7618 | 18.440 | 28.489 | 40.237 | 48.942 | 51.191 | 47.832 | 39.042 | 29.602 | 50.979 |
| found in 1000 letter sets (union) | 0 | 483 | 2108 | 6217 | 7542 | 5070 | 2444 | 1230 | 374 | 122 | 40 | 16 | 2 |

| set | a | b | c | d | e | f | g | h | i | j | k | l | m | n | o | p | q | r | s | t | u | v | w | x | y | z | other |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| findable dictionary (all levels) | 24.375 | 17.835 | 31.451 | 18.918 | 13.939 | 11.670 | 11.343 | 13.983 | 13.022 | 2834 | 4018 | 10.277 | 20.588 | 9896 | 11.638 | 35.128 | 1895 | 17.075 | 39.731 | 19.637 | 19.934 | 5709 | 6840 | 547 | 1230 | 1475 | 0 |
| found in 1000 letter sets (union) | 2156 | 1888 | 1614 | 1321 | 922 | 935 | 1056 | 1027 | 576 | 412 | 829 | 952 | 1233 | 782 | 643 | 1390 | 63 | 1476 | 2612 | 1578 | 386 | 430 | 771 | 62 | 337 | 197 | 0 |

