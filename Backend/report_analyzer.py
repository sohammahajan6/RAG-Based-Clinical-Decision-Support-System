"""
Medical Report Analyzer - Uses Google Gemini for medically accurate analysis
+ BioBERT + Qdrant RAG for evidence-grounded responses.

Pipeline:
1. Gemini analyzes the report (medically accurate, handles ANY lab format)
2. BioBERT + Qdrant retrieves relevant medical literature for grounding
3. Gemini generates patient-friendly explanation with RAG context
"""

import os
import logging
import torch
from transformers import AutoTokenizer, AutoModel
from rank_bm25 import BM25Okapi
import qdrant_client
import google.generativeai as genai
from dotenv import load_dotenv
import json

load_dotenv()
logging.basicConfig(level=logging.INFO)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# ==================== GEMINI SETUP ====================
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
gemini_model = genai.GenerativeModel("gemini-2.0-flash")

# ==================== BioBERT + Qdrant (existing infrastructure) ====================
qdrant = qdrant_client.QdrantClient(
    url="https://4011f446-4fd2-4adb-ba12-29bd86c9d679.eu-west-2-0.aws.cloud.qdrant.io:6333",
    api_key="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.bDHlL44SSg1Glgl8Vj5BLDoYRPBG7wNK8UKKXGqThoY",
    timeout=60.0
)

logging.info("Report Analyzer: Loading BioBERT model...")
tokenizer = AutoTokenizer.from_pretrained("dmis-lab/biobert-base-cased-v1.1")
biobert_model = AutoModel.from_pretrained("dmis-lab/biobert-base-cased-v1.1").to(device)

# BM25 for keyword matching
def _load_bm25():
    try:
        with open("medical_data.json", "r", encoding="utf-8") as f:
            data = json.load(f)
        docs = [doc["abstract"] for doc in data.get("qdrant", [])]
        titles_list = [doc["title"] for doc in data.get("qdrant", [])]
        if not docs:
            return None, [], []
        tokenized = [doc.split() for doc in docs]
        return BM25Okapi(tokenized), docs, titles_list
    except Exception as e:
        logging.warning(f"BM25 data not available: {e}")
        return None, [], []

bm25, bm25_docs, bm25_titles = _load_bm25()


def _get_biobert_embedding(text: str) -> list:
    """Generate BioBERT embedding for medical text."""
    inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True, max_length=512).to(device)
    with torch.no_grad():
        outputs = biobert_model(**inputs)
    return outputs.last_hidden_state.mean(dim=1).squeeze().tolist()


def _retrieve_medical_context(query: str, top_k=3) -> str:
    """
    Use BioBERT + Qdrant to retrieve relevant medical literature.
    This grounds Gemini's response in real medical research.
    """
    try:
        query_embedding = _get_biobert_embedding(query)
        
        contexts = []
        for collection in ["medical_documents", "clinic_abstract"]:
            try:
                results = qdrant.query_points(
                    collection_name=collection,
                    query=query_embedding,
                    limit=top_k,
                    timeout=15
                )
                for hit in results.points:
                    title = hit.payload.get("title", "")
                    abstract = hit.payload.get("abstract", "")
                    if abstract:
                        contexts.append(f"[{title}]: {abstract[:400]}")
            except Exception as e:
                logging.warning(f"Qdrant search on {collection} failed: {e}")
        
        # Also use BM25
        if bm25 and bm25_docs:
            tokens = query.split()
            scores = bm25.get_scores(tokens)
            top_indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:top_k]
            for i in top_indices:
                if scores[i] > 0:
                    contexts.append(f"[{bm25_titles[i]}]: {bm25_docs[i][:400]}")
        
        return "\n\n".join(contexts[:5]) if contexts else ""
    except Exception as e:
        logging.error(f"Error retrieving medical context: {e}")
        return ""


def analyze_report(extracted_text: str, question: str, patient_name: str = "there", report_type: str = "Blood Test") -> str:
    """
    Analyze a medical report using Gemini + BioBERT RAG.
    
    1. Gemini reads the report (handles ANY lab format accurately)
    2. BioBERT + Qdrant retrieves relevant medical literature
    3. Gemini generates grounded, patient-friendly explanation
    """
    
    # Step 1: Retrieve relevant medical context using BioBERT + Qdrant RAG
    rag_query = f"{report_type} {question} interpretation clinical significance"
    medical_context = _retrieve_medical_context(rag_query)
    
    # Step 2: Single Gemini call — accurate medical analysis + patient-friendly explanation
    prompt = f"""You are a compassionate, highly knowledgeable medical AI assistant. A patient named {patient_name} has shared their {report_type} report and needs your help understanding it.

PATIENT'S REPORT TEXT:
{extracted_text[:5000]}

PATIENT'S QUESTION:
{question}

{"SUPPORTING MEDICAL LITERATURE (from BioBERT + Qdrant knowledge base — use to ground your response):" + chr(10) + medical_context if medical_context else ""}

INSTRUCTIONS:
1. Carefully read the report and identify ALL test results with their values
2. Compare each value against standard medical reference ranges
3. Accurately classify each as normal, borderline, or abnormal
4. Structure your response using these exact sections:

## Summary
Start with "Hi {patient_name}!" and give a warm 2-3 sentence overview. Be honest but reassuring.

## What Looks Good
- List tests that are within normal range
- Explain what each means in simple terms (e.g., "Your hemoglobin is healthy, meaning your blood carries oxygen well")
- Group related tests together

## What to Watch
- ONLY include tests that are genuinely outside normal range
- Explain what the abnormal value means in plain language
- Do NOT list normal values here — accuracy is critical

## Recommendations
- 2-3 specific, actionable suggestions based on the findings
- Always recommend discussing with their doctor

IMPORTANT RULES:
- Be medically ACCURATE. Do not say a value is abnormal if it is within normal range.
- Do NOT echo raw report data (no "WBC: 7.2 x10^9/L"). Use plain language.
- Do NOT mention tests that aren't in the report (don't make up results).
- Keep response under 300 words.
- End with: "This analysis is based on standard medical reference ranges and clinical guidelines. Please discuss with your doctor for personalized advice."
"""

    try:
        response = gemini_model.generate_content(prompt)
        return response.text
    except Exception as e:
        logging.warning(f"Gemini unavailable ({type(e).__name__}), falling back to Groq...")
        # Fallback to Groq with the same prompt
        try:
            from groq import Groq
            groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
            chat_completion = groq_client.chat.completions.create(
                messages=[
                    {"role": "system", "content": f"""You are a compassionate, highly knowledgeable medical AI assistant helping patient {patient_name} understand their {report_type}.

CRITICAL RULES:
- Be medically ACCURATE. Compare values against standard reference ranges.
- Do NOT say a value is abnormal if it is within normal range.
- Do NOT echo raw report data. Use plain language.
- Do NOT mention tests that aren't in the report.
- Structure response with ## Summary, ## What Looks Good, ## What to Watch, ## Recommendations
- Start Summary with "Hi {patient_name}!"
- Keep under 300 words.
- End with: "This analysis is based on standard medical reference ranges. Please discuss with your doctor for personalized advice." """},
                    {"role": "user", "content": f"""PATIENT'S REPORT:
{extracted_text[:4000]}

{"MEDICAL LITERATURE CONTEXT:" + chr(10) + medical_context if medical_context else ""}

QUESTION: {question}"""}
                ],
                model="openai/gpt-oss-120b",
                temperature=0.3
            )
            return chat_completion.choices[0].message.content
        except Exception as e2:
            logging.error(f"Groq fallback also failed: {e2}")
            return "I'm sorry, I couldn't analyze this report right now. Please try again later."
