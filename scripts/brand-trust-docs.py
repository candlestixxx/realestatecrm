"""Brand the 3 Personal Property Trust templates for Excel Legacy Realty Group.

Reads the originals from ~/Downloads/Telegram Desktop, writes branded
DOCX + PDF to public/trust-docs/. Original legal text is preserved verbatim;
branding = cover page, header/footer, instructions, disclaimer.
Run: python scripts/brand-trust-docs.py
"""
import pathlib, shutil
from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.section import WD_SECTION
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

SRC = pathlib.Path.home() / "Downloads" / "Telegram Desktop"
OUT = pathlib.Path("public/trust-docs")
OUT.mkdir(parents=True, exist_ok=True)
NAVY = RGBColor(0x1E, 0x3A, 0x8A)
GOLD = RGBColor(0xD4, 0xAF, 0x37)
DARK = RGBColor(0x0F, 0x17, 0x2A)
BRAND = "EXCEL LEGACY REALTY GROUP"
TAGLINE = "Trust Services  |  Excel Legacy Realty Team"
DISCLAIMER = (
    "Educational template prepared by Excel Legacy Realty Group. This document is not legal advice "
    "and does not create an attorney-client relationship. Have a licensed attorney in your governing "
    "state review your completed documents before you sign, notarize, or fund anything."
)
DOCS = [
    ("Personal_Property_Trust_Declaration_Template.docx",
     "excel-legacy-declaration-of-trust.docx",
     "Declaration of Trust & Personal Property Trust Agreement",
     "The founding document: names the trustee, beneficiaries, powers of direction, and Exhibit A schedule of trust property."),
    ("Personal_Property_Trust_Appointment_of_Trustee_Template.docx",
     "excel-legacy-appointment-of-trustee.docx",
     "Appointment & Acceptance of Personal Property Trustee",
     "Appoints the initial and successor trustees and records their written acceptance of the fiduciary role."),
    ("Personal_Property_Trust_Affidavit_Certificate_Template.docx",
     "excel-legacy-affidavit-certificate-of-trust.docx",
     "Affidavit & Certificate of Personal Property Trust",
     "The counterparty-facing certificate banks and institutions rely on, with FinCEN CDD authority and notary block."),
]

def shade(paragraph, hex_color):
    pPr = paragraph._p.get_or_add_pPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:fill"), hex_color)
    shd.set(qn("w:val"), "clear")
    pPr.append(shd)

def brand_doc(src_name, out_name, title, blurb):
    doc = Document(str(SRC / src_name))
    # Header
    hdr = doc.sections[0].header.paragraphs[0]
    hdr.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = hdr.add_run(f"{BRAND}  —  {TAGLINE}")
    run.font.size = Pt(8); run.font.color.rgb = NAVY; run.bold = True
    # Footer
    ftr = doc.sections[0].footer.paragraphs[0]
    ftr.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = ftr.add_run("Excel Legacy Realty Group  •  Trust Services  •  Page ")
    run.font.size = Pt(8); run.font.color.rgb = DARK
    fld = OxmlElement("w:fldSimple"); fld.set(qn("w:instr"), "PAGE")
    ftr._p.append(fld)
    # Cover block inserted at top
    body = doc.element.body
    cover = []
    logo = doc.add_paragraph(); logo.alignment = WD_ALIGN_PARAGRAPH.CENTER
    try: logo.add_run().add_picture("public/brand/excel-legacy-logo.png", width=Inches(1.4))
    except Exception: pass
    cover.append(logo)
    p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER; shade(p, "0F172A")
    r = p.add_run(f"\n{BRAND}\n"); r.font.size = Pt(20); r.bold = True; r.font.color.rgb = GOLD
    cover.append(p)
    p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run("TRUST SERVICES  •  NEWLY REVISED EDITION"); r.font.size = Pt(9); r.bold = True; r.font.color.rgb = NAVY
    cover.append(p)
    p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run(title); r.font.size = Pt(16); r.bold = True; r.font.color.rgb = DARK
    cover.append(p)
    p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run(blurb); r.font.size = Pt(10); r.italic = True
    cover.append(p)
    p = doc.add_paragraph()
    r = p.add_run("How to use this document:  "); r.bold = True; r.font.size = Pt(10)
    r = p.add_run("Replace every [bracketed field], check one box per choice, total all beneficiary percentages to 100%, "
                  "sign only in front of a notary where a notary block appears, then fund the trust (Exhibit A) — an unfunded trust protects nothing.")
    r.font.size = Pt(10)
    cover.append(p)
    p = doc.add_paragraph()
    r = p.add_run(DISCLAIMER); r.font.size = Pt(8); r.italic = True; r.font.color.rgb = NAVY
    cover.append(p)
    # Move cover paragraphs before original content
    first = body[0]
    for p in cover:
        body.remove(p._p)
    for p in reversed(cover):
        first.addprevious(p._p)
    doc.core_properties.title = f"{title} — {BRAND}"
    doc.core_properties.author = BRAND
    doc.core_properties.subject = "Personal Property Trust — Newly Revised, Excel Legacy Realty Group"
    doc.save(str(OUT / out_name))
    print("DOCX:", out_name)

if __name__ == "__main__":
    for args in DOCS:
        brand_doc(*args)
    print("done ->", OUT)
