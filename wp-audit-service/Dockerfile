FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Phase 2 needs a real browser for axe-core (contrast/visibility/focus require a
# rendered DOM, which scrapling's HTTP-only fetchers can't produce). This is the
# one step that changes Phase 1's lean, no-browser image — expected and fine.
RUN playwright install --with-deps chromium

COPY audit ./audit
COPY main.py .

# axe-core is vendored INTO the image (never CDN-fetched at request time) so no
# audit depends on a third-party CDN being up. It ships in the repo at
# audit/vendor/axe.min.js (pinned to 4.10.3) and is brought in by the COPY above.
# To refresh/repin the version, see the README ("Updating the vendored axe-core").

# Bind the port from $PORT (Render assigns one, e.g. 10000) and default to 8000 for
# local/compose. Shell form so ${PORT} expands; exec so uvicorn stays PID 1.
ENV PORT=8000
EXPOSE 8000
CMD ["sh", "-c", "exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
