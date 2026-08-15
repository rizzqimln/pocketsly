"""
Receipt OCR parser (receipt_ocr.py)
===================================
Extracts merchant, total amount, date and category from receipt images
using Tesseract OCR plus lightweight heuristics.
"""

import re

# keyword map: merchant + category inference applied to OCR'd text
MERCHANT_MAP = [
    (["starbucks", "coffee", "cafe"], "Starbucks Coffee", "Coffee & Snacks"),
    (["indomaret", "alfamart", "alfamidi", "mart"], "Indomaret Point", "Food & Dining"),
    (["mcdonald", "mcd", "kfc", "burger", "fried chicken"], "Fast Food Restaurant", "Food & Dining"),
    (["grab", "gojek", "go ride", "uber", "taxi", "fuel", "shell", "pertamina", "bensin"], "Transport", "Transportation"),
    (["gramedia", "bookstore", "books", "stationery", "print"], "Bookstore", "Books & Study"),
    (["pln", "wifi", "indihome", "internet", "bill", "token"], "IndiHome / Utility Bill", "Bills & Wifi"),
    (["apotek", "pharma", "kimia farma", "doctor", "clinic", "rs "], "Pharmacy / Clinic", "Health & Medical"),
    (["rent", "kos", "sewa", "kontrakan"], "Housing Rent", "Housing / Rent"),
    (["cinema", "cinemax", "xxi", "game", "concert", "movie"], "Entertainment", "Entertainment"),
]

TOTAL_KEYWORDS = ["total", "jumlah", "bayar", "amount", "grand", "total bayar", "total pembayaran"]


def _clean_amount(raw):
    """Normalize OCR'd amount strings into a float."""
    if not raw:
        return None
    # strip currency symbols / separators, keep digits, dot, comma, minus
    cleaned = re.sub(r"[^\d.,\-]", "", raw)
    if not re.search(r"\d", cleaned):
        return None
    # thousands separators: "47.500" or "1.250.000" (3 digits after dot) => remove dots
    if re.search(r"\.\d{3}(\.\d{3})*$", cleaned) and not re.search(r"\.\d{1,2}$", cleaned):
        cleaned = cleaned.replace(".", "")
    cleaned = cleaned.replace(",", "")
    try:
        return float(cleaned)
    except ValueError:
        return None


def extract_receipt(text):
    """Parse OCR text into {merchant, amount, date, category}."""
    today = re.match(r"(\d{4})-(\d{2})-(\d{2})", __import__("datetime").date.today().isoformat())
    result = {"merchant": "Store Receipt", "amount": None, "date": today.group(0), "category": "Food & Dining"}
    lower = text.lower()

    # merchant / category from keyword map
    for keywords, merchant, category in MERCHANT_MAP:
        if any(k in lower for k in keywords):
            result["merchant"] = merchant
            result["category"] = category
            break

    # merchant fallback: first non-empty, non-numeric line (max 32 chars)
    if result["merchant"] == "Store Receipt":
        for line in text.splitlines():
            line = line.strip()
            if line and not re.search(r"\d", line) and len(line) <= 40:
                result["merchant"] = line.title()
                break

    # date: dd/mm/yyyy, yyyy-mm-dd, dd-mm-yy
    date_match = re.search(r"(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4})", text)
    if date_match:
        raw = date_match.group(1)
        parts = re.split(r"[/\-. ]", raw)
        if len(parts) == 3:
            if len(parts[2]) == 2:
                parts[2] = "20" + parts[2]
            try:
                result["date"] = f"{parts[2]}-{parts[1].zfill(2)}-{parts[0].zfill(2)}"
            except Exception:
                pass

    # total amount: line containing a total keyword
    for line in text.splitlines():
        if any(k in line.lower() for k in TOTAL_KEYWORDS):
            amount = _clean_amount(line)
            if amount is not None and amount > 0:
                result["amount"] = int(amount)
                break

    # fallback: largest number near the bottom (last third of text)
    if result["amount"] is None:
        lines = [l for l in text.splitlines() if l.strip()]
        bottom = lines[max(0, len(lines) - len(lines) // 3):] or lines
        best = None
        for line in bottom:
            amount = _clean_amount(line)
            if amount is not None and (best is None or amount > best):
                best = amount
        if best is not None:
            result["amount"] = int(best)

    return result


def ocr_image(image_bytes):
    """Run Tesseract OCR on raw image bytes and return structured receipt data."""
    import pytesseract
    from PIL import Image
    import io

    image = Image.open(io.BytesIO(image_bytes)).convert("L")
    text = pytesseract.image_to_string(image)
    data = extract_receipt(text)
    data["raw_text"] = text.strip()
    return data