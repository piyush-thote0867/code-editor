# ⚡ ColabEdit

Ever tried editing code with a friend over a call, sharing your screen, saying "no no scroll up, line 42"? Yeah. That's why I built this.

ColabEdit lets multiple people edit the same document simultaneously — in real time, from any browser. No accounts. No setup. Just open the link and start typing.

(![Demo](assets/V1_sync_.mp4)

---

## The Hard Part

Two people typing at the same position at the same time. Most editors just let the last write win — 
                                    you lose keystrokes, documents diverge, chaos.

ColabEdit uses **Operational Transformation** — every edit carries a revision number, the server transforms conflicting ops before applying them, and everyone converges to the same text. Always.

When two people edit the same line simultaneously, a 🔴 badge appears in the gutter. You see the conflict, not just the result.

---

## Stack

- Node.js + Socket.io — real-time transport
- CodeMirror 6 — the actual editor
- Custom OT engine — built from scratch, no libraries
- esbuild — bundles it all for the browser

---

## Run it

```bash
git clone https://github.com/piyush-thote0867/code-editor.git
cd code-editor
npm install
npx esbuild public/script.js --bundle --outfile=public/bundle.js
node server.js
```

Open `localhost:3000` in two tabs. Type in both.

---

## What's Coming (v2)

- **Rooms + passcodes** — host creates a room, shares a code, decides who gets in.
- **Persistence** — documents survive server restarts.
- **Colored cursors** — see exactly where everyone is typing.
- **Conflict history** — click 🔴 to see what clashed and who caused it.
- **Deployment** — public URL, no localhost required.
- **AI Linked Agent to guide while working. 
---
updated : 05-07-26
Built by Piyush Thote · VNIT Nagpur · [github.com/piyush-thote0867](https://github.com/piyush-thote0867)
