import os
from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct
from sentence_transformers import SentenceTransformer
import uuid
from utils import (
    get_markdown_files_from_s3,
    read_file_from_s3,
    setup_markdown_splitter,
    setup_qdrant_collection,
    estimate_point_size,
    calculate_optimal_batch_size,
    COLLECTION_NAME
)

load_dotenv()

# Qdrant configuration
QDRANT_URL = os.getenv('QDRANT_URL', 'http://localhost:6333')
QDRANT_API_KEY = os.getenv('QDRANT_API_KEY')

# Initialize Qdrant client
qdrant_client = QdrantClient(
    url=QDRANT_URL,
    api_key=QDRANT_API_KEY
)

# Initialize embedding model
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')


def embed_and_store_chunks(chunks):
    """
    Generate embeddings for chunks and store them in Qdrant with adaptive batch processing.
    """
    if not chunks:
        print("No chunks to embed")
        return
    
    print(f"Generating embeddings for {len(chunks)} chunks...")
    
    points = []
    for chunk in chunks:
        try:
            # Generate embedding
            embedding = embedding_model.encode(chunk['content'])
            
            # Create point for Qdrant
            point = PointStruct(
                id=str(uuid.uuid4()),
                vector=embedding.tolist(),
                payload={
                    'source_file': chunk['source_file'],
                    'chunk_index': chunk['chunk_index'],
                    'content': chunk['content'],
                    'metadata': chunk['metadata']
                }
            )
            points.append(point)
            
        except Exception as e:
            print(f"Error processing chunk from {chunk['source_file']}: {e}")
    
    # Store points in Qdrant with adaptive batch processing
    if points:
        # Calculate optimal batch size based on content
        batch_size = calculate_optimal_batch_size(points)
        total_batches = (len(points) + batch_size - 1) // batch_size
        
        print(f"Storing {len(points)} embeddings in {total_batches} batches (batch size: {batch_size})...")
        
        for i in range(0, len(points), batch_size):
            batch = points[i:i + batch_size]
            batch_num = (i // batch_size) + 1
            
            try:
                qdrant_client.upsert(
                    collection_name=COLLECTION_NAME,
                    points=batch
                )
                print(f"  Batch {batch_num}/{total_batches}: Stored {len(batch)} embeddings")
            except Exception as e:
                print(f"  Error storing batch {batch_num}: {e}")
                # If we still hit size limits, try with smaller batches
                if "larger than allowed" in str(e) and batch_size > 10:
                    print(f"  Payload too large, retrying with smaller batch size...")
                    smaller_batch_size = batch_size // 2
                    for j in range(i, min(i + batch_size, len(points)), smaller_batch_size):
                        smaller_batch = points[j:j + smaller_batch_size]
                        qdrant_client.upsert(
                            collection_name=COLLECTION_NAME,
                            points=smaller_batch
                        )
                        print(f"    Stored {len(smaller_batch)} embeddings (smaller batch)")
                else:
                    raise
        
        print(f"Successfully stored all {len(points)} embeddings")

def process_and_chunk_files():
    """
    Main function to process markdown files and create structured chunks.
    """
    print("Setting up markdown splitter...")
    splitter = setup_markdown_splitter()
    
    print("Getting markdown files from S3...")
    markdown_files = get_markdown_files_from_s3()
    
    if not markdown_files:
        print("No markdown files found in S3 bucket.")
        return
    
    all_chunks = []
    
    for file_key in markdown_files:
        print(f"Processing {file_key}...")
        
        content = read_file_from_s3(file_key)
        if content is None:
            continue
            
        try:
            # Split the document into chunks
            chunks = splitter.split_text(content)
            
            # Add metadata to each chunk
            for i, chunk in enumerate(chunks):
                chunk_data = {
                    'source_file': file_key,
                    'chunk_index': i,
                    'content': chunk.page_content,
                    'metadata': chunk.metadata
                }
                all_chunks.append(chunk_data)
            
            print(f"  Created {len(chunks)} chunks from {file_key}")
            
        except Exception as e:
            print(f"  Error processing {file_key}: {e}")
    
    print(f"\nTotal chunks created: {len(all_chunks)}")
    return all_chunks

def main():
    """
    Main function to process files and store embeddings in Qdrant.
    """
    print("Starting MarketSight document processing pipeline...")
    
    # Step 1: Set up Qdrant collection
    print("\n1. Setting up Qdrant collection...")
    setup_qdrant_collection(qdrant_client)
    
    # Step 2: Process and chunk files
    print("\n2. Processing and chunking documents...")
    chunks = process_and_chunk_files()
    
    if not chunks:
        print("No chunks generated. Exiting.")
        return
    
    # Step 3: Generate embeddings and store in Qdrant
    print("\n3. Generating embeddings and storing in Qdrant...")
    embed_and_store_chunks(chunks)
    
    print(f"\nPipeline completed successfully!")
    print(f"Total documents processed and stored: {len(chunks)}")

if __name__ == '__main__':
    main()