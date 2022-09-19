/**
 * Cloudflare Worker, built with Durable Objects
 *
 * - Run `wrangler dev src/index.ts` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `wrangler publish src/index.ts --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

// import "@cloudflare/workers-types";
import { Env } from "./types";
import { handleApiRequest } from "./handleApiRequest";

// Being a ES6 module, this code doesn't use `addEventListener("fetch",
// handler)` to register its main HTTP handler; instead, it _exports_ a handler,
// as we'll see below.
//
// This makes workers *composable*: You can take two workers written this way and
// merge them into one worker, by importing the two Workers' exported handlers yourself, and then
// exporting a new handler that call into the other Workers as appropriate.
//
// This new syntax is required when using Durable Objects, because your Durable Objects are
// implemented by classes, and those classes need to be exported.
//
// To see an example configuration for uploading module-based Workers, check out the wrangler.toml
// file or one of our Durable Object templates for Wrangler:
//   * https://github.com/cloudflare/durable-objects-template
//   * https://github.com/cloudflare/durable-objects-rollup-esm
//   * https://github.com/cloudflare/durable-objects-webpack-commonjs

// ===============================
// Required Environment
// ===============================
//
// This worker, when deployed, must be configured with two environment bindings:
// * rooms: A Durable Object namespace binding mapped to the ChatRoom class.
// * limiters: A Durable Object namespace binding mapped to the RateLimiter class.
//
// Incidentally, in pre-modules Workers syntax, "bindings" (like KV bindings, secrets, etc.)
// appeared in your script as global variables, but in the new modules syntax, this is no longer
// the case. Instead, bindings are now delivered in an "environment object" when an event handler
// (or Durable Object class constructor) is called. Look for the variable `env` below.
//
// We made this change, again, for composability: The global scope is global, but if you want to
// call into existing code that has different environment requirements, then you need to be able
// to pass the environment as a parameter instead.
//
// Once again, see the wrangler.toml file to understand how the environment is configured.

// =======================================================================================
// The regular Worker part...
//
// This section of the code implements a normal Worker that receives HTTP requests from external
// clients. This part is stateless.

// With the introduction of modules, we're experimenting with allowing text/data blobs to be
// uploaded and exposed as synthetic modules. In wrangler.toml we specify a rule that files ending
// in .html should be uploaded as "Data", equivalent to content-type `application/octet-stream`.
// So when we import it as `HTML` here, we get the HTML content as an `ArrayBuffer`. This lets us
// serve our app's static asset without relying on any separate storage. (However, the space
// available for assets served this way is very limited; larger sites should continue to use Workers
// KV to serve assets.)

// `handleErrors()` is a little utility function that can wrap an HTTP request handler in a
// try/catch and return errors to the client. You probably wouldn't want to use this in production
// code but it is convenient when debugging and iterating.
export async function handleErrors(request: Request, func: () => Promise<Response>) {
	try {
		return await func();
	} catch (err) {
		if (request.headers.get("Upgrade") == "websocket") {
			// Annoyingly, if we return an HTTP error in response to a WebSocket request, Chrome devtools
			// won't show us the response body! So... let's send a WebSocket response with an error
			// frame instead.
			const pair = new WebSocketPair();
			pair[1].accept();
			pair[1].send(JSON.stringify({ error: err instanceof Error ? err.stack : null }));
			pair[1].close(1011, "Uncaught exception during session setup");
			return new Response(null, { status: 101, webSocket: pair[0] });
		} else {
			return new Response(err instanceof Error ? err.stack : null, { status: 500 });
		}
	}
}

// In modules-syntax workers, we use `export default` to export our script's main event handlers.
// Here, we export one handler, `fetch`, for receiving HTTP requests. In pre-modules workers, the
// fetch handler was registered using `addEventHandler("fetch", event => { ... })`; this is just
// new syntax for essentially the same thing.
//
// `fetch` isn't the only handler. If your worker runs on a Cron schedule, it will receive calls
// to a handler named `scheduled`, which should be exported here in a similar way. We will be
// adding other handlers for other types of events over time.

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		return await handleErrors(request, async () => {
			// We have received an HTTP request! Parse the URL and route the request.

			const url = new URL(request.url);
			const path = url.pathname.slice(1).split("/");

			if (!path[0]) {
				// Serve our HTML at the root path.
				return new Response("Hello world", {
					headers: { "Content-Type": "text/html;charset=UTF-8" },
				});
			}

			switch (path[0]) {
				case "api":
					// This is a request for `/api/...`, call the API handler.
					return handleApiRequest(path.slice(1), request, env);

				default:
					return new Response("Not found", { status: 404 });
			}
		});
	},
};
