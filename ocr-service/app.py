"""OCR microservice. See docs/03-ocr-receipt-capture.md.

PaddleOCR integration is deferred — /parse is a stub so the Express backend
has a real HTTP contract to call against while that feature is built out.
"""

from fastapi import FastAPI, UploadFile

app = FastAPI(title="JayJef OCR Service")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/parse")
async def parse_receipt(image: UploadFile):
    # TODO: run PaddleOCR on `image`, parse detected text into line items.
    contents = await image.read()
    return {
        "raw_text": "",
        "items": [],
        "note": f"OCR not yet implemented — received {len(contents)} bytes as a placeholder.",
    }
