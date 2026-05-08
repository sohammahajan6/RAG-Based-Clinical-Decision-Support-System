# RAG-Based Clinical Decision Support System

## Overview
This project is a Clinical Decision Support System (CDSS) that leverages Retrieval-Augmented Generation (RAG) to assist healthcare professionals in diagnosing and treating patients. By integrating patient records and structured medical literature with advanced Large Language Models (LLMs), the system provides context-aware, accurate, and evidence-based medical insights.

## Key Features
* Retrieval-Augmented Generation: Uses extensive medical knowledge bases mapped to vector databases to enable highly accurate, hallucination-reduced system outputs.
* Patient Data Management: Securely manage patient contexts, medical history, and clinical records.
* Medical Report Analysis: Automated parsing and analysis of medical reports over PDF and images.
* Vector Search: Utilizes Qdrant for extremely fast semantic search over deep medical texts and clinical data.
* Secure Authentication: Integrated with Google OAuth and JWT strictly to secure access and patient privacy.
* Modern Interface: A clean, responsive React frontend interface customized for healthcare personnel.

## Technology Stack
* Frontend: React, TypeScript, Vite, Tailwind CSS
* Backend: Python, FastAPI, Motor (MongoDB Async), Authlib (OAuth)
* Vector Database: Qdrant
* AI / LLMs: Google Gemini API, Groq API
* Document Processing: PyPDF2, PyTesseract

## Getting Started

### Prerequisites
* Node.js
* Python 3.9+
* MongoDB instance
* Qdrant instance

### Backend Setup
1. Navigate to the Backend directory:
   ```bash
   cd Backend
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Create an environment file (`.env`) in the `Backend` directory containing your API keys and secrets:
   ```env
   GROQ_API_KEY=your_groq_key
   GEMINI_API_KEY=your_gemini_key
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/callback
   SESSION_SECRET_KEY=your_session_secret
   ```
4. Start the application:
   ```bash
   python main.py
   ```

### Frontend Setup
1. Navigate to the Frontend project directory:
   ```bash
   cd Frontend/project
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
