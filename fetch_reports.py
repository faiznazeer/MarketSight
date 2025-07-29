import os
import re
from edgar import set_identity, Company

# List of CIKs for well-known companies
COMPANIES = {
    'AAPL': '0000320193',
    'MSFT': '0000789019',
    'GOOG': '0001652044',
    'AMZN': '0001018724',
    'META': '0001326801',
    'TSLA': '0001318605',
    'NVDA': '0001045810',
    'BRK.A': '0001067983',
    'JPM': '0000019617',
    'V': '0001403161',
}

REPORTS_DIR = 'data/raw_reports'
EMAIL_IDENTITY = 'Mozilla/5.0 (compatible; fetch_reports/1.0)'  # Replace with your email for SEC compliance

os.makedirs(REPORTS_DIR, exist_ok=True)

# Set SEC identity (required by edgartools/SEC)
set_identity(EMAIL_IDENTITY)

# Which forms to fetch
FORM_TYPES = ['10-K', '8-K']

def remove_tables(markdown_text):
    """
    Remove tables from the markdown text.
    """
    pattern = r'^(?:.*\|.*\|.*\n?)+'
    return re.sub(pattern, '', markdown_text, flags=re.MULTILINE)

def remove_html_tags(text):
    """Removes all HTML tags from a string."""
    clean = re.compile('<[^>]+>')
    return re.sub(clean, '', text)

def save_filing_document(filing, ticker, form_type):
    """
    Save the main document of a filing (without tables) to disk.
    """
    markdown_text = filing.markdown()
    markdown_text = remove_tables(markdown_text)
    markdown_text = remove_html_tags(markdown_text)
    
    dest_file = os.path.join(REPORTS_DIR, f"{ticker}_{form_type}.md")
    with open(dest_file, 'w') as f:
        f.write(markdown_text)
    print(f"  Downloaded {form_type} for {ticker} to {dest_file}")

def main():
    for ticker, cik in COMPANIES.items():
        print(f"Processing {ticker}...")
        company = Company(cik)
        for form_type in FORM_TYPES:
            try:
                filings = company.get_filings(form=form_type)
                if not filings:
                    print(f"  No {form_type} found for {ticker}")
                    continue
                # Save the latest 10 filings (or fewer if less available)
                for filing in filings[:10]:
                    save_filing_document(filing, ticker, form_type)
            except Exception as e:
                print(f"  Error fetching {form_type} for {ticker}: {e}")

if __name__ == '__main__':
    main() 