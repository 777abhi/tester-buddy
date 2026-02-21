/**
 * Redacts sensitive information from a URL string, specifically query parameters
 * that might contain tokens, passwords, or PII.
 */
export function redactUrl(urlStr: string): string {
  try {
    const url = new URL(urlStr);
    const sensitiveParams = [
      'token', 'access_token', 'refresh_token', 'auth', 'authorization',
      'password', 'secret', 'key', 'apikey', 'api_key', 'id_token',
      'email', 'phone', 'ssn', 'username', 'code', 'session_id', 'sid'
    ];

    let changed = false;
    url.searchParams.forEach((_value, key) => {
      const lowerKey = key.toLowerCase();
      if (sensitiveParams.some(param => lowerKey.includes(param))) {
        url.searchParams.set(key, 'REDACTED');
        changed = true;
      }
    });

    // We return the original string if no changes were made to avoid
    // any potential side effects of URL parsing/stringifying (e.g. encoding changes)
    return changed ? url.toString() : urlStr;
  } catch (e) {
    // If the URL is invalid, return as is.
    return urlStr;
  }
}
