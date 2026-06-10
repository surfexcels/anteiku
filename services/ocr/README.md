# Anteiku OCR service

Python service for supplier invoice extraction using:

- **pdfplumber** — text and tables from digital PDFs
- **pytesseract** + **pdf2image** — OCR for scanned PDFs
- **openpyxl** — Excel invoices
- **csv** — CSV invoices

## Prerequisites

1. Python 3.11+
2. [Tesseract OCR](https://github.com/tesseract-ocr/tesseract) installed and on your `PATH`
3. [Poppler](https://github.com/oschwartz10612/poppler-windows/releases) for `pdf2image` (add `bin` to `PATH` on Windows)

## Setup

```powershell
cd services/ocr
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Run

```powershell
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Set in your Next.js `.env`:

```env
OCR_SERVICE_URL=http://127.0.0.1:8000
```

## API

- `GET /health` — service status
- `POST /extract` — multipart file upload, returns `{ method, text, lineItems }`
