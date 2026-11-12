"""Build the TSF Master Bundle: instructor guide + student workbook (PDF + DOCX).

TSF = Trust, Security & Future — by THE EXCEL LEGACY REALTY GROUP.
Teachable by any licensed realtor on the team: word-for-word openers,
timings, activities, worksheets, and compliance guardrails per module.
Run: python scripts/build-master-bundle.py  -> public/trust-docs/
"""
import pathlib
from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

OUT = pathlib.Path("public/trust-docs"); OUT.mkdir(parents=True, exist_ok=True)
NAVY, GOLD, DARK = RGBColor(0x1E, 0x3A, 0x8A), RGBColor(0xD4, 0xAF, 0x37), RGBColor(0x0F, 0x17, 0x2A)
GROUP = "THE EXCEL LEGACY REALTY GROUP"
PROGRAM = "Trust, Security & Future (TSF) Master Bundle"
DISCLAIMER = ("Education and document assembly only — not legal, tax, or financial advice. Realtors do not practice law. "
              "Every student is referred to a licensed attorney for review before signing, notarizing, or funding.")

MODULES = [
    ("Why Trusts Fail — The Funding Rule", "45 min",
     "Explain probate, revocable vs irrevocable, and why an unfunded trust controls nothing.",
     "Say: 'A trust is a bucket. Signing creates the bucket — funding puts your assets in it. An empty bucket protects nothing, and probate court decides instead of you.'",
     "Students list every asset they own on Workbook p.1 and mark Funded / Not Funded. Most discover 80% unfunded — that is the buying moment for help, not shame.",
     "Never promise probate avoidance for a specific estate; say 'a properly funded trust generally avoids probate for assets it holds.'"),
    ("Anatomy of the Declaration of Trust", "60 min",
     "Walk the Declaration clause by clause: trustee powers, beneficiaries totaling 100%, power of direction, successor and 20-year term rules.",
     "Say: 'This is the constitution of your trust. Percentages must total exactly 100 — we check the math together, out loud.'",
     "Students draft their beneficiary table in the Workbook and total it to 100% in class.",
     "Do not interpret ambiguous family situations; flag blended-family, minor, or special-needs cases for the attorney referral list."),
    ("Choosing Trustees Who Can Actually Serve", "45 min",
     "Initial, co-trustee and successor design; complete the Appointment & Acceptance document.",
     "Say: 'Pick the person who answers the phone, keeps records, and can say no. Love is not a qualification — reliability is.'",
     "Students name primary + successor trustees with full legal names and mailing addresses (Workbook p.3).",
     "Never serve as a student's trustee and never accept fiduciary appointment on the spot; disclose any relationship in writing."),
    ("Exhibit A — Funding With Real Assets", "60 min",
     "Schedule LLC/business interests, bank and brokerage accounts, vehicles, equipment and IP into Exhibit A.",
     "Say: 'If it is not on Exhibit A and retitled, it is not in the trust. We schedule it, assign it, then verify it — in that order.'",
     "Students complete their Exhibit A draft; realtors review for missing FEINs, entity numbers, and account last-4s.",
     "Do not retitle anything yourself; students sign assignments and banks/title companies execute transfers."),
    ("The Affidavit Banks Actually Accept", "45 min",
     "Certificate of trust authority, signing thresholds, tax ID/EIN, FinCEN CDD beneficial-ownership disclosures, third-party reliance.",
     "Say: 'Banks rarely read your whole trust. They rely on this sworn certificate — that is why it must match the Declaration exactly.'",
     "Students cross-check names, dates, and Tax ID across all three documents (Workbook consistency checklist).",
     "Never disclose a student's full trust schedules to a bank beyond what the Affidavit authorizes."),
    ("Execution Day — Signing & Notarization", "30 min",
     "Who signs what in what order, notary blocks, witnesses, and the errors that void a signing.",
     "Say: 'Nobody signs anything in this room today. Attorney review first, notary second — in that order, every time.'",
     "Run the mock signing-order drill with sample (watermarked) pages.",
     "Never notarize your own students' documents if you are a notary on the transaction; use an independent notary."),
    ("Your Home, Vehicles & Everything Else", "60 min",
     "Deeding a home (lender call-first, title insurance continuity), retitling vehicles without coverage gaps, retitle vs POD/TOD per account.",
     "Say: 'Your home is where our real-estate license earns its keep: deed, lender, insurance, and tax records must move together.'",
     "Students build their property funding plan with deed, lender, and insurer phone numbers (Workbook p.6).",
     "Deeds are prepared or reviewed by the attorney/title company; realtors coordinate, never draft deeds."),
    ("Keep It Funded For Life", "30 min",
     "The funding-checklist habit, annual 20-minute review, amendments, trustee removal, and when to call the team.",
     "Say: 'Every new asset gets a trust decision the week you buy it. Put the annual review on your calendar before you leave.'",
     "Students book their annual review date and take the one-page funding checklist for the fridge door.",
     "Close every class with the attorney/CPA referral reminder and the written disclaimer signed by the student."),
]

def cover(doc, title, subtitle):
    p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    try: p.add_run().add_picture("public/brand/excel-legacy-logo.png", width=Inches(1.5))
    except Exception: pass
    p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run(GROUP); r.font.size = Pt(18); r.bold = True; r.font.color.rgb = GOLD
    p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run(PROGRAM); r.font.size = Pt(13); r.bold = True; r.font.color.rgb = NAVY
    p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run(title); r.font.size = Pt(15); r.bold = True; r.font.color.rgb = DARK
    p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run(subtitle); r.font.size = Pt(10); r.italic = True
    p = doc.add_paragraph()
    r = p.add_run(DISCLAIMER); r.font.size = Pt(8); r.italic = True; r.font.color.rgb = NAVY

def guide():
    doc = Document(); cover(doc, "Instructor Master Guide", "Teach the full course with confidence — no law degree required, no improvisation needed.")
    doc.add_heading("How any Excel Legacy realtor teaches this course", level=1)
    doc.add_paragraph("You teach mechanics, checklists, and real-estate funding — never legal conclusions. Open every session with: "
                      "'I am a licensed Michigan realtor with the Excel Legacy Realty Team, not an attorney. We have helped Michigan families "
                      "organize and fund trusts alongside their home purchases and sales for years. Today I teach you the system; your attorney approves your documents.' "
                      "Room kit: printed workbooks, sample watermarked documents, funding checklists, attorney referral cards, calculators, pens. Total seat time: 6.5 hours (teach as 2 evenings or 1 Saturday).")
    for i, (title, dur, obj, script, act, guard) in enumerate(MODULES, 1):
        doc.add_heading(f"Module {i} — {title} ({dur})", level=1)
        doc.add_paragraph(f"Objective: {obj}")
        doc.add_paragraph(f"Instructor script — {script}")
        doc.add_paragraph(f"In-class activity: {act}")
        doc.add_paragraph(f"Compliance guardrail: {guard}")
    doc.add_heading("Closing & the offer (10 min)", level=1)
    doc.add_paragraph("Recap the funding rule, book annual reviews, then present the two paths without pressure: (1) take the kit home and self-assemble with attorney review, "
                      "or (2) Done-With-You Assembly where your Excel Legacy realtor/broker assembles all three documents and the funding plan with you. Collect evaluations and referrals: "
                      "'Who is the one person you love who owns a home and has no funded trust? Give us their name and we will send them the free Starter Kit with your compliments.'")
    doc.core_properties.title = f"{PROGRAM} — Instructor Guide — {GROUP}"
    doc.save(str(OUT / "tsf-master-bundle-instructor-guide.docx")); print("guide docx")

def workbook():
    doc = Document(); cover(doc, "Student Workbook", "Bring this to every session. You will leave with a funded-trust plan, not homework.")
    pages = [
        ("My Asset Inventory", "List every asset: home, LLC, bank/brokerage, vehicles, equipment, other. Mark Funded or Not Funded. Be brutally complete — what is missing here is missing from your trust."),
        ("My Beneficiary Table", "Full legal name | Relationship | Percentage. Total must equal 100%. Note successor beneficiaries for each share."),
        ("My Trustee Team", "Initial trustee(s) and successor trustee: full legal name, mailing address, phone. Confirm each person has agreed before class ends."),
        ("My Exhibit A Draft", "Entity legal name, state & filing ID, FEIN, % held | Institution, account title, type & last 4 | Other property with serial/ID numbers."),
        ("Consistency Checklist", "Trust name identical on all 3 documents? Dates match? Tax ID correct? Percentages total 100%? Trustees match the Appointment? Check each box with your instructor."),
        ("My Property Funding Plan", "Deed holder & title company | Lender name & phone (call first) | Insurer & phone | Vehicle titles & lienholders | Account retitle vs POD/TOD decisions."),
        ("My Annual Review", "Review date booked: __________  Assets bought this year: __________  Changes (births, deaths, sales, new LLC): __________  Attorney/CPA initials: __________"),
    ]
    for title, body in pages:
        doc.add_heading(title, level=1); doc.add_paragraph(body)
        for _ in range(6): doc.add_paragraph("________________________________________________________________________")
    doc.core_properties.title = f"{PROGRAM} — Student Workbook — {GROUP}"
    doc.save(str(OUT / "tsf-master-bundle-workbook.docx")); print("workbook docx")

if __name__ == "__main__":
    guide(); workbook()
