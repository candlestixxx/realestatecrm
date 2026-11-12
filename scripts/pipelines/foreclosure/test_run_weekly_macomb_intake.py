"""First tests for the weekly Macomb intake script.

Covers scripts/pipelines/foreclosure/run_weekly_macomb_intake.py — the
name/address/sale-amount parsing the Friday Lofty-sync run depends on.

Loading note: the module reads LOFTY_API_KEY from a hardcoded Windows
.env.local path at import time, so importing it directly fails outside
Lum's PC. These tests exec the module source with only that one line
stubbed out (API_KEY = 'test-only'); every function under test is the
real module code. If the import-time key load is ever moved behind a
guard, this loader can go back to a plain import.

Run:  python3 -m unittest discover -s scripts/pipelines/foreclosure -v
"""
import unittest
from pathlib import Path

_SRC = Path(__file__).resolve().parent / "run_weekly_macomb_intake.py"
_NS = {}
exec(
    compile(
        _SRC.read_text(encoding="utf-8").replace(
            "API_KEY = load_env_key()", "API_KEY = 'test-only'"
        ),
        str(_SRC),
        "exec",
    ),
    _NS,
)

first_last = _NS["first_last"]
split_address = _NS["split_address"]
normalize_address = _NS["normalize_address"]
digits_only = _NS["digits_only"]
parse_sale_amount_and_date = _NS["parse_sale_amount_and_date"]
stable_name = _NS["stable_name"]
make_address_note = _NS["make_address_note"]
make_notice_note = _NS["make_notice_note"]
LeadRecord = _NS["LeadRecord"]


class TestFirstLast(unittest.TestCase):
    def test_middle_initial(self):
        self.assertEqual(first_last("Jennifer C. Griffith"), ("Jennifer C.", "Griffith"))

    def test_first_named_party_only(self):
        self.assertEqual(first_last("Darius Hannah and John Smith"), ("Darius", "Hannah"))

    def test_ampersand_separator(self):
        # First party only: "John" alone is a single name, so it doubles.
        # (The shared last name "Doe" is lost here — same trade-off as the
        # " and " split; a joint-owner case would need a rethink.)
        self.assertEqual(first_last("John & Jane Doe"), ("John", "John"))

    def test_parenthetical_qualifier_removed(self):
        self.assertEqual(first_last("Jane Doe (single woman)"), ("Jane", "Doe"))

    def test_single_name_doubled(self):
        self.assertEqual(first_last("Madonna"), ("Madonna", "Madonna"))

    def test_empty_is_unknown(self):
        self.assertEqual(first_last(""), ("Unknown", "Unknown"))


class TestSplitAddress(unittest.TestCase):
    def test_standard_mi_address(self):
        self.assertEqual(
            split_address("8459 FRANCINE STREET, WARREN, MI 48093"),
            ("8459 FRANCINE STREET", "WARREN", "MI", "48093"),
        )

    def test_abbreviated_street_and_township(self):
        self.assertEqual(
            split_address("26015 Felicity Lndg., Harrison Twp, MI 48045"),
            ("26015 Felicity Lndg.", "Harrison Twp", "MI", "48045"),
        )

    def test_zip_plus_four(self):
        self.assertEqual(
            split_address("19850 Washington St, Roseville, MI 48066-7607"),
            ("19850 Washington St", "Roseville", "MI", "48066-7607"),
        )

    def test_spelled_out_state_falls_back_with_full_state_name(self):
        # "Michigan" is not a 2-letter code, so the strict pattern misses
        # and the fallback keeps "Michigan" as the state value.
        self.assertEqual(
            split_address("22290 Eastwood Avenue, Warren, Michigan 48089"),
            ("22290 Eastwood Avenue", "Warren", "Michigan", "48089"),
        )


class TestNormalizeAddress(unittest.TestCase):
    def test_lowercase_no_punctuation(self):
        self.assertEqual(
            normalize_address("123 Main St., Warren, MI 48089"),
            "123 main st warren mi 48089",
        )

    def test_empty(self):
        self.assertEqual(normalize_address(""), "")


class TestDigitsOnly(unittest.TestCase):
    def test_phone(self):
        self.assertEqual(digits_only("(586) 555-1234"), "5865551234")

    def test_none_safe(self):
        self.assertEqual(digits_only(None), "")


class TestParseSaleAmountAndDate(unittest.TestCase):
    def test_sale_date_extracted(self):
        sale_date, _ = parse_sale_amount_and_date(
            "Sale Date: November 20, 2026\nAmount Claimed Due: $123,456.78"
        )
        self.assertEqual(sale_date, "November 20, 2026")

    def test_plain_text_amount_extracted(self):
        # Fixed 2026-11-12: the amount pattern used to require a literal '*'
        # before the '$' (written for markdown-bold "**$123**" amounts), so
        # plain-text notices always yielded ''.
        _, amount = parse_sale_amount_and_date(
            "Sale Date: November 20, 2026\nAmount Claimed Due: $123,456.78"
        )
        self.assertEqual(amount, "$123,456.78")

    def test_markdown_bold_amount_extracted(self):
        _, amount = parse_sale_amount_and_date(
            "Sale Date: November 20, 2026\nAmount Claimed Due: **$123,456.78**"
        )
        self.assertEqual(amount, "$123,456.78")

    def test_no_sale_info(self):
        self.assertEqual(parse_sale_amount_and_date("no sale info here"), ("", ""))


class TestStableName(unittest.TestCase):
    def test_truncates_each_part_to_50_chars(self):
        fn, ln = stable_name("A" * 60 + " " + "B" * 60)
        self.assertEqual((fn, ln), ("A" * 50, "B" * 50))


class TestNoteBuilders(unittest.TestCase):
    def test_address_note(self):
        note = make_address_note("123 Main St, Warren, MI 48089", "1376406")
        self.assertIn("123 Main St, Warren, MI 48089", note)
        self.assertIn("1376406", note)

    def test_notice_note_carries_fields(self):
        rec = LeadRecord("1376406", "Darius Hannah", "22290 Eastwood Avenue, Warren, MI 48089", [])
        note = make_notice_note(rec, "FULL NOTICE TEXT", sale_date="November 20, 2026", amount_due="$1,234.56")
        for fragment in ("Darius Hannah", "22290 Eastwood Avenue", "November 20, 2026",
                         "$1,234.56", "1376406", "FULL NOTICE TEXT"):
            self.assertIn(fragment, note)


if __name__ == "__main__":
    unittest.main()
