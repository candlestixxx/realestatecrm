"""First tests for the Legal News foreclosure import parser.

Covers scripts/pipelines/foreclosure/import_legalnews_foreclosures.py — the
pure parsing helpers that turn a raw Legal News notice into CRM records.
These were the riskiest untested code in the foreclosure workflow (0 tests
before this file).

Run:  python3 -m unittest discover -s scripts/pipelines/foreclosure -v
      (also wired into CI, .github/workflows/ci.yml, job `test-parser`)

Notes on known bugs documented here rather than hidden:
- extract_amount_due_text keeps the cents: fixed 2026-11-12 (the first
  pattern now matches the $ amount with optional cents explicitly
  instead of stopping at the first '.').
- split_name treats the pre-comma part as the FIRST name ("DOE, JOHN" ->
  first="Doe", last="John"). Whether Legal News names arrive as
  "LAST, FIRST" or "FIRST LAST" is unverified — the live endpoint returned
  0 foreclosures on 2026-11-12, so the format could not be confirmed. The
  test asserts current behaviour and this needs a live-notice check.
"""
import sqlite3
import sys
import unittest
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

sys.path.insert(0, str(Path(__file__).resolve().parent))

import import_legalnews_foreclosures as imp  # noqa: E402

EST = ZoneInfo("America/New_York")


def ms(year, month, day, hour=10, minute=0):
    return int(datetime(year, month, day, hour, minute, tzinfo=EST).timestamp() * 1000)


class TestSmartTitle(unittest.TestCase):
    def test_all_caps_title_cased(self):
        self.assertEqual(imp.smart_title("JOHN DOE"), "John Doe")

    def test_mixed_case_preserved(self):
        self.assertEqual(imp.smart_title("John Doe"), "John Doe")

    def test_empty_stays_empty(self):
        self.assertEqual(imp.smart_title(""), "")

    def test_whitespace_collapsed(self):
        self.assertEqual(imp.smart_title("  JOHN   DOE  "), "John Doe")


class TestSplitName(unittest.TestCase):
    def test_first_last(self):
        self.assertEqual(imp.split_name("John Doe"), ("John", "Doe"))

    def test_middle_names_stay_with_first(self):
        self.assertEqual(imp.split_name("John Michael Doe"), ("John Michael", "Doe"))

    def test_single_name_has_no_last(self):
        self.assertEqual(imp.split_name("Madonna"), ("Madonna", None))

    def test_empty_name(self):
        self.assertEqual(imp.split_name(""), ("", None))

    def test_comma_form_takes_pre_comma_as_first(self):
        # Current behaviour. If Legal News names are "LAST, FIRST" this
        # swaps them — verify against a live notice before relying on it.
        self.assertEqual(imp.split_name("DOE, JOHN"), ("Doe", "John"))


class TestExtractAmountDueText(unittest.TestCase):
    NOTICE = (
        "NOTICE OF FORECLOSURE SALE. Default having been made in the terms "
        "of a certain mortgage. Amount claimed to be due at the date hereof: "
        "$123,456.78 (plus interest). Sale date to be announced."
    )

    def test_keeps_cents(self):
        # Fixed 2026-11-12: the first pattern used to stop at the decimal
        # point, dropping the cents from the amount on the call task.
        self.assertEqual(
            imp.extract_amount_due_text(self.NOTICE), "$123,456.78 (plus interest)"
        )

    def test_amount_without_cents(self):
        self.assertEqual(
            imp.extract_amount_due_text(
                "Amount claimed to be due at the date hereof: $123,456 (plus interest)."
            ),
            "$123,456 (plus interest)",
        )

    def test_fallback_pattern_with_plain_amount(self):
        self.assertEqual(
            imp.extract_amount_due_text("The amount due is $45,000.00 as of today."),
            "amount due is $45,000.00",
        )

    def test_no_amount_returns_none(self):
        self.assertIsNone(imp.extract_amount_due_text("No money mentioned here."))


class TestExtractAttorneyPhone(unittest.TestCase):
    def test_telephone_label(self):
        self.assertEqual(
            imp.extract_attorney_phone("Attorney: Smith & Jones. Telephone: (586) 555-1234"),
            "(586) 555-1234",
        )

    def test_bare_phone(self):
        self.assertEqual(
            imp.extract_attorney_phone("Call 586-555-1234 for details"),
            "586-555-1234",
        )

    def test_no_phone_returns_none(self):
        self.assertIsNone(imp.extract_attorney_phone("No phone in this notice."))


class TestExtractDescriptionTail(unittest.TestCase):
    def test_strips_surrounding_whitespace_keeps_body(self):
        self.assertEqual(
            imp.extract_description_tail("  Full notice text here.  "),
            "Full notice text here.",
        )


class TestNextBusinessDay10am(unittest.TestCase):
    def test_friday_published_runs_monday(self):
        # Published Fri 2026-11-06 -> call task due Mon 2026-11-09 10:00 EST.
        self.assertEqual(imp.next_business_day_10am("2026-11-06T00:00:00Z"), ms(2026, 11, 9))

    def test_saturday_published_runs_monday(self):
        self.assertEqual(imp.next_business_day_10am("2026-11-07T00:00:00Z"), ms(2026, 11, 9))

    def test_sunday_published_runs_monday(self):
        self.assertEqual(imp.next_business_day_10am("2026-11-08T00:00:00Z"), ms(2026, 11, 9))

    def test_wednesday_published_runs_thursday(self):
        self.assertEqual(imp.next_business_day_10am("2026-11-04T00:00:00Z"), ms(2026, 11, 5))

    def test_plain_date_string(self):
        self.assertEqual(imp.next_business_day_10am("2026-11-06"), ms(2026, 11, 9))


class TestNewId(unittest.TestCase):
    def test_prefix_and_shape(self):
        nid = imp.new_id("ct")
        self.assertTrue(nid.startswith("ct_"))
        self.assertEqual(len(nid), 27)  # "ct_" + 24 hex chars

    def test_unique(self):
        self.assertNotEqual(imp.new_id("ld"), imp.new_id("ld"))


class TestActivityExists(unittest.TestCase):
    """Idempotency guard: a notice already imported must be skipped."""

    def setUp(self):
        self.conn = sqlite3.connect(":memory:")
        self.conn.execute("CREATE TABLE Activity (id TEXT, metadata TEXT)")
        self.conn.execute(
            "INSERT INTO Activity VALUES (?, ?)",
            ("act_1", '{"legalNewsNoticeId":123,"source":"Legal News"}'),
        )

    def tearDown(self):
        self.conn.close()

    def test_known_notice_exists(self):
        self.assertTrue(imp.activity_exists(self.conn, 123))

    def test_unknown_notice_does_not_exist(self):
        self.assertFalse(imp.activity_exists(self.conn, 999))


if __name__ == "__main__":
    unittest.main()
