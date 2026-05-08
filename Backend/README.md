

# AIsculapius: RAG-based Clinical Decision Support System (CDSS)

**Named after Asclepius, the Greek god of medicine, with an AI twist.**

## Problem Statement: AB2_03
Problem: Healthcare professionals face challenges accessing real-time, relevant medical information for decision-making due to fragmented data and evolving research. Existing systems struggle with patient-specific insights and cognitive overload from vast outdated literature. 
Traditional search methods often fail to capture the semantic nuances of medical queries.This leads to potential inaccuracies and inefficiencies in clinical decisions.

## Project Overview 
AIsculapius is a RAG-based Clinical Decision Support System (CDSS) designed to provide accurate, context-aware, and summarized answers to medical queries. It leverages the power of Qdrant (vector database), BioBERT-based query expansion, and AI-driven summarization using Grok LLM to deliver a comprehensive medical information resource.User queries trigger retrieval of relevant information, patient data integration, and AI-powered summarization. A chatbot interface delivers concise, evidence-based recommendations, with options for source document access and human oversight. Continuous evaluation and data updates ensure accuracy and relevance.

## ROUND 1 WORK
![image](https://github.com/user-attachments/assets/4f15e5f4-5088-42b7-a7d1-b933f6a011b6)

## Solution

Our solution provides a robust pipeline for clinical decion support system:

1.  **Data Ingestion:** Aggregates data from PubMed, WHO, FDA, ArXiv, TEXTBOOKS: 18 widely used medical textbooks, which are important references for students taking the United States Medical Licensing Examination (USLME), 

![image](https://github.com/user-attachments/assets/bf17c7a5-eb40-4af8-83f8-cebf5606c124)

2.  **Query Processing:** Expands user queries using BioBERT and EHR-derived medical vocabulary, then performs hybrid retrieval.
3.  **AI Summarization:** Utilizes Grok LLM for concise summaries and BioBERT for Named Entity Recognition (NER).
![image](https://github.com/user-attachments/assets/3b58fb24-7f0b-4732-90ad-373bf5064570)

4.  **Output Representation:** Delivers results via a chatbot interface with summaries, source links, and structured medical entities.
5.  **Evaluation & Refinement:** Continuously improves performance through evaluation metrics and user feedback. The Model undergoes periodic updates to update its Vector Database with New Research , Electronic Health Records , guidelines and Textbooks.

## Key Features

* **Hybrid Retrieval:** Combines BM25 (Elasticsearch) and vector search (Qdrant) for optimal results.
* **BioBERT-Powered Query Expansion:** Enhances query understanding with medical vocabulary.
* **AI-Driven Summarization:** Provides concise and relevant summaries using Grok LLM.
* **Named Entity Recognition:** Extracts medical conditions, drugs, and guidelines.
* **Chatbot Interface:** Facilitates user interaction and information delivery.
* **Comprehensive Data Sources:** Integrates data from reputable medical literature repositories.
* **Human-in-the-Loop:** Allows for review and validation of results. Further the query expansion allows the human to tune the query to his/her liking.
* **Evaluation Metrics:** Tracks performance using Precision@k, Recall@k, and MRR.

![image](https://github.com/user-attachments/assets/5f070a3e-2a30-4462-9fb0-cb435579a3f8)


## Architecture




ROUND 2 WORK:
![image](https://github.com/user-attachments/assets/43141be9-23d0-4047-be64-282e15662a8a)

![image](https://github.com/user-attachments/assets/703f6416-5cb5-418a-ae9b-ac57b4e436f1)


