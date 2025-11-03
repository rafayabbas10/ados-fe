## Project Integration Guide: CreativeStrategist AI Agent

### Purpose
This guide shows how to integrate the AI Agent backend with a real frontend. It summarizes the request/response contract, streaming protocol, UI command schema, and minimal code to wire everything up.

---

## Prerequisites
- Backend running locally and reachable at `http://localhost:8000/api/v1` (adjust as needed)
- LLM credentials configured (see Environment)
- A frontend (React, Vue, vanilla, etc.) capable of handling fetch streaming

---

## Backend API

### Endpoint
- POST `POST /api/v1/chat`

### Request (JSON)
- `message` (string): user prompt or instruction
- `thread_id` (string): persistent thread identifier
- `session_id` (string): UI/session identifier (can match `thread_id`)
- Optional context for initialization flows:
  - `audit_ad_id` (string | number)
  - `ad_account_id` (string)
- Optional frontend selection context for targeted updates:
  - `frontend_context.selected_element` (string): one of `avatar | market_awareness | angle | format | theme | tonality`
  - `frontend_context.selected_blocks` (string[]): list of block ids
- `stream` (boolean): must be `true` to receive incremental SSE-like chunks

### Response (streaming over HTTP)
The response is a byte stream split into newline-delimited lines. Each data line begins with `data: ` followed by a JSON payload. The stream ends with `data: [DONE]`.

Event envelope (all events share this shape):
```json
{
  "type": "tool_call" | "ui_command" | "message" | "complete" | "error",
  "...": "event-specific fields"
}
```

#### Event: tool_call
Indicates backend tool execution lifecycle (useful for UX loading states).
```json
{
  "type": "tool_call",
  "tool": "get_all_ads_in_audit" | "regenerate_script" | "get_audit_summary" | "get_video_blocks" | "get_image_blocks" | "get_ad_details" | "store_element_options",
  "status": "started" | "completed",
  "message": "Optional human-friendly status"
}
```

#### Event: ui_command
Declarative UI mutations the frontend should apply immediately.
```json
{
  "type": "ui_command",
  "commands": [
    {
      "command": "INITIALIZE_BRIEF" | "SHOW_AD_MEDIA" | "SHOW_OPTIONS" | "UPDATE_ELEMENT" | "UPDATE_BLOCKS" | "SHOW_LOADING" | "HIGHLIGHT_ELEMENT" | "HIGHLIGHT_BLOCKS",
      "data": {}
    }
  ]
}
```

Common command payloads:
- `INITIALIZE_BRIEF.data` → `{ elements, script_builder }`
- `SHOW_AD_MEDIA.data` → `{ ad_type: 'video'|'image', ad_video_link?, ad_link?, ad_name }`
- `UPDATE_ELEMENT.data` → `{ element: 'angle', value: '...' }`
- `SHOW_LOADING.data` → `{ target: 'script_builder' | '<card-key>', updated_element?, message? }`
- `UPDATE_BLOCKS.data` → `{ blocks: [{ id: string, ...updatedFields }] }`
- `HIGHLIGHT_ELEMENT.data` → `{ element: '<element-key>' }`
- `HIGHLIGHT_BLOCKS.data` → `{ block_ids: string[] }`

#### Event: message
Incremental natural language text from the assistant.
```json
{ "type": "message", "content": "partial or full text" }
```

#### Event: complete
Signals the end of a single turn’s content emission (not the HTTP stream).
```json
{ "type": "complete", "followup_suggestions": ["..."] }
```

#### Event: error
Error notification to render in chat.
```json
{ "type": "error", "error": "message" }
```

---

## Frontend Integration

### Minimal streaming client
Use `fetch` with a reader to process `data: ` lines as they arrive.
```javascript
async function streamChat(apiBaseUrl, payload, onEvent) {
  const response = await fetch(`${apiBaseUrl}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    for (const line of chunk.split('\n')) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6);
      if (data === '[DONE]') return;
      try { onEvent(JSON.parse(data)); } catch (_) {}
    }
  }
}
```

### Initialize a brief (first load)
```javascript
await streamChat(API_BASE_URL, {
  message: `Initialize brief for ad ${AD_ID}`,
  thread_id: SESSION_ID,
  session_id: SESSION_ID,
  audit_ad_id: AD_ID,
  ad_account_id: AD_ACCOUNT_ID,
  stream: true
}, handleStreamEvent);
```

### Send a message with selection context
```javascript
const frontend_context = {};
if (selectedElement) frontend_context.selected_element = selectedElement; // e.g. 'angle'
if (selectedBlocks.length) frontend_context.selected_blocks = selectedBlocks; // ['block-1', ...]

await streamChat(API_BASE_URL, {
  message,
  thread_id: SESSION_ID,
  session_id: SESSION_ID,
  frontend_context,
  stream: true
}, handleStreamEvent);
```

### Event handler sketch
```javascript
function handleStreamEvent(event) {
  switch (event.type) {
    case 'tool_call':
      // show/hide spinners based on event.tool + event.status
      break;
    case 'ui_command':
      for (const cmd of event.commands) applyUiCommand(cmd);
      break;
    case 'message':
      // append assistant text to chat
      break;
    case 'complete':
      // turn finished; optionally show follow-up suggestions
      break;
    case 'error':
      // render error message
      break;
  }
}
```

---

## Selection Contract (Frontend → Backend)
- To target element updates, send `frontend_context.selected_element` with one of:
  - `avatar`, `market_awareness`, `angle`, `format`, `theme`, `tonality`
- To target scene/block updates, send `frontend_context.selected_blocks = [blockId, ...]`

The agent may respond with:
- `SHOW_LOADING` on `script_builder` and on the updated element
- `UPDATE_ELEMENT` reflecting the new element value
- `UPDATE_BLOCKS` with regenerated blocks (ids preserved; content updated)

---

## Script Regeneration (Backend summary)
- When an element update is selected, preprocessing sets `needs_script_regeneration = true`.
- A dedicated regeneration node uses LLM to rebuild all script blocks using all 6 elements.
- The frontend receives loading states, then `UPDATE_BLOCKS` to refresh the Script Builder table.

---

## Environment
Configure the LLM provider and credentials consumed by backend settings:
- `LLM_PROVIDER` (or settings equivalent): `openai` | `anthropic`
- If OpenAI:
  - `OPENAI_API_KEY`
  - `OPENAI_MODEL` (e.g., `gpt-4o-mini`)
- If Anthropic:
  - `ANTHROPIC_API_KEY`
  - `ANTHROPIC_MODEL` (e.g., `claude-3-5-sonnet-latest`)

Ensure these map to the backend’s `settings.llm_provider`, `settings.openai_api_key`, `settings.openai_model`, `settings.anthropic_api_key`, and `settings.anthropic_model`.

---

## Testing Checklist
- Can initialize the brief: UI cards appear for `elements` and `script_builder`.
- Selecting an element and sending a prompt triggers `SHOW_LOADING` and later `UPDATE_ELEMENT` + `UPDATE_BLOCKS`.
- Streaming shows `tool_call` events for long operations (e.g., `regenerate_script`).
- Blocks update in-place while preserving `id` and visual ordering by scene.

---

## Troubleshooting
- No stream data: verify `stream: true`, CORS, and that backend returns `data: ...` lines ending with `\n`.
- JSON parse issues: each `data:` line contains a complete JSON event; guard parsing per-line.
- Missing credentials: check provider keys and model names in environment.
- UI not updating: ensure you apply every `ui_command` received, not only chat `message` events.


