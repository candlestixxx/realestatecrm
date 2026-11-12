"""Render branded PDFs of the 3 trust docs from the extracted original text.

Reads public/trust-docs/*.docx (single source of truth = branded DOCX),
writes matching .pdf files with Excel Legacy cover, header/footer.
Run after brand-trust-docs.py:  python scripts/brand-trust-pdfs.py
"""
import pathlib
from docx import Document
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
                                TableStyle, PageBreak)
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY

OUT = pathlib.Path("public/trust-docs")
NAVY, GOLD, DARK = HexColor("#1e3a8a"), HexColor("#d4af37"), HexColor("#0f172a")
BRAND = "EXCEL LEGACY REALTY GROUP"
DISCLAIMER = ("Educational template prepared by Excel Legacy Realty Group. Not legal advice; "
              "no attorney-client relationship is created. Have a licensed attorney in your "
              "governing state review completed documents before signing or funding.")
TITLES = {
    "excel-legacy-declaration-of-trust": "Declaration of Trust & Personal Property Trust Agreement",
    "excel-legacy-appointment-of-trustee": "Appointment & Acceptance of Personal Property Trustee",
    "excel-legacy-affidavit-certificate-of-trust": "Affidavit & Certificate of Personal Property Trust",
}
styles = {
    "cover": ParagraphStyle("cover", fontName="Helvetica-Bold", fontSize=20, leading=24, textColor=GOLD, alignment=TA_CENTER),
    "title": ParagraphStyle("title", fontName="Helvetica-Bold", fontSize=15, leading=19, textColor=DARK, alignment=TA_CENTER, spaceAfter=10),
    "body": ParagraphStyle("body", fontName="Helvetica", fontSize=9.5, leading=13.5, alignment=TA_JUSTIFY, spaceAfter=6),
    "small": ParagraphStyle("small", fontName="Helvetica-Oblique", fontSize=7.5, leading=10, textColor=NAVY, alignment=TA_CENTER),
    "cell": ParagraphStyle("cell", fontName="Helvetica", fontSize=8.5, leading=11),
}

def header_footer(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(NAVY); canvas.setFont("Helvetica-Bold", 7)
    canvas.drawCentredString(LETTER[0] / 2, LETTER[1] - 0.5 * inch, f"{BRAND}  —  Trust Services")
    canvas.setFillColor(DARK); canvas.setFont("Helvetica", 7)
    canvas.drawCentredString(LETTER[0] / 2, 0.5 * inch, f"Excel Legacy Realty Group  •  Trust Services  •  Page {doc.page}")
    canvas.restoreState()

def build(docx_path):
    stem = docx_path.stem
    doc = Document(str(docx_path))
    story = [Spacer(1, 1.2 * inch),
             Paragraph(BRAND, styles["cover"]),
             Paragraph("TRUST SERVICES &nbsp;•&nbsp; NEWLY REVISED EDITION", styles["small"]),
             Spacer(1, 0.25 * inch),
             Paragraph(TITLES.get(stem, stem), styles["title"]),
             Paragraph(DISCLAIMER, styles["small"]), Spacer(1, 0.3 * inch), PageBreak()]
    # Skip the 5 cover paragraphs added to the DOCX; render the legal body.
    paras = [p.text.strip() for p in doc.paragraphs][5:]
    for text in paras:
        if text:
            story.append(Paragraph(text.replace("&", "&amp;"), styles["body"]))
    for table in doc.tables:
        rows = [[Paragraph((c.text.strip() or "&nbsp;").replace("&", "&amp;"), styles["cell"]) for c in row.cells] for row in table.rows]
        t = Table(rows, colWidths=[3.25 * inch, 3.25 * inch])
        t.setStyle(TableStyle([("LINEABOVE", (0, 0), (-1, 0), 0.5, DARK), ("TOPPADDING", (0, 0), (-1, -1), 8)]))
        story.append(t); story.append(Spacer(1, 0.15 * inch))
    pdf = OUT / f"{stem}.pdf"
    SimpleDocTemplate(str(pdf), pagesize=LETTER, topMargin=0.8 * inch, bottomMargin=0.8 * inch,
                      leftMargin=inch, rightMargin=inch, title=TITLES.get(stem, stem), author=BRAND).build(
        story, onFirstPage=header_footer, onLaterPages=header_footer)
    print("PDF:", pdf.name, f"{pdf.stat().st_size // 1024} KB")

if __name__ == "__main__":
    for f in sorted(OUT.glob("*.docx")):
        build(f)
