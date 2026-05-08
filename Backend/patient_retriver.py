import os
import json
import logging
import torch
from transformers import AutoTokenizer, AutoModel
from rank_bm25 import BM25Okapi
import qdrant_client
from groq import Groq

logging.basicConfig(level=logging.INFO)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

client = qdrant_client.QdrantClient(
    url="https://4011f446-4fd2-4adb-ba12-29bd86c9d679.eu-west-2-0.aws.cloud.qdrant.io:6333",
    api_key="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.bDHlL44SSg1Glgl8Vj5BLDoYRPBG7wNK8UKKXGqThoY"  # Use environment variables for security
)
collection_name = "clinic_abstract"

logging.info("Loading BioBERT model...")
tokenizer = AutoTokenizer.from_pretrained("dmis-lab/biobert-base-cased-v1.1")
model = AutoModel.from_pretrained("dmis-lab/biobert-base-cased-v1.1").to(device)

def load_bm25_data():
    try:
        with open("medical_data.json", "r", encoding="utf-8") as f:
            data = json.load(f)
        documents = [doc["abstract"] for doc in data.get("qdrant", [])]
        titles = [doc["title"] for doc in data.get("qdrant", [])]
        tokenized_corpus = [doc.split() for doc in documents]
        return BM25Okapi(tokenized_corpus), documents, titles
    except FileNotFoundError:
        logging.warning("medical_data.json not found. BM25 retrieval disabled.")
        return None, [], []

bm25, documents, titles = load_bm25_data()

def get_query_embedding(query):
    inputs = tokenizer(query, return_tensors="pt", padding=True, truncation=True).to(device)
    with torch.no_grad():
        outputs = model(**inputs)
    return outputs.last_hidden_state.mean(dim=1).squeeze().tolist()

def retrieve_dense(query, top_k=5):
    query_vector = get_query_embedding(query)
    search_results = client.search(
        collection_name=collection_name, query_vector=query_vector, limit=top_k
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
    bm25_results = retrieve_bm25(query, top_k=top_k)
    hybrid_results = reciprocal_rank_fusion(dense_results, bm25_results) if bm25_results else dense_results
    return [{"title": title, "score": score} for title, score in hybrid_results]

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))  # Secure API key handling

def get_qdrant_min_max():
    all_scores = []
    scroll_result = client.scroll(collection_name=collection_name, scroll_filter=None, limit=1000)
    for point in scroll_result[0]:  # Extract documents from tuple response
        if "score" in point:  
            all_scores.append(point["score"])
    
    return (min(all_scores), max(all_scores)) if all_scores else (0, 1)

min_qdrant, max_qdrant = get_qdrant_min_max()

def get_bm25_min_max():
    all_scores = []
    for doc in documents:
        tokens = doc.split()
        scores = bm25.get_scores(tokens)
        all_scores.extend(scores)
    
    return (min(all_scores), max(all_scores)) if all_scores else (0, 1)

min_bm25, max_bm25 = get_bm25_min_max()

def compute_confidence_score(qdrant_score, bm25_score, alpha=0.7):
    qdrant_range = max_qdrant - min_qdrant or 1
    bm25_range = max_bm25 - min_bm25 or 1

    qdrant_norm = (qdrant_score - min_qdrant) / qdrant_range
    bm25_norm = (bm25_score - min_bm25) / bm25_range

    return alpha * qdrant_norm + (1 - alpha) * bm25_norm

def classify_risk_factor(response_text, query):
    critical_keywords = ["life-threatening", "severe", "urgent", "emergency", "high risk", "ICU", "hospitalization"]
    medium_keywords = ["moderate", "monitor closely", "follow-up needed", "potential complications"]
    minor_keywords = ["mild", "low risk", "routine check-up", "no immediate concern"]

    response_lower = response_text.lower()
    query_lower = query.lower()

    if any(word in response_lower for word in critical_keywords) or any(word in query_lower for word in critical_keywords):
        return "Critical"
    elif any(word in response_lower for word in medium_keywords) or any(word in query_lower for word in medium_keywords):
        return "Medium"
    else:
        return "Minor"
    
def generate_patient_ai_response(query, patient_recent_profile, therapeutic_optimisation_question):
    retrieved_docs = retrieve_hybrid(query, top_k=5)
    if not retrieved_docs:
        return {"response": "No relevant documents found."}

    retrieved_texts = "\n\n".join([f"Title: {doc['title']}\nAbstract: {doc.get('abstract', 'No abstract')}" for doc in retrieved_docs])
    confidence_scores = [doc["score"] for doc in retrieved_docs]
    avg_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0

    prompt = f"""
## Role: World-Class Primary Care Physician

## Task: Generate Therapeutic Optimization Tasks for a PCP to review based on the patient's profile, therapeutic optimisation questions, and current best practice guidelines.
Generate Everything in point wise manner as heading and subheading format
## Guidelines:
**Data Inputs:**
- **Patient's Current Clinical Profile:** Utilize the detailed information from the patient's most recent clinical profile over the last 12 weeks, which includes diagnoses, medications, and any abnormal labs. This data is provided under the variable {{patient_recent_profile}}.
- **Clinical Questions:** Consider the clinical questions generated from the previous interaction, which are intended to identify potential areas for therapeutic intervention. These are provided under the variable {{therapeutic_optimisation_question}}.
- **Clinical Guidelines:** Refer to the latest clinical guidelines returned from a semantic search. These guidelines are crucial for informing the creation of therapeutic optimization tasks and are provided under the variable {{guidelines}}.
  
## Objective:
Craft detailed therapeutic optimization tasks based on the patient's current medical status and the insights gained from the clinical questions and guidelines. The tasks should specifically cater to the patient's current health needs and leverage the latest medical standards and practices to enhance treatment effectiveness and patient care.

## Details to Include:
- **Medications:** Specify any recommended medications, including changes to existing prescriptions, with exact dosages and administration details based on the clinical guidelines. Include precise dosages (e.g., 40 mg twice daily), specific medication names (e.g., Atorvastatin instead of just stating 'statins'), and the duration for each prescribed medication (e.g., for 30 days).
- **Therapeutic Interventions:** Outline any suggested modifications or additions to the patient's treatment regimen, considering their current condition and the clinical insights provided. Detail the mode of administration (e.g., oral, intravenous), frequency (e.g., every 8 hours), and duration (e.g., 7 days). Include any adjunct therapies such as physical therapy sessions twice a week for six weeks.
- **Monitoring Parameters:** Define essential monitoring parameters to track the effectiveness of the new or adjusted treatments, specifying how often and which metrics should be monitored. Include specifics like blood pressure to be checked bi-weekly, and liver function tests to be done every month.
- **Patients current condition:** identify if the disease the patient is suffereing from is severe,life threathnening,moderate ,minor etc
## Patient's Current Clinical Profile:
{patient_recent_profile}

## Therapeutic Optimization Question to Consider:
{therapeutic_optimisation_question}

## Up-to-Date Clinical Guidelines to Inform Therapeutic Optimization Tasks for the Patient:
{retrieved_texts}

## Expected Output:
A comprehensive list of therapeutic optimization tasks that are detailed and actionable. Each task should clearly address specific aspects of the patient's current health status, using the provided clinical questions and guidelines as a foundation to ensure tailored and effective patient care.

## Citations and Referencing:
At the end of the generated answer, always provide citations to accompany your claims. You can extract these from the "Title" in the retrieved context (guidelines). Provide the citations in this format: "Title"-StatsPearls. If there is no "Title," then just write "No citation." Use only citations provided in guidelines (retrieved context)!"""
    conversation_history = [{"role": "system", "content": "You are an AI expert in medical document retrieval and research."}]
    conversation_history.append({"role": "user", "content": prompt})

    try:
        chat_completion = groq_client.chat.completions.create(
            messages=conversation_history,
            model="llama-3.3-70b-versatile"
        )
        reply = chat_completion.choices[0].message.content
        conversation_history.append({"role": "assistant", "content": reply})

        risk_factor=classify_risk_factor(reply,query)
        return reply,risk_factor

    except Exception as e:
        return {"response": f"Error generating response: {e}"}
