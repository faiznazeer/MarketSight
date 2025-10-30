import os
import re
import requests
from edgar import set_identity, Company
from dotenv import load_dotenv
import time
import boto3
from botocore.exceptions import NoCredentialsError, ClientError

load_dotenv()

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

# AWS S3 configuration
AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
AWS_REGION = os.getenv('AWS_REGION', 'ap-south-1')
S3_BUCKET = os.getenv('S3_BUCKET')  # Set your bucket name in env

s3_client = boto3.client(
    's3',
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=AWS_REGION
)

os.makedirs(REPORTS_DIR, exist_ok=True)

# Set SEC identity (required by edgartools/SEC)
set_identity(EMAIL_IDENTITY)

# Which forms to fetch
FORM_TYPES = ['10-K']

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")  # Replace with your Gemini API key
GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + GEMINI_API_KEY

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

def upload_to_s3(content, s3_key):
    try:
        s3_client.put_object(Bucket=S3_BUCKET, Key=s3_key, Body=content.encode('utf-8'))
        print(f"  Uploaded to S3: s3://{S3_BUCKET}/{s3_key}")
    except (NoCredentialsError, ClientError) as e:
        print(f"  Error uploading to S3: {e}")

def save_filing_document(filing, ticker, form_type):
    """
    Save the main document of a filing (without tables) to AWS S3.
    """
    print(f"  [save_filing_document] Processing {form_type} for {ticker}...")
    markdown_text = filing.markdown()
    markdown_text = remove_tables(markdown_text)
    markdown_text = remove_html_tags(markdown_text)
    s3_key = f"{ticker}_{form_type}_{filing.accession_number}.md"
    upload_to_s3(markdown_text, s3_key)

def save_filing_tables(filing, ticker, form_type):
    """
    Save the tables of a filing to AWS S3 as markdown tables using Google Gemini API.
    """
    for key, value in filing.statements.detected_statements.items():
        statement_name = key.value
        if statement_name == 'balance':
            statement_name += '_sheet'
        else:
            statement_name += '_statement'
        table = eval(f"filing.statements.{statement_name}")
        if table is not None:
            print(f"    [save_filing_tables] Processing table {statement_name}...")
            table_text = table.text()
            # Prepare prompt for Gemini
            prompt = (
                "Convert the following table to a markdown table. "
                "Do not add any extra words, just output the markdown table.\n\n"
                f"{table_text}"
            )
            try:
                print(f"      [save_filing_tables] Sending {statement_name} to Gemini API...")
                response = requests.post(
                    GEMINI_API_URL,
                    json={
                        "contents": [{"parts": [{"text": prompt}]}]
                    },
                    timeout=120
                )
                response.raise_for_status()
                data = response.json()
                # Extract markdown from Gemini response
                markdown_table = None
                # Gemini's response format: data['candidates'][0]['content']['parts'][0]['text']
                candidates = data.get('candidates', [])
                if candidates:
                    parts = candidates[0].get('content', {}).get('parts', [])
                    if parts:
                        markdown_table = parts[0].get('text', '').strip()
                if not markdown_table:
                    print(f"  Gemini API did not return a markdown table for {ticker} {form_type} {statement_name}")
                    continue
                s3_key = f"{ticker}_{form_type}_{filing.accession_number}_{statement_name}.md"
                upload_to_s3(markdown_table, s3_key)
                # Add delay to avoid rate limiting
                time.sleep(2)
            except Exception as e:
                print(f"  Error converting table to markdown for {ticker} {form_type} {statement_name}: {e}")

def main():
    for ticker, cik in COMPANIES.items():
        print(f"Processing {ticker}...")
        company = Company(cik)
        for form_type in FORM_TYPES:
            try:
                print("Getting filings")
                filings = company.get_filings(form=form_type)
                print("Got filings")
                if not filings:
                    print(f"  No {form_type} found for {ticker}")
                    continue
                # Save the latest 10 filings (or fewer if less available)
                for index in range(10):
                    filing = filings[index]
                    save_filing_document(filing, ticker, form_type)
                    save_filing_tables(filing, ticker, form_type)
            except Exception as e:
                print(f"  Error fetching {form_type} for {ticker}: {e}")

if __name__ == '__main__':
    main() 