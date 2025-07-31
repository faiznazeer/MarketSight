import os
from fastapi import FastAPI
from pydantic import BaseModel
from dotenv import load_dotenv
from qdrant_client import QdrantClient
from sentence_transformers import SentenceTransformer

load_dotenv()

app = FastAPI()

# Qdrant configuration
QDRANT_URL = os.getenv('QDRANT_URL', 'http://localhost:6333')
QDRANT_API_KEY = os.getenv('QDRANT_API_KEY')
COLLECTION_NAME = 'market_insights'

# Initialize Qdrant client
qdrant_client = QdrantClient(
    url=QDRANT_URL,
    api_key=QDRANT_API_KEY
)

# Initialize embedding model
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')

class QueryRequest(BaseModel):
    question: str
    k: int = 5

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/query")
def query_documents(request: QueryRequest):
    # Convert question to embedding
    question_embedding = embedding_model.encode(request.question)
    
    # Search in Qdrant
    search_results = qdrant_client.search(
        collection_name=COLLECTION_NAME,
        query_vector=question_embedding.tolist(),
        limit=request.k,
        with_payload=True
    )
    
    # Format results
    results = []
    for result in search_results:
        results.append({
            "score": result.score,
            "content": result.payload["content"],
            "source_file": result.payload["source_file"],
            "chunk_index": result.payload["chunk_index"],
            "metadata": result.payload["metadata"]
        })
    
    return {
        "question": request.question,
        "results": results
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)