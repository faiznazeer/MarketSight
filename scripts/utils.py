import os
import boto3
import sys
from botocore.exceptions import NoCredentialsError, ClientError
from langchain_text_splitters import MarkdownHeaderTextSplitter
from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams

load_dotenv()

# AWS S3 configuration
AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
AWS_REGION = os.getenv('AWS_REGION', 'ap-south-1')
S3_BUCKET = os.getenv('S3_BUCKET')

s3_client = boto3.client(
    's3',
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=AWS_REGION
)

# Qdrant configuration
QDRANT_URL = os.getenv('QDRANT_URL', 'http://localhost:6333')
QDRANT_API_KEY = os.getenv('QDRANT_API_KEY')
COLLECTION_NAME = 'market_insights'

def get_markdown_files_from_s3():
    """
    Retrieve all markdown files from S3 bucket.
    """
    try:
        response = s3_client.list_objects_v2(Bucket=S3_BUCKET, Prefix='')
        markdown_files = []
        
        if 'Contents' in response:
            for obj in response['Contents']:
                if obj['Key'].endswith('.md'):
                    markdown_files.append(obj['Key'])
        
        return markdown_files
    except (NoCredentialsError, ClientError) as e:
        print(f"Error listing S3 objects: {e}")
        return []

def read_file_from_s3(s3_key):
    """
    Read a markdown file from S3.
    """
    try:
        response = s3_client.get_object(Bucket=S3_BUCKET, Key=s3_key)
        content = response['Body'].read().decode('utf-8')
        return content
    except (NoCredentialsError, ClientError) as e:
        print(f"Error reading {s3_key} from S3: {e}")
        return None

def setup_markdown_splitter():
    """
    Configure markdown-aware text splitter with appropriate separators.
    """
    headers_to_split_on = [
        ("#", "Header 1"),
        ("##", "Header 2"), 
        ("###", "Header 3"),
        ("####", "Header 4"),
        ("#####", "Header 5"),
        ("######", "Header 6"),
    ]
    
    markdown_splitter = MarkdownHeaderTextSplitter(
        headers_to_split_on=headers_to_split_on,
        strip_headers=False
    )
    
    return markdown_splitter

def setup_qdrant_collection(qdrant_client):
    """
    Set up Qdrant collection for storing embeddings.
    """
    try:
        # Check if collection exists
        collections = qdrant_client.get_collections()
        collection_names = [col.name for col in collections.collections]
        
        if COLLECTION_NAME not in collection_names:
            print(f"Creating Qdrant collection: {COLLECTION_NAME}")
            qdrant_client.create_collection(
                collection_name=COLLECTION_NAME,
                vectors_config=VectorParams(
                    size=384,  # all-MiniLM-L6-v2 produces 384-dimensional vectors
                    distance=Distance.COSINE
                )
            )
            print(f"Collection {COLLECTION_NAME} created successfully")
        else:
            print(f"Collection {COLLECTION_NAME} already exists")
            
    except Exception as e:
        print(f"Error setting up Qdrant collection: {e}")
        raise

def estimate_point_size(point):
    """
    Estimate the serialized size of a point in bytes.
    """
    # UUID (36 chars) + vector (384 floats * 8 bytes) + payload content
    base_size = 36 + 384 * 8
    payload_size = sys.getsizeof(str(point.payload))
    return base_size + payload_size

def calculate_optimal_batch_size(sample_points, max_payload_bytes=30 * 1024 * 1024):  # 30MB safety margin
    """
    Calculate optimal batch size based on estimated payload sizes.
    """
    if not sample_points:
        return 50
    
    # Estimate size of a few sample points
    sample_size = min(5, len(sample_points))
    total_size = sum(estimate_point_size(point) for point in sample_points[:sample_size])
    avg_point_size = total_size / sample_size
    
    # Calculate batch size with safety margin
    optimal_batch_size = int(max_payload_bytes / avg_point_size)
    return max(10, min(optimal_batch_size, 500))  # Between 10 and 500