import type { JsonObject, JsonValue } from "@/types/json";
import { messageFromErrorJson } from "@/types/http";
import { ApiError } from "./query-client";

/** Nest global prefix is `api` → e.g. `http://localhost:4033/api` + `/auth/login`. */
const BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4033/api").replace(/\/+$/, "");

const TOKEN_EVENT = "lms:token-changed";
const LEGACY_TOKEN_KEY = "lms_token";

/**
 * Session model (msfts §8): the short-lived access token lives only in memory; the refresh
 * token is an httpOnly cookie the browser sends to `/api/auth/*`. A reload calls
 * `/auth/refresh` to get a new access token. Nothing sensitive is kept in localStorage.
 */
let accessToken: string | null = null;

function notifyTokenChange(hasToken: boolean): void {
	if (typeof window === "undefined") return;
	window.dispatchEvent(new CustomEvent<boolean>(TOKEN_EVENT, { detail: hasToken }));
}

if (typeof window !== "undefined") {
	// Tokens from older versions of the app were kept in localStorage.
	try {
		window.localStorage.removeItem(LEGACY_TOKEN_KEY);
	} catch {
		/* storage blocked */
	}
}

/** Non-sensitive hint cookies read by `proxy.ts` to route before render (msfts §9). */
export function setSessionHint(on: boolean, roles?: string): void {
	if (typeof document === "undefined") return;
	const attrs = "Path=/; SameSite=Lax";
	if (on) {
		document.cookie = `ek_session=1; ${attrs}; Max-Age=2592000`;
		if (roles !== undefined) document.cookie = `ek_roles=${roles}; ${attrs}; Max-Age=2592000`;
	} else {
		document.cookie = `ek_session=; ${attrs}; Max-Age=0`;
		document.cookie = `ek_roles=; ${attrs}; Max-Age=0`;
	}
}

export const tokenStorage = {
	get: (): string | null => accessToken,
	set: (token: string): void => {
		accessToken = token;
		setSessionHint(true);
		notifyTokenChange(true);
	},
	remove: (): void => {
		accessToken = null;
		setSessionHint(false);
		notifyTokenChange(false);
	},
};

export { TOKEN_EVENT };

async function readJsonBody(res: Response): Promise<JsonValue | undefined> {
	if (res.status === 204) return undefined;
	const text = await res.text();
	if (!text.trim()) return undefined;
	try {
		return JSON.parse(text) as JsonValue;
	} catch {
		return undefined;
	}
}

let refreshing: Promise<boolean> | null = null;

/** Exchange the refresh cookie for a new access token. One request at a time. */
export function refreshSession(): Promise<boolean> {
	refreshing ??= (async () => {
		try {
			const res = await fetch(`${BASE_URL}/auth/refresh`, {
				method: "POST",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: "{}",
			});
			if (!res.ok) {
				tokenStorage.remove();
				return false;
			}
			const data = (await readJsonBody(res)) as { accessToken?: string } | undefined;
			if (!data?.accessToken) {
				tokenStorage.remove();
				return false;
			}
			tokenStorage.set(data.accessToken);
			return true;
		} catch {
			return false;
		} finally {
			setTimeout(() => {
				refreshing = null;
			}, 0);
		}
	})();
	return refreshing;
}

const NO_REFRESH = /^\/auth\/(login|refresh|logout|register|verify-email|phone\/|2fa\/|reset-password|forgot-password|resend-verification)/;

/** fetch with the access token, cookies, and one silent refresh on 401. */
export async function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
	const go = () => {
		const headers = new Headers(init.headers);
		const token = tokenStorage.get();
		if (token) headers.set("Authorization", `Bearer ${token}`);
		return fetch(`${BASE_URL}${path}`, { ...init, headers, credentials: "include" });
	};
	let res = await go();
	if (res.status === 401 && !NO_REFRESH.test(path) && (await refreshSession())) {
		res = await go();
	}
	return res;
}

async function request(method: string, path: string, body?: JsonObject): Promise<JsonValue | undefined> {
	const res = await authFetch(path, {
		method,
		headers: { "Content-Type": "application/json" },
		body: body !== undefined ? JSON.stringify(body) : undefined,
	});

	if (!res.ok) {
		const data = await readJsonBody(res);
		const fallback = `Request failed with status ${res.status}`;
		const message = data !== undefined && data !== null ? (messageFromErrorJson(data) ?? fallback) : fallback;
		throw new ApiError(res.status, message, data);
	}

	return readJsonBody(res);
}

export const apiClient = {
	get: (path: string) => request("GET", path),
	post: (path: string, body?: JsonObject) => request("POST", path, body),
	put: (path: string, body: JsonObject) => request("PUT", path, body),
	patch: (path: string, body: JsonObject) => request("PATCH", path, body),
	delete: (path: string, body?: JsonObject) => request("DELETE", path, body),
	async postFormData(path: string, formData: FormData): Promise<JsonValue> {
		const res = await authFetch(path, { method: "POST", body: formData });
		if (!res.ok) {
			const data = await readJsonBody(res);
			const fallback = `Upload failed: ${res.status}`;
			const message = data !== undefined && data !== null ? (messageFromErrorJson(data) ?? fallback) : fallback;
			throw new ApiError(res.status, message, data);
		}
		const parsed = await readJsonBody(res);
		if (parsed === undefined || parsed === null) {
			throw new ApiError(res.status, "Empty response", null);
		}
		return parsed;
	},
};

export { BASE_URL };
