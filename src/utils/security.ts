/**
 * Safely parses a JSON string representing localStorage data.
 * Validates that the result is a flat object with string keys and string values.
 * Strips dangerous keys like __proto__ and constructor.
 */
export function safeParseLocalStorage(data: string): Record<string, string> | null {
  try {
    const parsed = JSON.parse(data);

    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }

    const validated: Record<string, string> = {};

    for (const [key, value] of Object.entries(parsed)) {
      // Security: Skip dangerous keys that could be used for prototype pollution
      if (key === '__proto__' || key === 'constructor') {
        continue;
      }

      // Validation: Ensure values are strings (localStorage should only contain strings)
      if (typeof value === 'string') {
        validated[key] = value;
      } else {
        // Option 1: Convert to string
        // validated[key] = String(value);
        // Option 2: Skip (Safer, since we expect strings)
        // Let's go with Option 1 for better compatibility but ensure it's not a complex object
        if (typeof value === 'number' || typeof value === 'boolean') {
          validated[key] = String(value);
        }
      }
    }

    return validated;
  } catch (e) {
    return null;
  }
}
