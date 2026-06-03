# Node Creation

Use this guide when building or changing the n8n workflow graph. It captures reusable workflow-design rules, not project-specific behavior.

## Prefer Explicit Data References

When a node needs data produced by another named node, reference that node directly.

Use explicit references for cross-node contracts:

```javascript
$('Prepare Run Context').first().json.projectId
$('Build Request Items').all()
```

Use `$input` only when the current node's direct input is the contract:

```javascript
const items = $input.all();
```

Avoid relying on "the previous node" when the data matters beyond a simple pass-through. Explicit references make the graph easier to rearrange, review, and debug.

## Keep Loops Sequential

n8n loop nodes do not handle nested loop designs reliably. Build loop-heavy workflows as sequential phases.

Preferred shape:

```text
Prepare A Items
-> Loop Over A
-> A Loop Complete
-> Prepare B Items
-> Loop Over B
-> Final Result
```

Avoid placing a loop inside another active loop. If phase B depends on phase A, finish phase A first, store the phase result as item JSON, then start phase B from a clearly named completion node.

## Prefer HTTP Request Nodes For APIs

For external APIs, prefer `HTTP Request` nodes with n8n predefined credentials over app-specific action nodes when the workflow needs inspectable HTTP behavior.

Use predefined credentials when available:

```json
{
  "authentication": "predefinedCredentialType",
  "nodeCredentialType": "exampleOAuth2Api"
}
```

This lets n8n manage OAuth or API authentication while the workflow still controls URL construction, request bodies, response parsing, status handling, and rate-limit handling.

App-specific nodes are acceptable for simple one-off actions, but they often hide response headers, status codes, pagination, or retry behavior. Do not use them for API paths that need durable error handling or rate-limit control.

## Use Full HTTP Responses For Retryable Calls

For API calls that can rate-limit or fail transiently, configure the HTTP node so downstream nodes can inspect the response:

- return the full response
- do not throw automatically on non-2xx responses
- keep response headers available
- route errors explicitly after the HTTP node

The graph should separate transport handling from normal response parsing:

```text
HTTP Request
-> IF Retryable Response
   true -> Calculate Retry Wait -> Wait -> same HTTP Request
   false -> Normalize Successful Response
```

Treat these as retryable by default:

- `429` rate-limit responses
- transient `5xx` responses

Do not send retryable responses into normal parsing nodes. Route them first, then parse only the non-retry path.

## Header-Based Rate Limiting

For APIs that publish rate-limit headers, calculate the wait from the response headers before retrying.

Typical wait logic:

```javascript
function headerValue(headers, key) {
	const wanted = key.toLowerCase();
	for (const [header, value] of Object.entries(headers || {})) {
		if (String(header).toLowerCase() === wanted) return value;
	}
	return '';
}

function retryWaitSeconds(statusCode, headers) {
	if (statusCode >= 500) return 5;

	const resetRaw = Number(headerValue(headers, 'x-ratelimit-reset'));
	if (!Number.isFinite(resetRaw) || resetRaw <= 0) return 65;

	const resetMs = resetRaw < 100000000000 ? resetRaw * 1000 : resetRaw;
	return Math.max(1, Math.ceil((resetMs - Date.now()) / 1000) + 2);
}
```

Store the calculated wait on the item JSON, then let the Wait node use it:

```javascript
{{ $json.rateLimitWaitSeconds || 65 }}
```

Keep rate-limit metadata on the item when it helps debugging:

```javascript
{
	rateLimitWaitSeconds,
	rateLimit: {
		operation: 'create_record',
		statusCode,
		limit,
		remaining,
		reset
	}
}
```

## Preserve Context Around HTTP Nodes

HTTP nodes often replace the current item JSON with the HTTP response. If later nodes need the original item, preserve that context before the HTTP call or recover it from a named node.

Use a small pass-through Code node when needed:

```javascript
return $input.all();
```

Then, after the HTTP node, combine the response with the original item by explicitly reading the named context node.

## Error Handling

Design errors as graph behavior, not hidden side effects.

- Validate inputs before side-effecting API calls.
- Route retryable HTTP responses before normal parsing.
- Throw clear errors for permanent failures.
- Include useful context such as operation name, status code, record identifier, or source row.
- Avoid broad `continueOnFail` behavior unless a later node explicitly classifies and handles the failure.
- Keep test-only behavior separate from production workflow behavior.

## Naming

Name nodes by responsibility, not implementation detail.

Good examples:

- `Prepare Invoice Loop Items`
- `Loop Over Invoices`
- `Search Customer In API`
- `IF Customer Search Rate Limited`
- `Calculate Customer Search Retry Wait`
- `Wait Before Retrying Customer Search`
- `Normalize Customer Search Result`

Clear names make explicit node references readable and keep exported workflow diffs understandable.
