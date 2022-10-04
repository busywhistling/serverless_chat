// Modified from https://github.com/cloudflare/workers-chat-demo (BSD)
async function handleErrors(request, func) {
	try {
		return await func();
	} catch (err) {
		if (request.headers.get("Upgrade") == "websocket") {
			let pair = new WebSocketPair();
			pair[1].accept();
			pair[1].send(JSON.stringify({ error: err.stack }));
			pair[1].close(1011, "Uncaught exception during session setup");
			return new Response(null, { status: 101, webSocket: pair[0] });
		} else {
			return new Response(err.stack, { status: 500 });
		}
	}
}
export default {
	async fetch(request, env) {
		// - `request` is the incoming `Request` instance
		// - `env` contains bindings, KV namespaces, Durable Objects, etc
		return await handleErrors(request, async () => {
			const url = new URL(request.url);
			const path = url.pathname.slice(1).split("/");
			if (!path[0]) {
				return new Response("Paramjit's chat web worker", {
					headers: { "Content-Type": "text/html;charset=UTF-8" },
				});
			}
			switch (path[0]) {
				case "api":
					return handleApiRequest(path.slice(1), request, env);
				default:
					return new Response("Not found", { status: 404 });
			}
		});
	},
};
async function handleApiRequest(path, request, env) {
	switch (
		path[0] // path[0] is path following /api/
	) {
		case "room": {
			if (!path[1]) {
				if (request.method == "POST") {
					const newRoomId = env.rooms.newUniqueId();
					return new Response(newRoomId.toString(), {
						headers: { "Access-Control-Allow-Origin": "*" },
					});
				} else {
					return new Response("Method not allowed", { status: 405 });
				}
			}
			const roomName = path[1];
			let roomId;
			if (roomName.match(/^[0-9a-f]{64}$/)) {
				roomId = env.rooms.idFromString(roomName);
			} else if (roomName.length <= 32) {
				roomId = env.rooms.idFromName(roomName);
			} else {
				return new Response("Name too long", { status: 404 });
			}
			const roomObject = env.rooms.get(roomId);
			const newUrl = new URL(request.url);
			newUrl.pathname = "/" + path.slice(2).join("/");
			return roomObject.fetch(newUrl, request);
		}
		default:
			return new Response("Not found", { status: 404 });
	}
}
export class ChatRoom {
	constructor(controller, env) {
		// - `controller` contains `scheduledTime` and `cron` properties
		// - `env` contains bindings, KV namespaces, Durable Objects, etc
		// this.storage = controller.storage;
		this.env = env;
		this.sessions = [];
		this.lastTimestamp = 0;
	}
	async fetch(request) {
		return await handleErrors(request, async () => {
			const url = new URL(request.url);
			switch (url.pathname) {
				case "/websocket": {
					if (request.headers.get("Upgrade") != "websocket") {
						return new Response("Expected websocket", { status: 400 });
					}
					const ip = request.headers.get("CF-Connecting-IP");
					const [client, server] = Object.values(new WebSocketPair());
					await this.handleSession(server, ip);
					return new Response(null, { status: 101, webSocket: client });
				}
				default:
					return new Response("Not found", { status: 404 });
			}
		});
	}
	async handleSession(webSocket, ip) {
		webSocket.accept();
		const limiterId = this.env.limiters.idFromName(ip);
		const limiter = new RateLimiterClient(
			() => this.env.limiters.get(limiterId),
			err => webSocket.close(1011, err.stack),
		);
		const session = { webSocket, blockedMessages: [], participants: [] };
		// note that sessions are distinguished foremost by the websocket server
		this.sessions.push(session);
		this.sessions.forEach(otherSession => {
			// inquire about all other sessions connected to this room
			if (otherSession.name) {
				session.blockedMessages.push(JSON.stringify({ joined: otherSession.name }));
				session.participants.push(otherSession.name);
			}
		});
		// collect a backlog of last 100 or so messages
		// const storage = await this.storage.list({ reverse: true, limit: 100 });
		// const backlog = [...storage.values()];
		// backlog.reverse();
		// backlog.forEach(value => {
		// 	session.blockedMessages.push(value);
		// });
		let receivedUserInfo = false;
		webSocket.addEventListener("message", async msg => {
			try {
				if (session.quit) {
					webSocket.close(1011, "WebSocket broken.");
					// clear the storage here
					return;
				}
				if (!limiter.checkLimit()) {
					webSocket.send(
						JSON.stringify({
							error: "Your IP is being rate-limited, please try again later.",
						}),
					);
					return;
				}
				let data = JSON.parse(msg.data);
				if (!receivedUserInfo) {
					// expect initial announcement { user: User, joined: Room }
					session.name = "" + (data.user || "anonymous");
					if (session.name.length > 32) {
						webSocket.send(JSON.stringify({ error: "Name too long." }));
						webSocket.close(1009, "Name too long.");
						return;
					}
					session.blockedMessages.forEach(queued => {
						// notify client of what has been going on
						webSocket.send(queued);
					});
					delete session.blockedMessages;
					this.broadcast({ joined: session.name });
					webSocket.send(JSON.stringify({ ready: true }));
					receivedUserInfo = true;
					return;
				}
				data = { name: session.name, message: "" + data.message };
				if (data.message.length > 256) {
					webSocket.send(JSON.stringify({ error: "Message too long." }));
					return;
				}
				data.timestamp = Math.max(Date.now(), this.lastTimestamp + 1);
				this.lastTimestamp = data.timestamp;
				this.broadcast(data);
				const key = new Date(data.timestamp).toISOString();
				// await this.storage.put(key, dataStr); // to have a log of the messages
			} catch (err) {
				webSocket.send(JSON.stringify({ error: err.stack }));
			}
		});
		let closeOrErrorHandler = event => {
			session.quit = true;
			this.sessions = this.sessions.filter(member => member !== session);
			if (session.name) {
				this.broadcast({ quit: session.name });
			}
		};
		webSocket.addEventListener("close", closeOrErrorHandler);
		webSocket.addEventListener("error", closeOrErrorHandler);
	}
	broadcast(message) {
		if (typeof message !== "string") {
			message = JSON.stringify(message);
		}
		let quitters = [];
		this.sessions = this.sessions.filter(session => {
			if (session.name) {
				try {
					session.webSocket.send(message);
					return true;
				} catch (err) {
					session.quit = true;
					quitters.push(session);
					return false;
				}
			} else {
				// we don't really care about anonymous sessions
				session.blockedMessages.push(message);
				return true;
			}
		});
		quitters.forEach(quitter => {
			if (quitter.name) {
				this.broadcast({ quit: quitter.name });
			}
		});
	}
}
export class RateLimiter {
	constructor(controller, env) {
		this.nextAllowedTime = 0;
	}
	async fetch(request) {
		return await handleErrors(request, async () => {
			let now = Date.now() / 1000;
			this.nextAllowedTime = Math.max(now, this.nextAllowedTime);
			if (request.method == "POST") {
				this.nextAllowedTime += 5;
			}
			let cooldown = Math.max(0, this.nextAllowedTime - now - 20);
			return new Response(cooldown);
		});
	}
}
class RateLimiterClient {
	constructor(getLimiterStub, reportError) {
		this.getLimiterStub = getLimiterStub;
		this.reportError = reportError;
		this.limiter = getLimiterStub();
		this.inCooldown = false;
	}
	checkLimit() {
		if (this.inCooldown) {
			return false;
		}
		this.inCooldown = true;
		this.callLimiter();
		return true;
	}
	async callLimiter() {
		try {
			let response;
			try {
				response = await this.limiter.fetch("https://dummy-url", { method: "POST" });
			} catch (err) {
				this.limiter = this.getLimiterStub();
				response = await this.limiter.fetch("https://dummy-url", { method: "POST" });
			}
			let cooldown = +(await response.text());
			await new Promise(resolve => setTimeout(resolve, cooldown * 1000));
			this.inCooldown = false;
		} catch (err) {
			this.reportError(err);
		}
	}
}
