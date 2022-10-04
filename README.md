## Serverless Chat

A live chat React app to talk to friends over serverless Cloudflare workers. It's non-persistent by design and makes the most of serverless architectures (implementing room/message moderation and rate limiting).

### Tech

-   [React](https://reactjs.org/) for the frontend UI, [wrangler](https://github.com/cloudflare/wrangler2) & [miniflare](https://miniflare.dev/) for developing & deploying Cloudflare workers
-   [vite](https://vitejs.dev/) & [pnpm](https://pnpm.io/) as primary development tools
-   HTML, CSS, TS as the principal programming/markup languages

### Special lessons

-   Using React hooks, managing state (with lifts to parent components when necessary), using callback functions in `setState()` instead of objects to reconcile asynchronous updates to state.
-   Writing a Cloudflare worker, taking inspiration from documentation examples & using [Miniflare](https://miniflare.dev/) as a local Cloudflare worker runtime (over node.js).
- Testing the projects with unit tests ([Jest](https://jestjs.io/)) and end-to-end tests ([Playwright](https://playwright.dev/)) (Special note: Jest needs [Babel](https://stackoverflow.com/a/55467567) to support ES6 module syntax).
- Setting up a CI/CD pipeline for testing, building & deploying app.
- Formatting `package.json` grouping together related dependencies (pinned)

### Directory structure & project architecture

-   `src` contains the main source tree, with subfolder `components` containing the Form & Chatbox components (abstracted by [_functionality_](https://paramjit.org/blog/22-09-17-implementing-a-chess-transcriber-in-react/)).
-   Project architected as a standard React + Typescript web app.

### Future extensions with minimal effort

-   [ ] Any kind of real-time application is now within reach, thanks to websockets.

### Build & run

```bash
git clone https://github.com/busywhistling/serverless_chat
cd serverless_chat
pnpm install
pnpm dev # to run dev server
pnpm test # to run test suites
pnpm build # to build for production
# in a different terminal
# change WEBSOCKET_URL in src/App.tsx to localhost:8787
pnpm worker # to run dev worker
pnpm worker-deploy # to push worker to production
# you need to be logged in using wrangler login
```