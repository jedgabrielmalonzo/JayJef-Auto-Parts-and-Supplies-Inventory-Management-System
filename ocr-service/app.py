"""OCR microservice. See docs/03-ocr-receipt-capture.md.

Runs PaddleOCR on an uploaded receipt image and returns the detected text
lines. Parsing that raw text into structured line items (product name,
quantity, price) and matching against the product catalog is the Express
backend's job (backend/src/services/ocrParser.js) — this service only does
OCR, nothing more.
"""

import tempfile
from pathlib import Path

from fastapi import FastAPI, UploadFile
from paddleocr import PaddleOCR

app = FastAPI(title="JayJef OCR Service")

# ponytail: enable_mkldnn=False — this paddlepaddle/Windows CPU combo
# crashes (ConvertPirAttribute2RuntimeAttribute) with the default oneDNN
# backend; revisit (and re-enable for speed) once a paddlepaddle release
# fixes it. Doc/orientation/unwarp classifiers are off since receipt photos
# are simple upright photos, not scanned documents.
_ocr = PaddleOCR(
    lang="en",
    use_doc_orientation_classify=False,
    use_doc_unwarping=False,
    use_textline_orientation=False,
    enable_mkldnn=False,
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/parse")
async def parse_receipt(image: UploadFile):
    contents = await image.read()
    suffix = Path(image.filename or "").suffix or ".jpg"

    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(contents)
        tmp_path = tmp.name

    try:
        result = _ocr.predict(tmp_path)
        lines = list(result[0]["rec_texts"]) if result else []
    finally:
        Path(tmp_path).unlink(missing_ok=True)

    return {"raw_text": "\n".join(lines), "items": [], "note": None}
