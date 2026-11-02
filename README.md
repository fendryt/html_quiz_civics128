# Civics 128 daily quiz

A static web app (no build step, no server code) for practicing the 128 questions of the 2025 naturalization civics test (USCIS M-1778). It can run from GitHub Pages or straight from this folder. Results are written to a folder on your own computer, never to GitHub.

## Files

| File | Purpose |
|---|---|
| `index.html`, `style.css`, `app.js` | The app |
| `terms.js`, `gate.js` | The usage agreement shown before every visit, and its download. `terms.js` is the one place to edit the text |
| `TERMS.md` | The same agreement for the repo. Regenerate with `node tools/build-terms.js` after editing `terms.js` |
| `data/questions.js` | The 128 questions and accepted answers. Edit here if USCIS updates the test |

## Use it

1. Open the page (GitHub Pages URL, or `index.html`).
2. Click **Choose results folder** once and pick any folder on your computer. Chrome, Edge and Opera can write to it directly. Safari and Firefox cannot: use **Download CSVs** and **Download backup** there.
3. Pick **10, 12, 20, 30** questions per day, or type any number from 1 to 128 in the custom box. Changing it mid-day adds to or trims today's set. Questions already answered stay.
4. Say the answer out loud, tap **Show answer**, then **I said it right** (key `1`) or **Missed it** (key `2`). Space shows the answer.

Each day gets a new random set. Missed questions are favored (up to a third of the set), then questions never asked, then correct ones answered longest ago. Today's set is saved, so reloading the page keeps it.

## Usage agreement and privacy

- The app stays hidden until the visitor checks the agreement box and selects Continue. Agreement is never stored, so it is asked on every visit. The visitor can download the agreement (`.txt`) from that screen and from the page footer.
- The page ships a Content Security Policy that blocks outgoing connections (`connect-src 'none'`) and third-party scripts, and it loads no web fonts, so the page makes no network requests of its own. GitHub Pages, as host, can still log visitor IP addresses under GitHub's privacy statement.
- A second, optional checkbox marks a public or shared computer. In that mode the app reads and writes nothing in browser storage or any folder (it also ignores results a previous person left there), keeps progress in memory only, and hides the folder controls. Download CSVs and Download backup still work if the visitor chooses to save a file.
- The **Safety and permissions** panel on the page explains what the folder permission can and cannot do.
- Edit `AUTHOR` in `terms.js` if you want your name in the agreement. Governing law is set to California (section 13). Have a lawyer review the text before relying on it: these terms are a template, not legal advice.
- A client-side checkbox can't stop someone who edits the page in their own browser. It records the notice and the visitor's choice, but the author keeps no record of who agreed.

## View performance

The **View performance** button shows accuracy, practice days, how many questions you currently have right, a line chart of accuracy by day (with the 60% pass line: 12 of 20), a line chart of questions you currently have right, the questions you miss most, and a table by day. Trend lines need two practice days.

## What gets written to your folder

After each answer the app rewrites these files in the folder you chose:

- `civics128-progress.json` is the record: each day's questions and your marks, plus every attempt.
- `civics128-daily.csv`: one row per day with answers (answered, correct, incorrect, percent correct, questions currently right). This is the file behind the trend charts.
- `civics128-questions.csv`: one row per question (answers, last result, times asked, correct, incorrect, last asked).
- `civics128-attempts.csv`: every attempt (time, question, answer, result).

The CSV files open in Excel, Numbers or Google Sheets (UTF-8 with a byte-order mark). The app overwrites them, so copy a file elsewhere before editing it. If one is open in another program the write can fail; close it and answer another question.

After a browser restart, Chrome may ask you to click **Reconnect folder** once. If you choose the same folder from another browser or computer, the app merges what is there with what is in the browser.

## GitHub Pages

1. Create a repo and push this folder's contents to the root of `main`.
2. Settings → Pages → Build and deployment → Deploy from a branch → `main` / `(root)`.
3. Open `https://<your-user>.github.io/<repo>/`.

`.gitignore` keeps the progress and CSV files out of the repo in case you pick the project folder as your results folder.

## Things to check before the interview

Answers tagged **verify** (Speaker of the House, President, Vice President, Chief Justice, some state officials) change with who is in office. See https://www.uscis.gov/citizenship/testupdates. Local-answer questions (governor, capital, senators) vary by state.
