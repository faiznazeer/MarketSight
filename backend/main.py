import os
from fastapi import FastAPI
from pydantic import BaseModel
from dotenv import load_dotenv
from qdrant_client import QdrantClient
from sentence_transformers import SentenceTransformer
import google.generativeai as genai
from typing import List, Dict, Any

load_dotenv()

app = FastAPI()

# Qdrant configuration
QDRANT_URL = os.getenv('QDRANT_URL', 'http://localhost:6333')
QDRANT_API_KEY = os.getenv('QDRANT_API_KEY')
COLLECTION_NAME = 'market_insights'

# Google Gemini configuration
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
genai.configure(api_key=GEMINI_API_KEY)

# Initialize Qdrant client
qdrant_client = QdrantClient(
    url=QDRANT_URL,
    api_key=QDRANT_API_KEY
)

# Initialize embedding model
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')

# Initialize Gemini model
gemini_model = genai.GenerativeModel('gemini-2.5-flash')

class QueryRequest(BaseModel):
    question: str
    k: int = 5

def extract_text_from_metadata(results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Extract and combine text from query result metadata"""
    extracted_results = []
    
    for result in results:
        # Extract text from content and metadata
        text_content = result.get("content", "")
        metadata = result.get("metadata", {})
        
        # Combine metadata text fields if they exist
        metadata_text = ""
        if isinstance(metadata, dict):
            for key, value in metadata.items():
                if isinstance(value, str) and value.strip():
                    metadata_text += f"{key}: {value}\n"
        
        # Combine content with metadata text
        combined_text = text_content
        if metadata_text:
            combined_text += f"\n\nMetadata:\n{metadata_text}"
        
        extracted_results.append({
            "text": combined_text,
            "source": result.get("source_file", "Unknown"),
            "score": result.get("score", 0),
            "chunk_index": result.get("chunk_index", 0)
        })
    
    return extracted_results

def combine_context(extracted_results: List[Dict[str, Any]]) -> str:
    """Combine extracted texts to form context for Gemini"""
    context_parts = []
    
    for i, result in enumerate(extracted_results, 1):
        source_info = f"Source {i}: {result['source']}"
        if result.get('chunk_index') is not None:
            source_info += f" (chunk {result['chunk_index']})"
        
        context_part = f"{source_info}\n{result['text']}\n"
        context_parts.append(context_part)
    
    return "\n" + "="*50 + "\n".join(context_parts)

async def generate_answer_with_gemini(question: str, context: str) -> str:
    """Generate answer using Google Gemini with context"""
    prompt = f"""You are a financial analyst AI assistant specializing in analyzing 10-K filings for US publicly listed companies. Your role is to provide accurate, data-driven insights based on official SEC filings.

CONTEXT FROM 10-K FILINGS:
{context}

USER QUESTION: {question}

INSTRUCTIONS:
1. **Primary Focus**: Base your analysis strictly on the provided 10-K filing context. This data represents official company disclosures to the SEC.

2. **Financial Analysis Standards**: 
   - Provide quantitative data when available (revenue, profit margins, debt ratios, etc.)
   - Compare year-over-year performance when multiple periods are present
   - Identify key financial trends and patterns
   - Highlight material risks and uncertainties mentioned in the filings

3. **Source Attribution**: Always cite which company's filing(s) and which section you're referencing (e.g., "According to [Company]'s 10-K, Item 1A Risk Factors...")

4. **Professional Tone**: Use clear, professional language suitable for investors and financial professionals.

5. **Limitations**: If the context doesn't contain sufficient information to fully answer the question, explicitly state what information is missing and suggest what additional 10-K sections or filings would be needed.

6. **No Investment Advice**: Provide factual analysis only. Do not give investment recommendations or predict future stock performance.

7. **Data Accuracy**: If numbers or financial metrics are mentioned, ensure they match exactly what's stated in the filing context.

RESPONSE FORMAT:
- Start with a direct answer to the question
- Support with specific data points from the filings
- Include relevant context about business operations, risks, or market conditions
- End with source references and any limitations of the analysis

Please provide your analysis now:"""

    try:
        response = gemini_model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Error generating response: {str(e)}"

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/query")
async def query_documents(request: QueryRequest):
    # Convert question to embedding
    question_embedding = embedding_model.encode(request.question)
    
    # Search in Qdrant
    search_results = qdrant_client.query_points(
        collection_name=COLLECTION_NAME,
        query=question_embedding.tolist(),
        limit=request.k,
        with_payload=True
    ).points
    
    # Format initial results
    results = []
    for result in search_results:
        results.append({
            "score": result.score,
            "content": result.payload["content"],
            "source_file": result.payload["source_file"],
            "chunk_index": result.payload["chunk_index"],
            "metadata": result.payload["metadata"]
        })
    
    # Extract text from metadata
    extracted_results = extract_text_from_metadata(results)
    
    # Combine context
    context = combine_context(extracted_results)
    
    # Generate answer with Gemini
    answer = await generate_answer_with_gemini(request.question, context)
    
    # Prepare sources for response
    sources = []
    for result in extracted_results:
        sources.append({
            "source": result["source"],
            "chunk_index": result["chunk_index"],
            "score": result["score"]
        })
    
    return {
        "question": request.question,
        "answer": answer,
        "sources": sources,
        "context_used": len(extracted_results)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)