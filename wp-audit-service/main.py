import os

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from audit.crawler import run_audit
from audit.document_export import audit_to_document_builder_json
from audit.models import AuditRequest, AuditResponse

API_KEY = os.environ.get("AUDIT_API_KEY")  # same env-var-auth pattern as the rest of ByteFlow internal
ALLOWED_ORIGIN = os.environ.get("ALLOWED_ORIGIN", "https://byteflow.us")

app = FastAPI(title="ByteFlow Site Audit Service", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[ALLOWED_ORIGIN],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


def require_api_key(x_api_key: str = Header(default=None)):
    if API_KEY is None:
        # No key configured -> auth disabled (local dev only). Never leave unset in production.
        return
    if x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid or missing X-API-Key header")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/audit", response_model=AuditResponse, dependencies=[Depends(require_api_key)])
def audit(request: AuditRequest):
    return run_audit(request)


class DocumentExportRequest(AuditRequest):
    client_name: str = ""


@app.post("/audit/export/document-builder", dependencies=[Depends(require_api_key)])
def audit_export_document_builder(request: DocumentExportRequest):
    result = run_audit(request)  # re-run the audit fresh — this service is stateless, no caching layer
    return audit_to_document_builder_json(result, client_name=request.client_name)


class FromAuditExportRequest(BaseModel):
    audit: AuditResponse
    client_name: str = ""


@app.post("/export/from-audit", dependencies=[Depends(require_api_key)])
def export_from_audit(request: FromAuditExportRequest):
    """Convert an already-computed audit into Document Builder JSON WITHOUT
    re-crawling. Lets a caller that just ran /audit turn those exact results
    into a report (e.g. the ByteFlow internal frontend) without paying for a
    second crawl — important when the audit included the slow WCAG browser pass."""
    return audit_to_document_builder_json(request.audit, client_name=request.client_name)
