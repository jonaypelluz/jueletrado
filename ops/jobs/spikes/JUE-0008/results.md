# Words per level per game — summary

`eligible` = distinct words the game can show at that level after every filter in the code. `shown` = words played per session. `sessions until first repeat` = median over 300 simulated players of the session in which a word already seen comes back (uniform independent refills, as `DBService.getRandomWords` does). It ignores the code bugs that repeat earlier (see the report).

| game | locale | level | eligible | shown/session | sessions until first repeat | note |
|---|---|---|---:|---:|---:|---|
| spellTower | es | beginner | 2771 | 15 | 5 | today: single-option words included |
| spellTower | es | intermediate | 73.212 | 15 | 23 | today: single-option words included |
| spellTower | es | advanced | 666.925 | 15 | 65 | today: single-option words included |
| spellTower (≥2 opciones, tras job 3) | es | beginner | 2462 | 15 | 5 | only words with ≥1 distractor |
| spellTower (≥2 opciones, tras job 3) | es | intermediate | 72.089 | 15 | 23 | only words with ≥1 distractor |
| spellTower (≥2 opciones, tras job 3) | es | advanced | 632.716 | 15 | 62 | only words with ≥1 distractor |
| wordsRain | es | beginner | 2771 | 150 | 1 | cycles the same 150 words for 1 h; single-option words included |
| wordsRain | es | intermediate | 73.212 | 150 | 1 | cycles the same 150 words for 1 h; single-option words included |
| wordsRain | es | advanced | 666.925 | 150 | 1 | cycles the same 150 words for 1 h; single-option words included |
| wordFinder | es | beginner | 401 | 10 | 3 |  |
| wordFinder | es | intermediate | 9661 | 10 | 13 |  |
| wordFinder | es | advanced | 256.749 | 10 | 64 |  |
| accentFixer | es | beginner | 1224 | 10 | 5 |  |
| accentFixer | es | intermediate | 30.462 | 10 | 22 |  |
| accentFixer | es | advanced | 557.706 | 10 | 95 |  |
| syllableSplitter | es | beginner | 1294 | 10 | 5 |  |
| syllableSplitter | es | intermediate | 31.045 | 10 | 22 |  |
| syllableSplitter | es | advanced | 534.531 | 10 | 89 |  |
| letterMatcher | es | beginner | 407 | 10 | 3 |  |
| letterMatcher | es | intermediate | 14.452 | 10 | 15 |  |
| letterMatcher | es | advanced | 354.054 | 10 | 66 |  |
| dailyWord | es | beginner (always) | 2934 | 1 | 61 | level ignored; 1 word/day |
| definitionMaster | es | beginner | 8982 | 10 | 12 |  |
| definitionMaster | es | intermediate | 7846 | 10 | 12 |  |
| definitionMaster | es | advanced | 6602 | 10 | 11 |  |
| spellingBee | es | beginner | 8347 | 5 | 23 |  |
| spellingBee | es | intermediate | 8631 | 5 | 24 |  |
| spellingBee | es | advanced | 8646 | 5 | 24 |  |
| wordBuilder | es | all (level ignored) | 87 | — | — | median words findable per letter set |
| spellTower | en | beginner | 2644 | 15 | 5 | today: single-option words included |
| spellTower | en | intermediate | 30.982 | 15 | 14 | today: single-option words included |
| spellTower | en | advanced | 353.066 | 15 | 53 | today: single-option words included |
| spellTower (≥2 opciones, tras job 3) | en | beginner | 797 | 15 | 3 | only words with ≥1 distractor |
| spellTower (≥2 opciones, tras job 3) | en | intermediate | 12.253 | 15 | 9 | only words with ≥1 distractor |
| spellTower (≥2 opciones, tras job 3) | en | advanced | 145.249 | 15 | 31 | only words with ≥1 distractor |
| wordsRain | en | beginner | 2644 | 150 | 1 | cycles the same 150 words for 1 h; single-option words included |
| wordsRain | en | intermediate | 30.982 | 150 | 1 | cycles the same 150 words for 1 h; single-option words included |
| wordsRain | en | advanced | 353.066 | 150 | 1 | cycles the same 150 words for 1 h; single-option words included |
| wordFinder | en | beginner | 662 | 10 | 4 |  |
| wordFinder | en | intermediate | 5524 | 10 | 10 |  |
| wordFinder | en | advanced | 163.499 | 10 | 45 |  |
| letterMatcher | en | beginner | 293 | 10 | 3 |  |
| letterMatcher | en | intermediate | 3965 | 10 | 9 |  |
| letterMatcher | en | advanced | 141.440 | 10 | 42 |  |
| dailyWord | en | beginner (always) | 2873 | 1 | 63 | level ignored; 1 word/day |
| definitionMaster | en | beginner | 45.766 | 10 | 29 |  |
| definitionMaster | en | intermediate | 33.278 | 10 | 23 |  |
| definitionMaster | en | advanced | 24.300 | 10 | 18 |  |
| spellingBee | en | beginner | 41.412 | 5 | 49 |  |
| spellingBee | en | intermediate | 43.743 | 5 | 51 |  |
| spellingBee | en | advanced | 43.878 | 5 | 52 |  |
| wordBuilder | en | all (level ignored) | 126 | — | — | median words findable per letter set |

# ES

## Level lists (public/words)

| level | entries | unique | duplicates | also in beginner | also in intermediate | also in advanced | not lowercase letters only | length ≤ 2 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| beginner | 2934 | 2934 | 0 | — | 39 | 49 | 0 | 55 |
| intermediate | 73.350 | 73.350 | 0 | 39 | — | 66.826 | 0 | 38 |
| advanced | 667.837 | 667.837 | 0 | 49 | 66.826 | — | 0 | 85 |


## Blocklisted words still present in the level lists

- beginner: 0
- intermediate: 0
- advanced: 0

## Difficulty profile of each level (raw list, before game filters)

| set | words | len min–median–max | freq rank median | in top-10k | not in freq list | with accent | with ñ | with hiatus |
|---|---:|---|---:|---:|---:|---:|---:|---:|
| beginner | 2934 | 1–6–15 | 1497 | 98.2% | 1.8% | 15.8% | 1.4% | 5.2% |
| intermediate | 73.350 | 2–9–25 | 6421 | 8.7% | 91.3% | 19.1% | 2.9% | 10.1% |
| advanced | 667.837 | 2–10–23 | 78.550 | 0.0% | 86.6% | 36.1% | 2.2% | 22.7% |

| set | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13+ |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| beginner | 6 | 49 | 108 | 293 | 526 | 505 | 501 | 365 | 241 | 158 | 87 | 36 | 59 |
| intermediate | 0 | 38 | 100 | 693 | 2744 | 6224 | 9896 | 12.241 | 12.432 | 10.380 | 7538 | 4759 | 6305 |
| advanced | 0 | 85 | 827 | 4102 | 13.117 | 29.207 | 52.596 | 77.970 | 96.976 | 105.173 | 96.719 | 76.480 | 114.585 |

## Games

### spellTower + wordsRain — distractor generation (`processWord` → `processWordWithAccent`)

| level | in length window (≥4) | 1 option (no distractor) | 2 options | 3 options | eligible (≥2 options) |
|---|---:|---:|---:|---:|---:|
| beginner | 2771 | 309 (11.2%) | 1510 | 952 | 2462 |
| intermediate | 73.212 | 1123 (1.5%) | 34.596 | 37.493 | 72.089 |
| advanced | 666.925 | 34.209 (5.1%) | 332.452 | 300.264 | 632.716 |

### spellTower

| set | words | len min–median–max | freq rank median | in top-10k | not in freq list | with accent | with ñ | with hiatus |
|---|---:|---|---:|---:|---:|---:|---:|---:|
| beginner | 2771 | 4–7–15 | 1553 | 98.1% | 1.9% | 16.1% | 1.5% | 5.1% |
| intermediate | 73.212 | 4–9–25 | 6428 | 8.5% | 91.5% | 19.1% | 2.9% | 10.1% |
| advanced | 666.925 | 4–10–23 | 79.025 | 0.0% | 86.7% | 36.1% | 2.2% | 22.8% |

| set | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13+ |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| beginner | 0 | 293 | 526 | 505 | 501 | 365 | 241 | 158 | 87 | 36 | 59 |
| intermediate | 0 | 693 | 2744 | 6224 | 9896 | 12.241 | 12.432 | 10.380 | 7538 | 4759 | 6305 |
| advanced | 0 | 4102 | 13.117 | 29.207 | 52.596 | 77.970 | 96.976 | 105.173 | 96.719 | 76.480 | 114.585 |

| set | a | b | c | d | e | f | g | h | i | j | k | l | m | n | ñ | o | p | q | r | s | t | u | v | w | x | y | z | other |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| beginner | 209 | 60 | 354 | 187 | 227 | 91 | 53 | 85 | 104 | 35 | 1 | 97 | 172 | 70 | 0 | 60 | 349 | 29 | 122 | 166 | 137 | 26 | 103 | 5 | 0 | 2 | 4 | 23 |
| intermediate | 9826 | 3092 | 10.344 | 4962 | 6092 | 2315 | 2471 | 1867 | 2126 | 802 | 72 | 1964 | 4263 | 1082 | 88 | 1111 | 5987 | 473 | 3385 | 3770 | 3967 | 386 | 1582 | 24 | 53 | 204 | 717 | 187 |
| advanced | 100.999 | 18.108 | 68.885 | 86.113 | 96.183 | 15.575 | 13.835 | 11.852 | 20.147 | 5761 | 358 | 13.080 | 29.699 | 5646 | 312 | 7864 | 43.749 | 2150 | 49.039 | 29.076 | 28.845 | 2377 | 11.055 | 93 | 171 | 881 | 4698 | 374 |

### wordFinder — game window vs prefetched pool (WORD_GROUP_FETCH_CONFIG 4–9)

| level | game window | eligible by game window | eligible by prefetch window (first ≥60 words after a level change) | of those, outside the game window |
|---|---|---:|---:|---:|
| beginner | 3–4 | 401 | 2431 | 2138 (87.9%) |
| intermediate | 4–6 | 9661 | 44.230 | 34.569 (78.2%) |
| advanced | 6–9 | 256.749 | 273.968 | 17.219 (6.3%) |

### wordFinder

| set | words | len min–median–max | freq rank median | in top-10k | not in freq list | with accent | with ñ | with hiatus |
|---|---:|---|---:|---:|---:|---:|---:|---:|
| beginner | 401 | 3–4–4 | 866 | 99.3% | 0.7% | 13.0% | 2.0% | 9.2% |
| intermediate | 9661 | 4–6–6 | 6091 | 20.6% | 79.4% | 21.7% | 3.7% | 8.9% |
| advanced | 256.749 | 6–8–9 | 75.713 | 0.0% | 80.5% | 31.3% | 2.7% | 18.5% |

| set | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13+ |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| beginner | 108 | 293 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| intermediate | 0 | 693 | 2744 | 6224 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| advanced | 0 | 0 | 0 | 29.207 | 52.596 | 77.970 | 96.976 | 0 | 0 | 0 | 0 |

| set | a | b | c | d | e | f | g | h | i | j | k | l | m | n | ñ | o | p | q | r | s | t | u | v | w | x | y | z | other |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| beginner | 31 | 11 | 36 | 38 | 17 | 8 | 9 | 17 | 7 | 6 | 0 | 17 | 26 | 5 | 0 | 12 | 43 | 2 | 22 | 32 | 23 | 8 | 23 | 1 | 0 | 2 | 1 | 4 |
| intermediate | 1040 | 589 | 1185 | 281 | 284 | 411 | 399 | 289 | 120 | 251 | 16 | 435 | 582 | 202 | 56 | 229 | 776 | 64 | 540 | 480 | 645 | 106 | 273 | 5 | 8 | 93 | 153 | 149 |
| advanced | 44.148 | 9220 | 26.213 | 17.236 | 29.634 | 7645 | 6982 | 5589 | 6087 | 3131 | 185 | 7130 | 13.305 | 2732 | 166 | 4342 | 17.474 | 919 | 20.425 | 11.450 | 12.704 | 1248 | 5479 | 48 | 44 | 553 | 2449 | 211 |

### accentFixer — `buildChallenge` eligibility

| level | in window | eligible | with accent | without accent | accented share | prefetch pool (≥4) words outside window |
|---|---:|---:|---:|---:|---:|---:|
| beginner | 1324 | 1224 | 107 | 1117 | 8.7% | 52.2% |
| intermediate | 31.105 | 30.462 | 5175 | 25.287 | 17.0% | 57.5% |
| advanced | 649.706 | 557.706 | 142.969 | 414.737 | 25.6% | 2.6% |

### accentFixer

| set | words | len min–median–max | freq rank median | in top-10k | not in freq list | with accent | with ñ | with hiatus |
|---|---:|---|---:|---:|---:|---:|---:|---:|
| beginner | 1224 | 4–5–6 | 1279 | 99.0% | 1.0% | 8.7% | 1.8% | 5.6% |
| intermediate | 30.462 | 5–7–8 | 6312 | 11.7% | 88.3% | 17.0% | 3.6% | 9.7% |
| advanced | 557.706 | 6–10–23 | 79.393 | 0.0% | 86.3% | 25.6% | 2.2% | 23.7% |

| set | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13+ |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| beginner | 0 | 253 | 496 | 475 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| intermediate | 0 | 0 | 2590 | 6027 | 9727 | 12.118 | 0 | 0 | 0 | 0 | 0 |
| advanced | 0 | 0 | 0 | 22.950 | 42.631 | 64.823 | 82.532 | 90.846 | 84.478 | 67.333 | 102.113 |

| set | a | b | c | d | e | f | g | h | i | j | k | l | m | n | ñ | o | p | q | r | s | t | u | v | w | x | y | z | other |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| beginner | 93 | 42 | 134 | 80 | 56 | 47 | 32 | 48 | 17 | 24 | 0 | 59 | 97 | 33 | 0 | 23 | 132 | 14 | 44 | 90 | 67 | 12 | 66 | 1 | 0 | 0 | 2 | 11 |
| intermediate | 3930 | 1654 | 4255 | 1191 | 1764 | 1122 | 1237 | 794 | 500 | 543 | 32 | 1096 | 1891 | 512 | 64 | 562 | 2431 | 168 | 1643 | 1486 | 1877 | 203 | 762 | 10 | 25 | 158 | 409 | 143 |
| advanced | 83.717 | 14.911 | 58.287 | 72.292 | 80.689 | 12.903 | 11.474 | 9829 | 17.474 | 4556 | 254 | 10.605 | 24.770 | 4588 | 216 | 6415 | 36.994 | 1821 | 41.425 | 24.686 | 23.917 | 1893 | 9131 | 64 | 142 | 639 | 3829 | 185 |

### syllableSplitter — `isEligible`

| level | window | in window | eligible | share of prefetch pool (≥4) that passes `isEligible` with the level window |
|---|---|---:|---:|---:|
| beginner | 4–6 | 1324 | 1294 | 46.7% |
| intermediate | 5–8 | 31.105 | 31.045 | 42.4% |
| advanced | 6–12 | 535.121 | 534.531 | 80.1% |

| level | 2 syll. | 3 | 4 | 5 | 6+ |
|---|---:|---:|---:|---:|---:|
| beginner | 1028 | 264 | 2 | 0 | 0 |
| intermediate | 5061 | 18.400 | 7463 | 121 | 0 |
| advanced | 14.078 | 126.327 | 232.377 | 142.859 | 18.890 |

### syllableSplitter

| set | words | len min–median–max | freq rank median | in top-10k | not in freq list | with accent | with ñ | with hiatus |
|---|---:|---|---:|---:|---:|---:|---:|---:|
| beginner | 1294 | 4–5–6 | 1290 | 99.0% | 1.0% | 14.8% | 1.7% | 6.4% |
| intermediate | 31.045 | 5–7–8 | 6311 | 12.1% | 87.9% | 18.7% | 3.5% | 9.8% |
| advanced | 534.531 | 6–10–12 | 79.215 | 0.0% | 86.0% | 33.6% | 2.3% | 21.8% |

| set | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13+ |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| beginner | 0 | 265 | 524 | 505 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| intermediate | 0 | 0 | 2716 | 6217 | 9886 | 12.226 | 0 | 0 | 0 | 0 | 0 |
| advanced | 0 | 0 | 0 | 29.109 | 52.512 | 77.891 | 96.879 | 105.057 | 96.652 | 76.431 | 0 |

| set | a | b | c | d | e | f | g | h | i | j | k | l | m | n | ñ | o | p | q | r | s | t | u | v | w | x | y | z | other |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| beginner | 97 | 41 | 140 | 81 | 63 | 49 | 36 | 52 | 19 | 24 | 0 | 66 | 102 | 34 | 0 | 24 | 137 | 15 | 45 | 96 | 71 | 12 | 69 | 1 | 0 | 1 | 2 | 17 |
| intermediate | 3965 | 1671 | 4358 | 1211 | 1793 | 1144 | 1261 | 803 | 511 | 549 | 33 | 1123 | 1924 | 520 | 64 | 575 | 2490 | 176 | 1676 | 1510 | 1914 | 204 | 783 | 10 | 27 | 158 | 416 | 176 |
| advanced | 87.325 | 15.597 | 54.484 | 56.351 | 76.411 | 13.352 | 11.918 | 9854 | 14.922 | 4952 | 234 | 11.172 | 24.662 | 4573 | 255 | 6819 | 35.482 | 1768 | 41.417 | 22.746 | 23.790 | 1924 | 9374 | 58 | 113 | 680 | 4078 | 220 |

### letterMatcher — `buildLetterChallenge` eligibility (es)

| level | in window | eligible | share | prefetch pool (≥4) words outside window |
|---|---:|---:|---:|---:|
| beginner | 1324 | 407 | 30.7% | 52.2% |
| intermediate | 31.798 | 14.452 | 45.4% | 56.6% |
| advanced | 649.706 | 354.054 | 54.5% | 2.6% |

### letterMatcher

| set | words | len min–median–max | freq rank median | in top-10k | not in freq list | with accent | with ñ | with hiatus |
|---|---:|---|---:|---:|---:|---:|---:|---:|
| beginner | 407 | 4–5–6 | 1344 | 98.8% | 1.2% | 15.0% | 0.2% | 4.4% |
| intermediate | 14.452 | 4–7–8 | 6369 | 11.0% | 89.0% | 17.4% | 2.5% | 9.3% |
| advanced | 354.054 | 6–11–23 | 82.252 | 0.0% | 88.9% | 34.8% | 1.2% | 22.1% |

| set | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13+ |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| beginner | 0 | 60 | 167 | 180 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| intermediate | 0 | 186 | 992 | 2516 | 4685 | 6073 | 0 | 0 | 0 | 0 | 0 |
| advanced | 0 | 0 | 0 | 11.337 | 22.926 | 37.043 | 49.199 | 56.382 | 55.308 | 45.865 | 75.994 |

| set | a | b | c | d | e | f | g | h | i | j | k | l | m | n | ñ | o | p | q | r | s | t | u | v | w | x | y | z | other |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| beginner | 31 | 40 | 35 | 24 | 19 | 7 | 11 | 39 | 4 | 8 | 0 | 30 | 11 | 15 | 0 | 9 | 14 | 2 | 7 | 24 | 9 | 0 | 61 | 1 | 0 | 2 | 1 | 3 |
| intermediate | 1885 | 1666 | 2223 | 427 | 613 | 314 | 603 | 756 | 132 | 298 | 16 | 462 | 605 | 223 | 17 | 244 | 702 | 35 | 667 | 535 | 598 | 80 | 752 | 4 | 2 | 166 | 381 | 46 |
| advanced | 56.945 | 16.877 | 38.644 | 43.796 | 50.393 | 6213 | 7555 | 10.866 | 9713 | 2954 | 82 | 6135 | 12.198 | 2676 | 83 | 4044 | 18.317 | 854 | 22.817 | 15.835 | 10.868 | 940 | 10.227 | 34 | 19 | 670 | 4237 | 62 |

### Daily word (`loadDailyWordForLocale`: `getRandomWords(1)` from beginner, no length filter)

- beginner words: 2934; shorter than 4 letters (WORDS_DAILY's minLength, which the daily word never reads): 163 (5.6%) — e.g. `a`, `acá`, `ah`, `ahí`, `al`, `ama`, `amo`, `ana`, `año`, `as`, `así`, `aun`
- beginner words with an entry in public/definitions/es: 2678 (91.3%)

## Definitions data (public/definitions)

| metric | value |
|---|---:|
| words with an entry | 8982 |
| … not in any level list | 0 (0.0%) |
| … with no definitions | 0 |
| `level` field | (none): 8419, beginner: 315, intermediate: 5, advanced: 243 |
| definitions | 60.966 |
| … empty text | 0 |
| … HTML/entity junk | 0 |
| … under 10 letters after `formatDefinition` (cut at first '.') | 1399 (2.3%) |
| … raw text contains the word | 7585 (12.4%) |
| … formatted text (what definitionMaster shows) contains the word | 2775 (4.6%) |
| … ES entry with an English part-of-speech label | 0 (0.0%) |

Per letter (words with an entry):

| a | b | c | d | e | f | g | h | i | j | k | l | m | n | o | p | q | r | s | t | u | v | w | x | y | z |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1034 | 195 | 1185 | 598 | 717 | 277 | 190 | 205 | 424 | 78 | 5 | 290 | 514 | 175 | 227 | 921 | 66 | 488 | 584 | 396 | 77 | 283 | 10 | 0 | 19 | 24 |

- Short-after-format samples: `abre: "hacer. Abrir un agujero, un ojal, una ranura, un camino, un " → "Hacer"`; `abren: "hacer. Abrir un agujero, un ojal, una ranura, un camino, un " → "Hacer"`; `abría: "hacer. Abrir un agujero, un ojal, una ranura, un camino, un " → "Hacer"`; `abriendo: "hacer. Abrir un agujero, un ojal, una ranura, un camino, un " → "Hacer"`; `abrieron: "hacer. Abrir un agujero, un ojal, una ranura, un camino, un " → "Hacer"`; `abrió: "hacer. Abrir un agujero, un ojal, una ranura, un camino, un " → "Hacer"`; `abrir: "hacer. Abrir un agujero, un ojal, una ranura, un camino, un " → "Hacer"`; `abrirse: "hacer. Abrir un agujero, un ojal, una ranura, un camino, un " → "Hacer"`
- Shown definition contains the word: `abanico: "Cosa en forma de abanico desplegado"`; `abanico: "En algunas armaduras antiguas, parte lateral del codal o de la rodillera, en for"`; `abanico: "Señal ferroviaria en forma de abanico para indicar al maquinista dónde se bifurc"`; `abstracto: "Dicho de una obra de arte o de un artista: Que sigue el arte abstracto"`; `abundan: "Dotar en abundancia"`; `académica: "Individuo perteneciente a una corporación académica"`

### definitionMaster — words per letter with enough definitions (`minDefs` 1/2/3, max 10 per letter session)

| level | total eligible | letters with < 5 words (fewer than 5 options) | letters with < 10 words (short quiz) | sessions per letter before repeat (eligible/10) min–median |
|---|---:|---|---|---|
| beginner | 8982 | — | k | 0.5–27.7 |
| intermediate | 7846 | k w | k w | 0.1–24.2 |
| advanced | 6602 | k w | k w | 1.0–21.6 |

- Words whose first formatted definition repeats another word's in the same letter file (identical answer options): 3479 — e.g. `abandonada / abandonado: "descuidado, desidioso"`; `abandona / abandonar: "dejar solo algo o a alguien alejándose de ello o d"`; `abierta / abierto: "dicho comúnmente del campo: desembarazado, llano, "`; `abre / abren: "descubrir o hacer patente lo que está cerrado u oc"`; `abre / abría: "descubrir o hacer patente lo que está cerrado u oc"`; `abre / abriendo: "descubrir o hacer patente lo que está cerrado u oc"`
- The level does not pick the words, only how many definitions they need: beginner: 30.0% are beginner-list words; intermediate: 31.5% are beginner-list words; advanced: 33.8% are beginner-list words.

### definitionMaster

| set | words | len min–median–max | freq rank median | in top-10k | not in freq list | with accent | with ñ | with hiatus |
|---|---:|---|---:|---:|---:|---:|---:|---:|
| beginner | 8982 | 1–7–19 | 5487 | 77.5% | 0.6% | 17.2% | 1.3% | 5.6% |
| intermediate | 7846 | 1–7–17 | 5240 | 79.6% | 0.3% | 17.2% | 1.4% | 5.7% |
| advanced | 6602 | 1–7–17 | 4928 | 81.1% | 0.2% | 16.9% | 1.5% | 5.8% |

| set | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13+ |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| beginner | 6 | 49 | 147 | 544 | 1073 | 1282 | 1493 | 1438 | 1053 | 784 | 484 | 298 | 331 |
| intermediate | 6 | 34 | 117 | 483 | 990 | 1189 | 1367 | 1289 | 899 | 660 | 382 | 225 | 205 |
| advanced | 5 | 28 | 101 | 430 | 893 | 1063 | 1196 | 1077 | 739 | 507 | 276 | 157 | 130 |

| set | a | b | c | d | e | f | g | h | i | j | k | l | m | n | ñ | o | p | q | r | s | t | u | v | w | x | y | z | other |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| beginner | 1012 | 195 | 1185 | 598 | 710 | 277 | 190 | 205 | 421 | 78 | 5 | 290 | 514 | 173 | 2 | 226 | 921 | 66 | 488 | 584 | 396 | 71 | 283 | 10 | 0 | 19 | 24 | 39 |
| intermediate | 866 | 168 | 1048 | 526 | 600 | 242 | 170 | 190 | 345 | 60 | 3 | 248 | 435 | 155 | 1 | 201 | 821 | 60 | 435 | 519 | 363 | 66 | 258 | 1 | 0 | 12 | 18 | 35 |
| advanced | 706 | 136 | 914 | 447 | 489 | 199 | 139 | 171 | 261 | 54 | 0 | 216 | 364 | 124 | 1 | 173 | 690 | 56 | 381 | 433 | 317 | 49 | 223 | 0 | 0 | 10 | 15 | 34 |

### spellingBee — words ≥4 letters with a usable clue for the level

| level | words ≥4 | with ≥1 usable clue among the level's definitions | share |
|---|---:|---:|---:|
| beginner | 8780 | 8347 | 95.1% |
| intermediate | 8780 | 8631 | 98.3% |
| advanced | 8780 | 8646 | 98.5% |

### spellingBee

| set | words | len min–median–max | freq rank median | in top-10k | not in freq list | with accent | with ñ | with hiatus |
|---|---:|---|---:|---:|---:|---:|---:|---:|
| beginner | 8347 | 4–8–19 | 5614 | 77.2% | 0.5% | 17.5% | 1.3% | 5.6% |
| intermediate | 8631 | 4–8–19 | 5578 | 77.4% | 0.5% | 17.4% | 1.3% | 5.5% |
| advanced | 8646 | 4–8–19 | 5573 | 77.4% | 0.5% | 17.5% | 1.3% | 5.5% |

| set | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13+ |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| beginner | 0 | 485 | 987 | 1207 | 1427 | 1366 | 1014 | 763 | 472 | 295 | 331 |
| intermediate | 0 | 520 | 1040 | 1255 | 1473 | 1420 | 1034 | 779 | 482 | 297 | 331 |
| advanced | 0 | 523 | 1044 | 1257 | 1477 | 1422 | 1034 | 779 | 482 | 297 | 331 |

| set | a | b | c | d | e | f | g | h | i | j | k | l | m | n | ñ | o | p | q | r | s | t | u | v | w | x | y | z | other |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| beginner | 947 | 176 | 1120 | 550 | 667 | 256 | 174 | 193 | 393 | 71 | 2 | 262 | 474 | 162 | 1 | 207 | 879 | 57 | 462 | 545 | 369 | 58 | 244 | 6 | 0 | 14 | 22 | 36 |
| intermediate | 981 | 186 | 1164 | 575 | 685 | 267 | 180 | 196 | 406 | 73 | 4 | 268 | 491 | 166 | 1 | 212 | 898 | 62 | 473 | 560 | 379 | 61 | 263 | 6 | 0 | 15 | 22 | 37 |
| advanced | 983 | 187 | 1164 | 575 | 685 | 267 | 180 | 197 | 407 | 73 | 4 | 271 | 491 | 167 | 1 | 212 | 899 | 62 | 474 | 561 | 381 | 61 | 264 | 6 | 0 | 15 | 22 | 37 |

### crossWordPuzzle — definitions words (accents stripped), 6 random letters per batch, 3 batches

- words: 8982; accent-stripping collisions (two words become one key, one definition lost): 98; keys with non-letters: 0

| level | target words | trials | full layout | failed after 3 batches | median placed-word length | words ≥ 10 letters placed |
|---|---:|---:|---:|---:|---:|---:|
| beginner | 4 | 150 | 150 | 0 | 7 | 78 |
| intermediate | 6 | 150 | 150 | 0 | 7 | 131 |
| advanced | 8 | 150 | 150 | 0 | 7 | 144 |

| set | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13+ |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| pool (all levels, accents stripped) | 6 | 43 | 141 | 529 | 1053 | 1267 | 1474 | 1425 | 1052 | 781 | 484 | 298 | 331 |
| placed, beginner (150 trials) | 0 | 0 | 11 | 8 | 101 | 56 | 172 | 56 | 118 | 20 | 41 | 5 | 12 |
| placed, intermediate (150 trials) | 0 | 0 | 25 | 38 | 154 | 84 | 247 | 75 | 146 | 31 | 62 | 11 | 27 |
| placed, advanced (150 trials) | 0 | 0 | 62 | 98 | 193 | 114 | 286 | 126 | 177 | 34 | 61 | 18 | 31 |

| set | a | b | c | d | e | f | g | h | i | j | k | l | m | n | ñ | o | p | q | r | s | t | u | v | w | x | y | z | other |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| pool (all levels, accents stripped) | 1018 | 194 | 1174 | 594 | 710 | 276 | 186 | 203 | 420 | 78 | 5 | 283 | 508 | 173 | 2 | 227 | 908 | 63 | 487 | 578 | 389 | 76 | 280 | 10 | 0 | 18 | 24 | 0 |
| placed, beginner (150 trials) | 84 | 16 | 78 | 42 | 44 | 25 | 12 | 25 | 22 | 2 | 0 | 29 | 26 | 12 | 0 | 9 | 57 | 6 | 28 | 40 | 16 | 2 | 21 | 2 | 0 | 1 | 1 | 0 |
| placed, intermediate (150 trials) | 129 | 21 | 84 | 90 | 65 | 39 | 25 | 33 | 28 | 8 | 0 | 16 | 31 | 13 | 1 | 26 | 86 | 4 | 48 | 53 | 63 | 8 | 22 | 1 | 0 | 3 | 3 | 0 |
| placed, advanced (150 trials) | 157 | 46 | 149 | 105 | 40 | 37 | 34 | 38 | 48 | 11 | 1 | 43 | 78 | 32 | 0 | 43 | 88 | 2 | 62 | 67 | 60 | 10 | 45 | 1 | 0 | 2 | 1 | 0 |

### wordBuilder — 4 random consonants + 2 random vowels, words from all three levels

| metric (1000 random letter sets) | value |
|---|---:|
| findable words p10 / median / p90 | 33 / 87 / 315 |
| … of which beginner-list words, median | 8 |
| sets with 0 findable words | 0 (0.0%) |
| sets with 0 beginner-list words | 28 (2.8%) |
| dictionary words never findable (letters outside the set, e.g. ü) | 938 |

- The level is not used by wordBuilder (same letters rule and same dictionary on every level).

| set | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13+ |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| findable dictionary (all levels) | 0 | 171 | 1017 | 4736 | 14.337 | 30.600 | 54.112 | 79.302 | 97.869 | 105.776 | 97.055 | 76.620 | 114.707 |
| found in 1000 letter sets (union) | 0 | 171 | 1014 | 4120 | 6425 | 6959 | 5666 | 3723 | 1938 | 821 | 230 | 62 | 10 |

| set | a | b | c | d | e | f | g | h | i | j | k | l | m | n | ñ | o | p | q | r | s | t | u | v | w | x | y | z | other |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| findable dictionary (all levels) | 101.616 | 18.394 | 70.133 | 86.776 | 96.815 | 15.910 | 14.014 | 12.120 | 20.567 | 5891 | 378 | 13.329 | 30.216 | 5869 | 319 | 8140 | 44.747 | 2233 | 49.564 | 29.675 | 29.326 | 2508 | 11.430 | 109 | 172 | 895 | 4718 | 438 |
| found in 1000 letter sets (union) | 6664 | 1792 | 2994 | 1395 | 2156 | 785 | 806 | 722 | 354 | 596 | 93 | 1004 | 1369 | 516 | 55 | 565 | 2064 | 23 | 2493 | 1375 | 1773 | 229 | 639 | 31 | 8 | 156 | 337 | 145 |

# EN

## Level lists (public/words)

| level | entries | unique | duplicates | also in beginner | also in intermediate | also in advanced | not lowercase letters only | length ≤ 2 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| beginner | 2873 | 2873 | 0 | — | 2 | 2 | 0 | 50 |
| intermediate | 31.293 | 31.293 | 0 | 2 | — | 24.574 | 0 | 67 |
| advanced | 354.643 | 354.643 | 0 | 2 | 24.574 | — | 0 | 90 |


## Blocklisted words still present in the level lists

- beginner: 0
- intermediate: 0
- advanced: 0

## Difficulty profile of each level (raw list, before game filters)

| set | words | len min–median–max | freq rank median | in top-10k | not in freq list | with accent | with ñ |
|---|---:|---|---:|---:|---:|---:|---:|
| beginner | 2873 | 1–6–15 | 1519 | 99.9% | 0.1% | 0.0% | 0.0% |
| intermediate | 31.293 | 2–9–29 | 6470 | 21.5% | 78.5% | 0.0% | 0.0% |
| advanced | 354.643 | 2–9–31 | 69.554 | 0.0% | 75.3% | 0.0% | 0.0% |

| set | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13+ |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| beginner | 2 | 48 | 179 | 483 | 539 | 491 | 459 | 309 | 174 | 109 | 41 | 18 | 21 |
| intermediate | 0 | 67 | 244 | 789 | 1766 | 2969 | 3784 | 4426 | 4642 | 4043 | 3266 | 2174 | 3123 |
| advanced | 0 | 90 | 1487 | 6447 | 16.938 | 26.875 | 38.665 | 47.704 | 50.255 | 47.235 | 38.689 | 29.416 | 50.842 |

## Games

### spellTower + wordsRain — distractor generation (`processWord` → `processWordWithAccent`)

| level | in length window (≥4) | 1 option (no distractor) | 2 options | 3 options | eligible (≥2 options) |
|---|---:|---:|---:|---:|---:|
| beginner | 2644 | 1847 (69.9%) | 673 | 124 | 797 |
| intermediate | 30.982 | 18.729 (60.5%) | 9877 | 2376 | 12.253 |
| advanced | 353.066 | 207.817 (58.9%) | 115.019 | 30.230 | 145.249 |

### spellTower

| set | words | len min–median–max | freq rank median | in top-10k | not in freq list | with accent | with ñ |
|---|---:|---|---:|---:|---:|---:|---:|
| beginner | 2644 | 4–6–15 | 1568 | 99.9% | 0.1% | 0.0% | 0.0% |
| intermediate | 30.982 | 4–9–29 | 6475 | 20.7% | 79.3% | 0.0% | 0.0% |
| advanced | 353.066 | 4–9–31 | 70.608 | 0.0% | 75.6% | 0.0% | 0.0% |

| set | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13+ |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| beginner | 0 | 483 | 539 | 491 | 459 | 309 | 174 | 109 | 41 | 18 | 21 |
| intermediate | 0 | 789 | 1766 | 2969 | 3784 | 4426 | 4642 | 4043 | 3266 | 2174 | 3123 |
| advanced | 0 | 6447 | 16.938 | 26.875 | 38.665 | 47.704 | 50.255 | 47.235 | 38.689 | 29.416 | 50.842 |

| set | a | b | c | d | e | f | g | h | i | j | k | l | m | n | o | p | q | r | s | t | u | v | w | x | y | z | other |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| beginner | 187 | 126 | 258 | 143 | 129 | 148 | 68 | 88 | 82 | 28 | 24 | 111 | 137 | 49 | 60 | 201 | 11 | 145 | 307 | 155 | 33 | 28 | 110 | 0 | 14 | 2 | 0 |
| intermediate | 2852 | 1610 | 3214 | 1704 | 1250 | 998 | 916 | 1109 | 1255 | 259 | 239 | 1078 | 1714 | 784 | 758 | 2650 | 161 | 1261 | 3058 | 1601 | 1262 | 570 | 461 | 63 | 54 | 101 | 0 |
| advanced | 23.543 | 17.230 | 30.377 | 18.245 | 13.407 | 11.149 | 10.967 | 13.571 | 12.573 | 2665 | 3853 | 9824 | 19.992 | 9593 | 11.313 | 34.261 | 1834 | 16.375 | 38.529 | 18.987 | 19.739 | 5500 | 6471 | 502 | 1136 | 1430 | 0 |

### wordFinder — game window vs prefetched pool (WORD_GROUP_FETCH_CONFIG 4–9)

| level | game window | eligible by game window | eligible by prefetch window (first ≥60 words after a level change) | of those, outside the game window |
|---|---|---:|---:|---:|
| beginner | 3–4 | 662 | 2455 | 1972 (80.3%) |
| intermediate | 4–6 | 5524 | 18.376 | 12.852 (69.9%) |
| advanced | 6–9 | 163.499 | 186.884 | 23.385 (12.5%) |

### wordFinder

| set | words | len min–median–max | freq rank median | in top-10k | not in freq list | with accent | with ñ |
|---|---:|---|---:|---:|---:|---:|---:|
| beginner | 662 | 3–4–4 | 934 | 100.0% | 0.0% | 0.0% | 0.0% |
| intermediate | 5524 | 4–6–6 | 6338 | 47.4% | 52.6% | 0.0% | 0.0% |
| advanced | 163.499 | 6–8–9 | 66.340 | 0.0% | 70.4% | 0.0% | 0.0% |

| set | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13+ |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| beginner | 179 | 483 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| intermediate | 0 | 789 | 1766 | 2969 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| advanced | 0 | 0 | 0 | 26.875 | 38.665 | 47.704 | 50.255 | 0 | 0 | 0 | 0 |

| set | a | b | c | d | e | f | g | h | i | j | k | l | m | n | o | p | q | r | s | t | u | v | w | x | y | z | other |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| beginner | 29 | 46 | 33 | 31 | 14 | 50 | 27 | 40 | 10 | 15 | 13 | 44 | 38 | 18 | 15 | 32 | 1 | 30 | 65 | 46 | 7 | 6 | 42 | 0 | 8 | 2 | 0 |
| intermediate | 454 | 386 | 423 | 314 | 192 | 244 | 208 | 184 | 125 | 102 | 93 | 252 | 307 | 156 | 136 | 376 | 24 | 283 | 554 | 308 | 82 | 149 | 118 | 5 | 24 | 25 | 0 |
| advanced | 10.535 | 10.224 | 13.878 | 8114 | 5915 | 6336 | 6062 | 5834 | 3921 | 1673 | 2294 | 5412 | 9127 | 3516 | 4979 | 12.957 | 877 | 8192 | 18.817 | 9395 | 6938 | 2770 | 4073 | 207 | 646 | 807 | 0 |

### letterMatcher — `buildLetterChallenge` eligibility (en)

| level | in window | eligible | share | prefetch pool (≥4) words outside window |
|---|---:|---:|---:|---:|
| beginner | 1513 | 293 | 19.4% | 42.8% |
| intermediate | 13.734 | 3965 | 28.9% | 55.7% |
| advanced | 329.681 | 141.440 | 42.9% | 6.6% |

### letterMatcher

| set | words | len min–median–max | freq rank median | in top-10k | not in freq list | with accent | with ñ |
|---|---:|---|---:|---:|---:|---:|---:|
| beginner | 293 | 4–5–6 | 1442 | 100.0% | 0.0% | 0.0% | 0.0% |
| intermediate | 3965 | 4–7–8 | 6438 | 34.1% | 65.9% | 0.0% | 0.0% |
| advanced | 141.440 | 6–10–31 | 71.842 | 0.0% | 78.4% | 0.0% | 0.0% |

| set | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13+ |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| beginner | 0 | 52 | 102 | 139 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| intermediate | 0 | 72 | 326 | 751 | 1197 | 1619 | 0 | 0 | 0 | 0 | 0 |
| advanced | 0 | 0 | 0 | 7088 | 13.385 | 18.528 | 20.935 | 20.980 | 18.297 | 14.563 | 27.664 |

| set | a | b | c | d | e | f | g | h | i | j | k | l | m | n | o | p | q | r | s | t | u | v | w | x | y | z | other |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| beginner | 25 | 25 | 19 | 15 | 19 | 18 | 9 | 13 | 6 | 1 | 4 | 15 | 15 | 6 | 4 | 11 | 6 | 7 | 36 | 18 | 4 | 5 | 11 | 0 | 1 | 0 | 0 |
| intermediate | 346 | 315 | 315 | 203 | 139 | 158 | 143 | 126 | 82 | 60 | 58 | 133 | 203 | 95 | 78 | 294 | 60 | 194 | 446 | 224 | 79 | 86 | 95 | 4 | 9 | 20 | 0 |
| advanced | 8619 | 7146 | 11.627 | 6982 | 4839 | 4599 | 4383 | 4895 | 5775 | 1020 | 1204 | 3358 | 6861 | 3810 | 4611 | 14.322 | 1664 | 6778 | 16.342 | 6851 | 9944 | 1823 | 2887 | 182 | 351 | 567 | 0 |

### Daily word (`loadDailyWordForLocale`: `getRandomWords(1)` from beginner, no length filter)

- beginner words: 2873; shorter than 4 letters (WORDS_DAILY's minLength, which the daily word never reads): 229 (8.0%) — e.g. `a`, `act`, `ad`, `add`, `age`, `ago`, `ah`, `aid`, `aim`, `air`, `al`, `all`
- beginner words with an entry in public/definitions/en: 2747 (95.6%)

## Definitions data (public/definitions)

| metric | value |
|---|---:|
| words with an entry | 45.766 |
| … not in any level list | 10 (0.0%) |
| … with no definitions | 0 |
| `level` field | (none): 1513, beginner: 2655, intermediate: 10.827, advanced: 30.771 |
| definitions | 206.342 |
| … empty text | 0 |
| … HTML/entity junk | 0 |
| … under 10 letters after `formatDefinition` (cut at first '.') | 6513 (3.2%) |
| … raw text contains the word | 20.118 (9.7%) |
| … formatted text (what definitionMaster shows) contains the word | 19.112 (9.3%) |

Per letter (words with an entry):

| a | b | c | d | e | f | g | h | i | j | k | l | m | n | o | p | q | r | s | t | u | v | w | x | y | z |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 5356 | 2483 | 4349 | 2584 | 1794 | 1838 | 1394 | 1548 | 1805 | 335 | 342 | 1361 | 2323 | 882 | 1067 | 3584 | 217 | 2080 | 4730 | 2178 | 1590 | 713 | 993 | 20 | 118 | 82 |

- Short-after-format samples: `a: "Of." → "Of"`; `a: "All." → "All"`; `absent: "Leave." → "Leave"`; `abuse: "Disuse." → "Disuse"`; `accent: "Utterance." → "Utterance"`; `acre: "A field." → "A field"`; `acute: "Urgent." → "Urgent"`; `adequate: "To equal." → "To equal"`
- Shown definition contains the word: `a: "The name of the Latin script letter A/a"`; `a: "(crosswords) across"`; `a: "To do with position or direction; In, on, at, by, towards, onto"`; `a: "To do with separation; In, into"`; `a: "To do with time; Each, per, in, on, by"`; `a: "To do with role or capacity; In"`

### definitionMaster — words per letter with enough definitions (`minDefs` 1/2/3, max 10 per letter session)

| level | total eligible | letters with < 5 words (fewer than 5 options) | letters with < 10 words (short quiz) | sessions per letter before repeat (eligible/10) min–median |
|---|---:|---|---|---|
| beginner | 45.766 | — | — | 11.8–180.5 |
| intermediate | 33.278 | — | — | 9.8–133.2 |
| advanced | 24.300 | — | — | 7.4–93.4 |

- Words whose first formatted definition repeats another word's in the same letter file (identical answer options): 7066 — e.g. `accept / accepted: "to receive, especially with a consent, with favour"`; `account / accounts: "a registry of pecuniary transactions; a written or"`; `action / actions: "something done so as to accomplish a purpose"`; `activities / activity: "the state or quality of being active; activeness"`; `act / acts: "something done, a deed"`; `added / adding: "to join or unite (e"`
- The level does not pick the words, only how many definitions they need: beginner: 6.0% are beginner-list words; intermediate: 8.1% are beginner-list words; advanced: 10.6% are beginner-list words.

### definitionMaster

| set | words | len min–median–max | freq rank median | in top-10k | not in freq list | with accent | with ñ |
|---|---:|---|---:|---:|---:|---:|---:|
| beginner | 45.766 | 1–8–29 | 31.166 | 19.2% | 15.4% | 0.0% | 0.0% |
| intermediate | 33.278 | 1–8–20 | 24.295 | 25.1% | 9.5% | 0.0% | 0.0% |
| advanced | 24.300 | 1–7–18 | 18.749 | 31.8% | 5.7% | 0.0% | 0.0% |

| set | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13+ |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| beginner | 2 | 134 | 806 | 2511 | 3976 | 5763 | 6774 | 7004 | 6397 | 4906 | 3348 | 2044 | 2101 |
| intermediate | 2 | 102 | 714 | 2236 | 3396 | 4723 | 5293 | 5021 | 4453 | 3167 | 2039 | 1122 | 1010 |
| advanced | 2 | 81 | 635 | 1998 | 2905 | 3859 | 4058 | 3594 | 2944 | 1956 | 1206 | 602 | 460 |

| set | a | b | c | d | e | f | g | h | i | j | k | l | m | n | o | p | q | r | s | t | u | v | w | x | y | z | other |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| beginner | 5356 | 2483 | 4349 | 2584 | 1794 | 1838 | 1394 | 1548 | 1805 | 335 | 342 | 1361 | 2323 | 882 | 1067 | 3584 | 217 | 2080 | 4730 | 2178 | 1590 | 713 | 993 | 20 | 118 | 82 | 0 |
| intermediate | 3468 | 1921 | 3248 | 2005 | 1332 | 1434 | 981 | 1094 | 1266 | 255 | 218 | 1005 | 1631 | 577 | 733 | 2635 | 178 | 1673 | 3670 | 1650 | 835 | 521 | 793 | 10 | 98 | 47 | 0 |
| advanced | 2303 | 1457 | 2441 | 1531 | 934 | 1111 | 736 | 801 | 868 | 203 | 159 | 753 | 1109 | 404 | 514 | 1923 | 134 | 1284 | 2800 | 1253 | 465 | 373 | 636 | 5 | 74 | 29 | 0 |

### spellingBee — words ≥4 letters with a usable clue for the level

| level | words ≥4 | with ≥1 usable clue among the level's definitions | share |
|---|---:|---:|---:|
| beginner | 44.824 | 41.412 | 92.4% |
| intermediate | 44.824 | 43.743 | 97.6% |
| advanced | 44.824 | 43.878 | 97.9% |

### spellingBee

| set | words | len min–median–max | freq rank median | in top-10k | not in freq list | with accent | with ñ |
|---|---:|---|---:|---:|---:|---:|---:|
| beginner | 41.412 | 4–8–29 | 32.435 | 18.2% | 15.9% | 0.0% | 0.0% |
| intermediate | 43.743 | 4–8–29 | 31.766 | 18.7% | 15.5% | 0.0% | 0.0% |
| advanced | 43.878 | 4–8–29 | 31.609 | 18.8% | 15.4% | 0.0% | 0.0% |

| set | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13+ |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| beginner | 0 | 2072 | 3466 | 5223 | 6240 | 6508 | 6037 | 4655 | 3208 | 1971 | 2032 |
| intermediate | 0 | 2394 | 3837 | 5624 | 6586 | 6824 | 6278 | 4818 | 3297 | 2013 | 2072 |
| advanced | 0 | 2441 | 3862 | 5644 | 6610 | 6833 | 6281 | 4820 | 3300 | 2014 | 2073 |

| set | a | b | c | d | e | f | g | h | i | j | k | l | m | n | o | p | q | r | s | t | u | v | w | x | y | z | other |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| beginner | 4932 | 2275 | 3975 | 2335 | 1592 | 1683 | 1242 | 1390 | 1661 | 286 | 300 | 1206 | 2075 | 769 | 942 | 3256 | 199 | 1898 | 4276 | 1963 | 1461 | 637 | 894 | 17 | 84 | 64 | 0 |
| intermediate | 5148 | 2391 | 4198 | 2464 | 1705 | 1778 | 1329 | 1459 | 1745 | 304 | 315 | 1276 | 2209 | 823 | 994 | 3433 | 214 | 1998 | 4571 | 2068 | 1519 | 672 | 950 | 18 | 93 | 69 | 0 |
| advanced | 5153 | 2395 | 4208 | 2479 | 1710 | 1784 | 1333 | 1468 | 1751 | 304 | 315 | 1279 | 2220 | 823 | 998 | 3443 | 214 | 2012 | 4589 | 2076 | 1519 | 673 | 952 | 18 | 93 | 69 | 0 |

### crossWordPuzzle — definitions words (accents stripped), 6 random letters per batch, 3 batches

- words: 45.766; accent-stripping collisions (two words become one key, one definition lost): 0; keys with non-letters: 0

| level | target words | trials | full layout | failed after 3 batches | median placed-word length | words ≥ 10 letters placed |
|---|---:|---:|---:|---:|---:|---:|
| beginner | 4 | 150 | 150 | 0 | 8 | 89 |
| intermediate | 6 | 150 | 150 | 0 | 8 | 170 |
| advanced | 8 | 150 | 150 | 0 | 7 | 210 |

| set | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13+ |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| pool (all levels, accents stripped) | 2 | 134 | 806 | 2511 | 3976 | 5763 | 6774 | 7004 | 6397 | 4906 | 3348 | 2044 | 2101 |
| placed, beginner (150 trials) | 0 | 0 | 10 | 8 | 61 | 42 | 162 | 77 | 151 | 9 | 45 | 6 | 29 |
| placed, intermediate (150 trials) | 0 | 0 | 20 | 27 | 98 | 104 | 190 | 121 | 170 | 44 | 75 | 14 | 37 |
| placed, advanced (150 trials) | 0 | 0 | 48 | 83 | 150 | 106 | 221 | 125 | 257 | 47 | 104 | 14 | 45 |

| set | a | b | c | d | e | f | g | h | i | j | k | l | m | n | o | p | q | r | s | t | u | v | w | x | y | z | other |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| pool (all levels, accents stripped) | 5356 | 2483 | 4349 | 2584 | 1794 | 1838 | 1394 | 1548 | 1805 | 335 | 342 | 1361 | 2323 | 882 | 1067 | 3584 | 217 | 2080 | 4730 | 2178 | 1590 | 713 | 993 | 20 | 118 | 82 | 0 |
| placed, beginner (150 trials) | 100 | 31 | 50 | 37 | 27 | 31 | 14 | 29 | 25 | 3 | 4 | 16 | 26 | 13 | 16 | 34 | 5 | 26 | 42 | 28 | 20 | 6 | 15 | 0 | 1 | 1 | 0 |
| placed, intermediate (150 trials) | 130 | 59 | 70 | 56 | 31 | 39 | 32 | 35 | 39 | 3 | 5 | 20 | 34 | 12 | 27 | 94 | 3 | 42 | 79 | 35 | 22 | 10 | 18 | 0 | 4 | 1 | 0 |
| placed, advanced (150 trials) | 200 | 55 | 100 | 72 | 41 | 54 | 53 | 54 | 28 | 12 | 13 | 40 | 51 | 27 | 20 | 99 | 2 | 51 | 101 | 58 | 20 | 20 | 23 | 0 | 4 | 2 | 0 |

### wordBuilder — 4 random consonants + 2 random vowels, words from all three levels

| metric (1000 random letter sets) | value |
|---|---:|
| findable words p10 / median / p90 | 59 / 126 / 277 |
| … of which beginner-list words, median | 10 |
| sets with 0 findable words | 0 (0.0%) |
| sets with 0 beginner-list words | 3 (0.3%) |
| dictionary words never findable (letters outside the set, e.g. ü) | 0 |

- The level is not used by wordBuilder (same letters rule and same dictionary on every level).

| set | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13+ |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| findable dictionary (all levels) | 0 | 205 | 1908 | 7536 | 18.400 | 28.457 | 40.207 | 48.918 | 51.178 | 47.822 | 39.031 | 29.599 | 50.970 |
| found in 1000 letter sets (union) | 0 | 205 | 1897 | 6211 | 7621 | 5241 | 2610 | 1338 | 428 | 126 | 47 | 14 | 3 |

| set | a | b | c | d | e | f | g | h | i | j | k | l | m | n | o | p | q | r | s | t | u | v | w | x | y | z | other |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| findable dictionary (all levels) | 24.354 | 17.792 | 31.405 | 18.875 | 13.930 | 11.630 | 11.302 | 13.957 | 13.009 | 2823 | 4000 | 10.237 | 20.543 | 9854 | 11.635 | 35.081 | 1886 | 17.038 | 39.664 | 19.590 | 19.927 | 5685 | 6806 | 507 | 1230 | 1471 | 0 |
| found in 1000 letter sets (union) | 2144 | 1977 | 1587 | 1360 | 907 | 951 | 1060 | 980 | 594 | 427 | 805 | 869 | 1185 | 769 | 673 | 1509 | 62 | 1400 | 2787 | 1634 | 435 | 364 | 708 | 26 | 350 | 178 | 0 |

