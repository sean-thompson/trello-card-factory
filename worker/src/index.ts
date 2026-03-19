interface Env {
	POWERUP_APP_KEY: string;
}

const SECURITY_HEADERS: HeadersInit = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, OPTIONS',
	'Access-Control-Allow-Headers': '*',
	'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
	'Content-Security-Policy': "default-src 'none'; img-src *; connect-src *",
	'X-Content-Type-Options': 'nosniff',
};

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		if (request.method === 'OPTIONS') {
			return new Response(null, { status: 204, headers: SECURITY_HEADERS });
		}

		if (request.method !== 'GET') {
			return new Response('Method not allowed', { status: 405, headers: SECURITY_HEADERS });
		}

		const { searchParams } = new URL(request.url);
		const url = searchParams.get('url');
		const token = searchParams.get('token');

		if (!url || !token) {
			return new Response('Missing url or token query parameter', { status: 400, headers: SECURITY_HEADERS });
		}

		let parsed: URL;
		try {
			parsed = new URL(url);
		} catch {
			return new Response('Invalid URL', { status: 400, headers: SECURITY_HEADERS });
		}

		if (parsed.hostname !== 'trello.com' && parsed.hostname !== 'api.trello.com') {
			return new Response('Only Trello URLs allowed', { status: 403, headers: SECURITY_HEADERS });
		}

		// Normalize to api.trello.com
		parsed.hostname = 'api.trello.com';

		try {
			// First request with auth — don't follow redirects so we can handle them
			const authResponse = await fetch(parsed.toString(), {
				headers: {
					Authorization: `OAuth oauth_consumer_key="${env.POWERUP_APP_KEY}", oauth_token="${token}"`,
				},
				redirect: 'manual',
			});

			// If redirect, follow it without auth header (S3/CDN doesn't need it)
			if (authResponse.status >= 300 && authResponse.status < 400) {
				const redirectUrl = authResponse.headers.get('Location');
				if (!redirectUrl) {
					return new Response('Redirect without location', { status: 502, headers: SECURITY_HEADERS });
				}
				const imageResponse = await fetch(redirectUrl);
				if (!imageResponse.ok) {
					return new Response(`Redirect target failed: ${imageResponse.status}`, { status: 502, headers: SECURITY_HEADERS });
				}
				return new Response(imageResponse.body, {
					status: 200,
					headers: {
						...SECURITY_HEADERS,
						'Content-Type': imageResponse.headers.get('Content-Type') || 'application/octet-stream',
						'Cache-Control': 'private, max-age=3600',
					},
				});
			}

			if (!authResponse.ok) {
				const body = await authResponse.text();
				return new Response(`Upstream failed: ${authResponse.status} - ${body}`, { status: 502, headers: SECURITY_HEADERS });
			}

			// Direct response (no redirect)
			return new Response(authResponse.body, {
				status: 200,
				headers: {
					...SECURITY_HEADERS,
					'Content-Type': authResponse.headers.get('Content-Type') || 'application/octet-stream',
					'Cache-Control': 'private, max-age=3600',
				},
			});
		} catch (err) {
			return new Response(`Proxy error: ${err}`, { status: 502, headers: SECURITY_HEADERS });
		}
	},
} satisfies ExportedHandler<Env>;
