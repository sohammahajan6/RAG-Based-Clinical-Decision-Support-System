import os
import json
import logging
import torch
from transformers import AutoTokenizer, AutoModel
from rank_bm25 import BM25Okapi
import qdrant_client
from groq import Groq
from dotenv import load_dotenv

logging.basicConfig(level=logging.INFO)

load_dotenv()

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

client = qdrant_client.QdrantClient(
    url="https://4011f446-4fd2-4adb-ba12-29bd86c9d679.eu-west-2-0.aws.cloud.qdrant.io:6333",
    api_key="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.bDHlL44SSg1Glgl8Vj5BLDoYRPBG7wNK8UKKXGqThoY",
    timeout=60.0  # Increase timeout to 60 seconds
)
collection_name = "medical_documents"

logging.info("Loading BioBERT model...")
tokenizer = AutoTokenizer.from_pretrained("dmis-lab/biobert-base-cased-v1.1")
model = AutoModel.from_pretrained("dmis-lab/biobert-base-cased-v1.1").to(device)

def load_bm25_data():
    try:
        with open("medical_data.json", "r", encoding="utf-8") as f:
            data = json.load(f)
        
        documents = [doc["abstract"] for doc in data.get("qdrant", [])]
        titles = [doc["title"] for doc in data.get("qdrant", [])]
        
        if not documents:  # Check if documents list is empty
            logging.warning("No documents found in medical_data.json")
            return None, [], []
            
        tokenized_corpus = [doc.split() for doc in documents]
        return BM25Okapi(tokenized_corpus), documents, titles
    except FileNotFoundError:
        logging.warning("medical_data.json not found. BM25 retrieval disabled.")
        return None, [], []
    except json.JSONDecodeError:
        logging.error("Invalid JSON format in medical_data.json")
        return None, [], []
    except Exception as e:
        logging.error(f"Error loading BM25 data: {str(e)}")
        return None, [], []

bm25, documents, titles = load_bm25_data()

def get_query_embedding(query):
    inputs = tokenizer(query, return_tensors="pt", padding=True, truncation=True).to(device)
    with torch.no_grad():
        outputs = model(**inputs)
    return outputs.last_hidden_state.mean(dim=1).squeeze().tolist()

def retrieve_dense(query, top_k=5):
    try:
        query_vector = get_query_embedding(query)
        search_results = client.query_points(
            collection_name=collection_name,
            query_vector=query_vector,
            limit=top_k,
            timeout=30  # Set specific timeout for this query
        )
        results = [
            {
                "title": hit.payload.get("title", "Unknown"),
                "abstract": hit.payload.get("abstract", ""),
                "score": hit.score
            }
            for hit in search_results
        ]
        return results
    except Exception as e:
        logging.error(f"Error in dense retrieval: {str(e)}")
        return []  # Return empty list on error

def retrieve_bm25(query, top_k=5):
    if not bm25:
        logging.warning("BM25 retrieval disabled.")
        return []
    query_tokens = query.split()
    scores = bm25.get_scores(query_tokens)
    top_indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:top_k]
    return [{"title": titles[i], "abstract": documents[i], "score": scores[i]} for i in top_indices]

def reciprocal_rank_fusion(dense_results, bm25_results, k=60):
    combined_scores = {}
    def update_score(results):
        for rank, doc in enumerate(results, 1):
            title = doc["title"]
            score = 1 / (rank + k)
            combined_scores[title] = combined_scores.get(title, 0) + score
    update_score(dense_results)
    update_score(bm25_results)
    return sorted(combined_scores.items(), key=lambda x: x[1], reverse=True)

def retrieve_hybrid(query, top_k=5):
    dense_results = retrieve_dense(query, top_k=top_k)
    if bm25 is None:
        return dense_results  # Fall back to dense retrieval only
    bm25_results = retrieve_bm25(query, top_k=top_k)
    return reciprocal_rank_fusion(dense_results, bm25_results)

groq_client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)

conversation_history = [
    {"role": "system", "content": "You are an AI expert in medical document retrieval and research."}
]

def generate_ai_response(query):
    try:
        retrieved_docs = retrieve_hybrid(query, top_k=5)
        
        if not retrieved_docs:
            return "No relevant documents found or search timed out. Please try again."

        retrieved_texts = "\n\n".join([f"Title: {doc[0]}\nAbstract: {doc[1]}" for doc in retrieved_docs])
        
        prompt = f"""You are an AI that provides detailed responses in points based on medical research documents.
        Given the following research abstract keywords, answer the user's question. answer in points.Have a heading for each point and then explain the abstract part in subpoints.Use recent studies and papers

        User's Query: {query}

        Relevant Research:
        {retrieved_texts}

        Now, provide a detailed response using the information above in point.give points number wise for main headed and subpoints in bullet points.
        """
        
        conversation_history.append({"role": "user", "content": prompt})

        chat_completion = groq_client.chat.completions.create(
            messages=conversation_history,
            model="llama-3.3-70b-versatile"
        )

        reply = chat_completion.choices[0].message.content
        conversation_history.append({"role": "assistant", "content": reply})
        return reply

    except Exception as e:
        logging.error(f"Error generating response: {str(e)}")
        return "An error occurred while processing your request. Please try again later."

if __name__ == "__main__":
    try:
        i = input("Enter your query: ")
        print(generate_ai_response(i))
    except KeyboardInterrupt:
        print("\nProcess interrupted by user. Exiting...")