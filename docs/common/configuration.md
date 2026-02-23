# Configuration (`buddy.config.json`)

You can pre-define mocked network responses, user roles, and seeding configurations in `buddy.config.json`.

```json
{
  "roles": {
    "admin": {
      "cookies": [{ "name": "session", "value": "..." }],
      "localStorage": { "theme": "dark" }
    }
  },
  "mocks": [
    {
      "urlPattern": "**/api/data",
      "method": "GET",
      "response": { "status": 200, "body": { "id": 1 } }
    }
  ],
  "seeding": {
    "url": "http://localhost:3000/api/seed",
    "method": "POST",
    "headers": { "Authorization": "Bearer super-secret" }
  }
}
```
