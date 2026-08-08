# 03 — OCR Receipt Capture

## Feature

Instead of manually typing every line item from a supplier receipt when
restocking, staff can photograph the receipt. The image is sent to a local
PaddleOCR microservice, which extracts text; the backend parses that text
into candidate line items (product, quantity, price); a staff member reviews
and confirms/edits before anything is committed to inventory.

## Flow

```
1. Capture/upload
   Staff takes a photo (phone/tablet) or uploads an image of a supplier
   receipt through the frontend.
        │
        ▼
2. Send to OCR service
   Backend forwards the image to the Python + PaddleOCR microservice
   (local network call, not internet).
        │
        ▼
3. OCR extracts raw text
   PaddleOCR returns detected text blocks/lines (with positions/confidence).
        │
        ▼
4. Parse into structured line items
   Backend applies parsing rules (e.g. line pattern matching, product name
   fuzzy-matching against the existing catalog) to turn raw text into
   candidate rows: { raw_text, parsed_name, parsed_quantity, parsed_price,
   matched_product_id (best guess, nullable) }.
        │
        ▼
5. Review / confirmation screen  ◄── REQUIRED, never skipped
   Staff sees each candidate line item and can:
     - Confirm it as-is
     - Correct the matched product (search/select from catalog)
     - Correct quantity or price
     - Delete a line that isn't a real item (OCR noise)
     - Add a line manually if OCR missed an item
        │
        ▼
6. Commit
   On confirm, each accepted line item becomes a stock_movement with
   reason = "ocr_restock" (positive quantity change), and stock_quantity
   is updated per the shared movement code path (see 02).
   The ocr_receipt record is marked "confirmed".
```

## Why a Human Review Step Is Required

OCR is inherently imperfect — receipt photos vary in lighting, angle, print
quality, and handwriting. **No OCR result is ever applied to inventory
automatically.** The review screen is not optional UX polish; it is the
correctness boundary between "OCR guessed this" and "inventory changed."
This mirrors how a human would double-check a delivery against a packing
slip before shelving it.

## Where Images and OCR Results Are Stored

- **Receipt images**: stored on local disk (e.g. `ocr-service/storage/` or
  a shared backend-managed uploads directory on the LAN), referenced by file
  path from the `ocr_receipts.image_path` column — not stored as binary
  blobs in Postgres. This keeps the database lean and images easy to
  browse/back up directly as files.
- **Raw OCR output**: the raw text/JSON PaddleOCR returns is stored
  (`ocr_receipts.raw_ocr_json`) alongside the image, so a receipt can be
  re-parsed later if parsing rules improve, without re-running OCR.
- **Parsed line items**: stored in `ocr_receipt_items`, one row per
  candidate line, including whatever the staff member ultimately confirmed
  — so there's a record of both what OCR guessed and what a human approved.
- Since this system is local-network only, no cloud storage or CDN is
  needed; a scheduled local backup of the storage directory + database is
  the shop's responsibility (outside this doc's scope).

## Error Handling

| Situation | Handling |
|---|---|
| OCR service unreachable (network/process down) | Backend catches the failed request and returns a clear error to the frontend: "OCR service is offline — try again, or enter this receipt manually." The receipt image is still saved so the attempt isn't lost; staff can retry OCR later or fall back to manual entry. |
| Unreadable / low-quality image | PaddleOCR returns very low-confidence or empty text. Backend treats this the same as "no items detected" below, but the UI message hints at retaking the photo (better lighting/angle). |
| No items detected | Review screen still opens, but with zero pre-filled line items and a prominent "add item manually" action — the flow never dead-ends into a page with nothing the user can do. |
| Partial/garbled parse | Any line the parser isn't confident about is still shown, just with the fields left blank/lower-confidence rather than guessed wrong — better to make the staff type a value than to silently commit a wrong one. |
| Staff abandons the review screen without confirming | Receipt stays in `pending_review` status; no stock movement is created. It can be resumed later from a list of pending OCR receipts. |
