# Synthea

An extensible Flask backend for the **Synthea** AI assistant. The service exposes a simple HTTP API that proxies requests to a LangChain agent equipped with real-world tools such as Tavily search, Alpha Vantage stock quotes, Apify web scraping, OpenAI image generation, Gmail e-mail delivery, and Calendly scheduling.

The repository only contains the backend runtime. It is intended to power a separate front-end client (for example a React single-page app) that communicates with the `/query` endpoint.

## Features

- 🌐 **Multi-tool AI agent** – Uses LangChain to orchestrate tool calls for web search, stock prices, web scraping, e-mail sending, Calendly invite creation, and DALL·E image generation.
- 🧠 **Session-aware conversations** – Maintains chat history per session key and applies a short-term rate limit (10 requests/minute) to prevent abuse.
- 🔌 **Pluggable design** – Tools are declared in `controllers/tools.py`, making it straightforward to add or remove integrations.
- 🩺 **Health check endpoint** – Lightweight `/health` route for uptime monitoring.

## Project layout

```
.
├── application.py         # Flask application entrypoint and HTTP routes
├── controllers/
│   ├── agent.py           # LangChain agent setup, session management, rate limiting
│   └── tools.py           # Tool definitions (Tavily, Alpha Vantage, Apify, DALL·E, Gmail, Calendly)
├── requirements.txt       # Python dependencies
└── README.md              # Project documentation
```

## Prerequisites

- Python 3.9 or newer
- A virtual environment tool such as `venv` or `conda`
- API credentials for any tools you plan to enable (see [Environment variables](#environment-variables))

## Getting started

1. **Clone and enter the repository**
   ```bash
   git clone <repository-url>
   cd Synthea
   ```

2. **Create and activate a virtual environment** (example with `venv`):
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

3. **Install backend dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables** (see below) in a `.env` file at the project root.

5. **Run the development server**
   ```bash
   python application.py
   ```
   The API will be available at `http://localhost:5000` by default. Set the `PORT` environment variable to override the port and `ENV=production` to disable Flask debug mode.

For production deployments you can serve the app with Gunicorn:
```bash
gunicorn -b 0.0.0.0:5000 application:app
```

## Environment variables

Create a `.env` file in the project root and add the variables required for the integrations you intend to use:

| Variable | Required for | Notes |
| --- | --- | --- |
| `OPENAI_API_KEY` | DALL·E image generation | Used by `langchain-openai` for both chat and image models.
| `TAVILY_API_KEY` | Tavily web search | Required by `TavilySearchResults`.
| `ALPHAVANTAGE_API_KEY` | Alpha Vantage stock quotes | Required by the Alpha Vantage wrapper.
| `APIFY_API_TOKEN` | Apify web scraping | Enables the `apify/rag-web-browser` actor.
| `GMAIL_MAIL` & `GMAIL_APP_PASSWORD` | Gmail SMTP e-mail sending | Use an app password for accounts with 2FA enabled.
| `CALENDLY_API_KEY` & `CALENDLY_EVENT_UUID` | Calendly scheduling links | `CALENDLY_EVENT_UUID` should reference the event type to expose.
| `ENV` | Flask runtime environment | Defaults to `develop`.
| `PORT` | HTTP port for Flask | Defaults to `5000`.

Only the variables relevant to the tools you use are required. Tools without credentials are skipped gracefully by the LangChain agent.

## API

### `GET /health`
Returns a simple JSON payload confirming the service is online.

```json
{"status": "healthy"}
```

### `POST /query`
Sends a user prompt to the LangChain agent. Provide a persistent `session_key` to maintain conversation context and rate limiting. Responses may include additional metadata (e.g., an `imageUrl` when the image generation tool is used).

**Request body**
```json
{
  "query": "What is the latest price of AAPL?",
  "session_key": "user-123"
}
```

**Successful response**
```json
{
  "reply": {
    "answer": "Apple Inc. (AAPL) is trading at $182.52 right now.",
    "tool": "stock_price_checker"
  },
  "session_key": "user-123"
}
```

Error responses include appropriate HTTP codes (for example, `400` when the `query` field is empty or rate limits are exceeded).

## Customising the agent

- Add, remove, or adjust tools in `controllers/tools.py`. Each tool is defined with a descriptive name, a callable, and a natural language description consumed by LangChain.
- Modify the system prompt in `controllers/agent.py` to adapt the assistant’s personality or formatting requirements.
- Tune the request rate limit by editing `AgentHandler.RATE_LIMIT`.

## Development tips

- The agent keeps session history in memory via `ChatMessageHistory`. Restart the process to clear all sessions.
- Background cleanup runs hourly and removes sessions that have been idle for more than five minutes.
- If you encounter SSL issues with SMTP, ensure that less secure app access is enabled or use an app-specific password for Gmail.

## Contributing

Issues and pull requests are welcome! Please include reproduction steps or sample payloads when reporting bugs or proposing new integrations.
