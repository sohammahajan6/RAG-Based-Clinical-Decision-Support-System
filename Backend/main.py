from fastapi import FastAPI, HTTPException, status, Depends, Request, Query, UploadFile, File, Form
from pydantic import BaseModel, EmailStr, Field
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from authlib.integrations.starlette_client import OAuth
from starlette.config import Config
from starlette.responses import RedirectResponse
import logging
from starlette.middleware.sessions import SessionMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

import base64
import uuid
from groq import Groq
from retrival import generate_ai_response
logging.basicConfig(level=logging.ERROR)
from patient_retriver import generate_patient_ai_response
from report_analyzer import analyze_report as medical_analyze_report
import yagmail
import io
from PyPDF2 import PdfReader
try:
    import pytesseract
    from PIL import Image
    OCR_AVAILABLE = True
except ImportError:
    OCR_AVAILABLE = False

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text from a PDF file."""
    try:
        reader = PdfReader(io.BytesIO(file_bytes))
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        return text.strip()
    except Exception as e:
        logging.error(f"PDF extraction error: {e}")
        return ""

def extract_text_from_image(file_bytes: bytes, content_type: str = "image/jpeg") -> str:
    """Extract text from an image using Gemini Vision model."""
    import google.generativeai as genai
    from PIL import Image
    import io
    import os
    try:
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        # Using 2.5 flash since it's available and natively supports multimodal vision extraction
        model = genai.GenerativeModel("gemini-2.5-flash")
        image = Image.open(io.BytesIO(file_bytes))
        
        prompt = "Extract all the text and tabulated data from this medical report image accurately. Format it cleanly. Output ONLY the extracted text, no conversational filler."
        response = model.generate_content([prompt, image])
        return response.text.strip()
    except Exception as e:
        logging.error(f"Gemini Vision extraction error: {e}")
        return ""
# Generate a secure secret key
def generate_secret_key():
    return base64.urlsafe_b64encode(os.urandom(32)).decode()

# Initialize FastAPI app
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5174", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
SENDER_EMAIL = "sohamnmahajan@gmail.com"  # Replace with your Gmail
SENDER_PASSWORD = "hnjl ozjr bjga tpvg"  # Use an App Password for security
# Add SessionMiddleware
app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("SESSION_SECRET_KEY", generate_secret_key()),  # Use a secure secret key
    session_cookie="session",
)

# MongoDB connection
MONGO_DETAILS = "mongodb+srv://soham123:soham%406124@cluster0.wxyo39w.mongodb.net/myFirstDatabase?retryWrites=true&w=majority&appName=Cluster0&tls=true&tlsAllowInvalidCertificates=true"

# Initialize MongoDB client
client = AsyncIOMotorClient(MONGO_DETAILS)
database = client.myFirstDatabase
users_collection = database.get_collection("users")
patients_collection = database.get_collection("patients")
reports_collection = database.get_collection("reports")
requests_collection = database.get_collection("patient_requests")
patient_profiles_collection = database.get_collection("patient_profiles")

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Google OAuth2 configuration
config_data = {
    "GOOGLE_CLIENT_ID": os.getenv("GOOGLE_CLIENT_ID", ""),
    "GOOGLE_CLIENT_SECRET": os.getenv("GOOGLE_CLIENT_SECRET", ""),
    "GOOGLE_REDIRECT_URI": os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/auth/google/callback")
}
config = Config(environ=config_data)
oauth = OAuth(config)
oauth.register(
    name="google",
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_id=config_data["GOOGLE_CLIENT_ID"],
    client_secret=config_data["GOOGLE_CLIENT_SECRET"],
    redirect_uri=config_data["GOOGLE_REDIRECT_URI"],
    client_kwargs={
        "scope": "openid email profile",
        "prompt": "select_account"
    }
)

# Pydantic models (unchanged)
class User(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str
    phone_number: Optional[str] = None
    doctor_id: Optional[str] = ""  # Auto-generated during signup
    role: Optional[str] = "doctor"  # "doctor" or "patient"


class AccessRequest(BaseModel):
    patient_email: EmailStr

class UserInDB(BaseModel):
    id: str
    first_name: str
    last_name: str
    email: EmailStr
    phone_number: Optional[str] = None
    doctor_id: str
    role: str = "doctor"

class Token(BaseModel):
    access_token: str
    token_type: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Patient(BaseModel):
    id: str = Field(alias="_id")
    name: str
    gender: str
    condition: str
    description: str
    doctor_id: str
    age: int
    
class PatientCreate(BaseModel):
    name: str
    gender: str
    Email: EmailStr
    age: Optional[int] = 0
    dob: Optional[str] = ""
    temperature: Optional[float] = 0.0
    pulse: Optional[int] = 0
    bloodPressure: Optional[str] = ""
    height: Optional[float] = 0.0
    weight: Optional[float] = 0.0
    condition: Optional[str] = ""
    description: Optional[str] = ""
    symptoms: Optional[str] = ""
    personalHistory: Optional[str] = ""
    familyHistory: Optional[str] = ""
    allergies: Optional[str] = ""
    medications: Optional[str] = ""
    reports: Optional[str] = ""
    remarks: Optional[str] = ""
    latest_risk_factor: Optional[str] = ""
    score: Optional[str] = ""


class PatientProfileUpdate(BaseModel):
    gender: Optional[str] = ""
    dob: Optional[str] = ""
    allergies: Optional[str] = ""
    medications: Optional[str] = ""
    personalHistory: Optional[str] = ""
    familyHistory: Optional[str] = ""

class TokenData(BaseModel):
    email: Optional[str] = None

# Helper functions (unchanged)
def user_helper(user) -> dict:
    return {
        "id": str(user["_id"]),
        "first_name": user["first_name"],
        "last_name": user["last_name"],
        "email": user["email"],
        "phone_number": user.get("phone_number"),
        "doctor_id": user.get("doctor_id", ""),
        "role": user.get("role", "doctor")
    }

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception

    user = await users_collection.find_one({"email": token_data.email})
    if user is None:
        raise credentials_exception

    # Check if doctor_id exists, if not, generate one and update user
    if "doctor_id" not in user or not user["doctor_id"]:
        doctor_id = f"DOC{uuid.uuid4().hex[:6].upper()}"
        await users_collection.update_one(
            {"_id": user["_id"]},
            {"$set": {"doctor_id": doctor_id}}
        )
        user["doctor_id"] = doctor_id

    return user

# Google OAuth2 routes
@app.get("/auth/google")
async def login_via_google(request: Request):
    redirect_uri = config_data["GOOGLE_REDIRECT_URI"]
    return await oauth.google.authorize_redirect(request, redirect_uri)

@app.get("/auth/google/callback")
async def google_callback(request: Request):
    try:
        # Fetch the access token from Google
        token = await oauth.google.authorize_access_token(request)
        if not token:
            raise HTTPException(status_code=400, detail="Failed to fetch access token")

        # Log the token for debugging purposes
        logging.error(f"Token received: {token}")

        # Get user info directly from userinfo endpoint instead of parsing id_token
        userinfo = token.get('userinfo')
        if not userinfo:
            # If userinfo is not directly available, fetch it using the access token
            resp = await oauth.google.get('https://openidconnect.googleapis.com/v1/userinfo', token=token)
            userinfo = await resp.json()
            
        # Log the user info for debugging
        logging.error(f"User info: {userinfo}")

        # Extract user information
        email = userinfo.get("email")
        first_name = userinfo.get("given_name")
        last_name = userinfo.get("family_name")

        if not email:
            raise HTTPException(status_code=400, detail="Email not found in user info")

        # Check if the user already exists in the database
        user = await users_collection.find_one({"email": email})
        if not user:
            # Create a new user if they don't exist
            user_data = {
                "first_name": first_name or "Google",
                "last_name": last_name or "User",
                "email": email,
                "password": "",  # No password for OAuth users
                "doctor_id": f"DOC{uuid.uuid4().hex[:6].upper()}"  # Generate doctor ID for Google users
            }
            await users_collection.insert_one(user_data)

        # Generate a JWT token for the user
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(data={"sub": email}, expires_delta=access_token_expires)

        # Redirect to the frontend with the JWT token
        frontend_url = f"http://localhost:5173/auth/google/callback?access_token={access_token}"  # Replace with your frontend URL
        return RedirectResponse(url=frontend_url)

    except HTTPException as e:
        raise e
    except Exception as e:
        logging.error(f"Error in google_callback: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

# Existing routes (unchanged)
@app.post("/signup/", response_model=UserInDB)
async def create_user(user: User):
    user_dict = user.dict()
    # Set role (default to doctor if not specified)
    role = user_dict.get("role", "doctor")
    user_dict["role"] = role
    # Generate unique doctor ID only for doctors
    if role == "doctor":
        user_dict["doctor_id"] = f"DOC{uuid.uuid4().hex[:6].upper()}"
    else:
        user_dict["doctor_id"] = ""
    user_dict["password"] = get_password_hash(user_dict["password"])
    if await users_collection.find_one({"email": user_dict["email"]}):
        raise HTTPException(status_code=400, detail="Email already registered")
    new_user = await users_collection.insert_one(user_dict)
    created_user = await users_collection.find_one({"_id": new_user.inserted_id})
    return user_helper(created_user)

@app.post("/login", response_model=Token)
async def login(user: UserLogin):
    user_data = await users_collection.find_one({"email": user.email})
    if not user_data:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    if not verify_password(user.password, user_data["password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(data={"sub": user.email}, expires_delta=access_token_expires)
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/user", response_model=UserInDB)
async def get_current_user_data(current_user: User = Depends(get_current_user)):
    """Endpoint to get the current user's data."""
    return user_helper(current_user)

@app.get("/my-records")
async def get_my_records(current_user: dict = Depends(get_current_user)):
    """Endpoint for patients to view their own medical records (matched by email)."""
    try:
        user_email = current_user.get("email")
        if not user_email:
            raise HTTPException(status_code=400, detail="User email not found")
        # Find patient records where Email matches the logged-in user's email
        records = await patients_collection.find({"Email": user_email}).to_list(100)
        for record in records:
            record["_id"] = str(record["_id"])
        return records
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching records: {str(e)}")

@app.post("/upload-report")
async def upload_report(
    report_type: str = Form(...),
    report_name: str = Form(...),
    notes: str = Form(""),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Endpoint for patients to upload medical reports (blood tests, X-rays, etc.)."""
    try:
        # Read file content and encode as base64
        file_content = await file.read()
        # Limit file size to 10MB
        if len(file_content) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File size must be under 10MB")
        
        file_base64 = base64.b64encode(file_content).decode("utf-8")
        
        # Extract text from the uploaded file
        extracted_text = ""
        if file.content_type == "application/pdf":
            extracted_text = extract_text_from_pdf(file_content)
        elif file.content_type and file.content_type.startswith("image/"):
            extracted_text = extract_text_from_image(file_content, file.content_type)
        
        report_doc = {
            "user_email": current_user["email"],
            "user_id": str(current_user["_id"]),
            "report_type": report_type,
            "report_name": report_name,
            "notes": notes,
            "file_name": file.filename,
            "file_type": file.content_type,
            "file_data": file_base64,
            "file_size": len(file_content),
            "extracted_text": extracted_text,
            "uploaded_at": datetime.utcnow()
        }
        
        result = await reports_collection.insert_one(report_doc)
        if result.inserted_id:
            return {
                "message": "Report uploaded successfully",
                "report_id": str(result.inserted_id),
                "text_extracted": len(extracted_text) > 0
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to upload report")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading report: {str(e)}")

@app.get("/my-reports")
async def get_my_reports(current_user: dict = Depends(get_current_user)):
    """Endpoint for patients to view their uploaded reports (without file data for listing)."""
    try:
        user_email = current_user.get("email")
        reports = await reports_collection.find(
            {"user_email": user_email},
            {"file_data": 0}  # Exclude file data from listing for performance
        ).sort("uploaded_at", -1).to_list(100)
        
        for report in reports:
            report["_id"] = str(report["_id"])
        return reports
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching reports: {str(e)}")


@app.get("/doctor/patient/{patient_id}/reports")
async def get_patient_reports_doctor(patient_id: str, current_user: dict = Depends(get_current_user)):
    """Endpoint for doctors to view their patient's uploaded reports."""
    if current_user.get("role", "doctor") != "doctor":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    try:
        patient = await patients_collection.find_one({
            "_id": ObjectId(patient_id),
            "doctor_id": current_user.get("doctor_id")
        })
        
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found or access denied")
            
        patient_email = patient.get("Email")
        if not patient_email:
            return []
            
        reports = await reports_collection.find(
            {"user_email": patient_email},
            {"file_data": 0}
        ).sort("uploaded_at", -1).to_list(100)
        
        for report in reports:
            report["_id"] = str(report["_id"])
        return reports
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching patient reports: {str(e)}")

@app.get("/report/{report_id}")
async def get_report_file(report_id: str, current_user: dict = Depends(get_current_user)):
    """Endpoint to download a specific report file."""
    try:
        query = {"_id": ObjectId(report_id)}
        if current_user.get("role", "doctor") != "doctor":
            query["user_email"] = current_user["email"]
            
        report = await reports_collection.find_one(query)
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
            
        if current_user.get("role", "doctor") == "doctor":
            # Extra check that doctor has access to the user_email's patient
            patient_check = await patients_collection.find_one({
                "Email": report.get("user_email"),
                "doctor_id": current_user.get("doctor_id")
            })
            if not patient_check:
                raise HTTPException(status_code=403, detail="Not authorized to access this patient's reports")
                
        report["_id"] = str(report["_id"])
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/report/{report_id}")
async def delete_report(report_id: str, current_user: dict = Depends(get_current_user)):
    """Endpoint for patients to delete their own reports."""
    try:
        result = await reports_collection.delete_one({
            "_id": ObjectId(report_id),
            "user_email": current_user["email"]
        })
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Report not found")
        return {"message": "Report deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/analyze-report")
async def analyze_report(report_id: str, question: str, current_user: dict = Depends(get_current_user)):
    """AI-powered analysis using BioBERT + Qdrant RAG + deterministic medical reference ranges."""
    try:
        # Fetch the report
        query = {"_id": ObjectId(report_id)}
        if current_user.get("role") != "doctor":
            query["user_email"] = current_user["email"]
        
        report = await reports_collection.find_one(query)
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
            
        if current_user.get("role") == "doctor":
            patient_check = await patients_collection.find_one({
                "Email": report.get("user_email"),
                "doctor_id": current_user.get("doctor_id")
            })
            if not patient_check:
                raise HTTPException(status_code=403, detail="Not authorized to access this patient's reports")
        
        extracted_text = report.get("extracted_text", "")
        if not extracted_text:
            return {
                "response": "Sorry, I could not extract any text from this report. This may happen with scanned images. Please try uploading a PDF version of your report.",
                "report_name": report.get("report_name", "")
            }
        
        report_type = report.get("report_type", "Medical Report")
        report_name = report.get("report_name", "")
        patient_name = current_user.get("first_name", "there")
        
        # Use the medical report analyzer (BioBERT + Qdrant RAG + reference ranges)
        reply = medical_analyze_report(
            extracted_text=extracted_text,
            question=question,
            patient_name=patient_name,
            report_type=report_type
        )
        
        # Save the analysis to the report document
        await reports_collection.update_one(
            {"_id": ObjectId(report_id)},
            {"$push": {"analysis_history": {
                "question": question,
                "response": reply,
                "timestamp": datetime.utcnow()
            }}}
        )
        
        return {
            "response": reply,
            "report_name": report_name,
            "report_type": report_type
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@app.post("/doctor/request-access")
async def request_patient_access(req: AccessRequest, current_user: dict = Depends(get_current_user)):
    """Doctor requests access to an existing patient's records."""
    if current_user.get("role", "doctor") != "doctor":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    patient_email = req.patient_email
    
    # Check if patient exists in users
    patient_user = await users_collection.find_one({"email": patient_email})
    if not patient_user:
        raise HTTPException(status_code=404, detail="Patient not found with this email.")
        
    # Check if already linked
    existing_link = await patients_collection.find_one({
        "Email": patient_email,
        "doctor_id": current_user.get("doctor_id")
    })
    if existing_link:
        raise HTTPException(status_code=400, detail="Patient is already in your list.")
        
    # Check if request already exists
    existing_request = await requests_collection.find_one({
        "patient_email": patient_email,
        "doctor_id": current_user.get("doctor_id"),
        "status": "pending"
    })
    if existing_request:
        raise HTTPException(status_code=400, detail="A request is already pending for this patient.")
        
    request_doc = {
        "doctor_id": current_user.get("doctor_id"),
        "doctor_name": f"Dr. {current_user.get('first_name')} {current_user.get('last_name')}",
        "patient_email": patient_email,
        "status": "pending",
        "created_at": datetime.utcnow()
    }
    
    await requests_collection.insert_one(request_doc)
    return {"message": "Access request sent successfully."}

@app.get("/patient/requests")
async def get_patient_requests(current_user: dict = Depends(get_current_user)):
    """Get pending access requests for the patient."""
    if current_user.get("role", "patient") != "patient":
        pass # Allow reading if email matches anyway for legacy compatibility
        
    requests = await requests_collection.find({
        "patient_email": current_user.get("email"),
        "status": "pending"
    }).to_list(100)
    
    for r in requests:
        r["_id"] = str(r["_id"])
    return requests

@app.post("/patient/requests/{request_id}/respond")
async def respond_to_request(request_id: str, action: str = Query(...), current_user: dict = Depends(get_current_user)):
    """Patient approves or rejects a doctor's access request."""
    if current_user.get("role", "patient") != "patient":
        pass # Allow responding if email matches anyway for legacy compatibility
        
    if action not in ["approve", "reject"]:
        raise HTTPException(status_code=400, detail="Invalid action. Must be approve or reject.")
        
    req = await requests_collection.find_one({
        "_id": ObjectId(request_id),
        "patient_email": current_user.get("email")
    })
    
    if not req:
        raise HTTPException(status_code=404, detail="Request not found.")
        
    if req["status"] != "pending":
        raise HTTPException(status_code=400, detail="Request is already processed.")
        
    await requests_collection.update_one(
        {"_id": ObjectId(request_id)},
        {"$set": {"status": f"{action}d"}} # 'approved' or 'rejected'
    )
    
    if action == "approve":
        patient_email = current_user.get("email")
        
        # Create a doctor-patient link with only doctor-filled clinical fields
        # Patient's basic info (gender, dob, allergies, etc.) will be fetched live from patient_profiles
        patient_link = {
            "name": f"{current_user.get('first_name')} {current_user.get('last_name')}",
            "Email": patient_email,
            "doctor_id": req["doctor_id"],
            # Doctor-filled clinical fields (initially empty)
            "temperature": 0.0,
            "pulse": 0,
            "bloodPressure": "",
            "height": 0.0,
            "weight": 0.0,
            "condition": "",
            "description": "",
            "symptoms": "",
            "reports": "",
            "remarks": "",
            "latest_risk_factor": "",
            "score": ""
        }
        await patients_collection.insert_one(patient_link)
        
    return {"message": f"Request {action}d successfully."}


@app.delete("/patients/{patient_id}")
async def remove_patient(patient_id: str, current_user: dict = Depends(get_current_user)):
    """Doctor removes a patient from their list."""
    if current_user.get("role", "doctor") != "doctor":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    doctor_id = current_user.get("doctor_id")
    
    # Verify patient belongs to doctor
    result = await patients_collection.delete_one({
        "_id": ObjectId(patient_id),
        "doctor_id": doctor_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Patient not found or already removed")
        
    return {"message": "Patient removed successfully"}

async def merge_patient_profile(patient: dict) -> dict:
    """Merge patient_profiles data (patient's self-reported basic info) into the patient record.
    Patient-filled fields from profile take precedence if they exist and are non-empty."""
    patient_email = patient.get("Email")
    if patient_email:
        profile = await patient_profiles_collection.find_one({"user_email": patient_email})
        if profile:
            # Merge patient-filled fields from profile (only if profile has non-empty values)
            for field in ["gender", "dob", "allergies", "medications", "personalHistory", "familyHistory"]:
                profile_val = profile.get(field, "")
                if profile_val:  # Only override if profile has a value
                    patient[field] = profile_val
            # Compute age from dob if available
            dob_str = profile.get("dob", "")
            if dob_str:
                try:
                    # Handle YYYY-MM-DD format from HTML date inputs
                    dob_date = datetime.strptime(dob_str, "%Y-%m-%d")
                    today = datetime.utcnow()
                    age = today.year - dob_date.year - ((today.month, today.day) < (dob_date.month, dob_date.day))
                    patient["age"] = age
                except Exception as e:
                    logging.error(f"Failed to parse DOB '{dob_str}': {e}")
    # Ensure all required fields exist with defaults
    patient.setdefault("gender", "Unknown")
    patient.setdefault("age", 0)
    patient.setdefault("dob", "")
    patient.setdefault("condition", "")
    patient.setdefault("description", "")
    patient.setdefault("symptoms", "")
    patient.setdefault("personalHistory", "")
    patient.setdefault("familyHistory", "")
    patient.setdefault("allergies", "")
    patient.setdefault("medications", "")
    patient.setdefault("remarks", "")
    patient.setdefault("latest_risk_factor", "")
    patient.setdefault("score", "")
    return patient

@app.get("/patients")
async def get_patients(current_user: User = Depends(get_current_user)):
    """Get patients for the current doctor only, with merged profile data."""
    try:
        doctor_id = current_user.get("doctor_id")
        if not doctor_id:
            doctor_id = f"DOC{uuid.uuid4().hex[:6].upper()}"
            await users_collection.update_one(
                {"_id": current_user["_id"]},
                {"$set": {"doctor_id": doctor_id}}
            )
            current_user["doctor_id"] = doctor_id

        patients = await patients_collection.find({"doctor_id": doctor_id}).to_list(1000)
        merged_patients = []
        for patient in patients:
            patient["_id"] = str(patient["_id"])
            patient = await merge_patient_profile(patient)
            merged_patients.append(patient)
        return merged_patients
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching patients: {str(e)}")

@app.post("/create")
async def create_patient(patient: PatientCreate, current_user: dict = Depends(get_current_user)):
    """Endpoint to create a new patient."""
    try:
        # Convert Pydantic model to dictionary
        patient_dict = patient.dict()
        patient_dict["doctor_id"] = current_user["doctor_id"]
        # Insert the patient into the MongoDB collection
        result = await patients_collection.insert_one(patient_dict)
        if result.inserted_id:
            return {"message": "Patient created successfully", "patient_id": str(result.inserted_id)}
        else:
            raise HTTPException(status_code=500, detail="Failed to create patient")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))     

# ---- Patient Profile Endpoints ----
# NOTE: These MUST be before /patient/{patient_id} to avoid route conflict

@app.get("/patient/profile")
async def get_patient_profile(current_user: dict = Depends(get_current_user)):
    """Get the current patient's self-reported profile."""
    user_email = current_user.get("email")
    profile = await patient_profiles_collection.find_one({"user_email": user_email})
    if profile:
        profile["_id"] = str(profile["_id"])
        return profile
    # Return empty profile structure if none exists yet
    return {
        "user_email": user_email,
        "gender": "",
        "dob": "",
        "allergies": "",
        "medications": "",
        "personalHistory": "",
        "familyHistory": ""
    }

@app.put("/patient/profile")
async def update_patient_profile(profile: PatientProfileUpdate, current_user: dict = Depends(get_current_user)):
    """Create or update the patient's self-reported basic profile."""
    user_email = current_user.get("email")
    profile_dict = profile.dict()
    profile_dict["user_email"] = user_email
    profile_dict["updated_at"] = datetime.utcnow()
    
    result = await patient_profiles_collection.update_one(
        {"user_email": user_email},
        {"$set": profile_dict},
        upsert=True
    )
    
    # Also update the name in any existing patient links if the user updates their profile
    user_name = f"{current_user.get('first_name', '')} {current_user.get('last_name', '')}".strip()
    if user_name:
        await patients_collection.update_many(
            {"Email": user_email},
            {"$set": {"name": user_name}}
        )
    
    return {"message": "Profile updated successfully."}

@app.get("/patient/{patient_id}")
async def get_patient(patient_id: str, current_user: User = Depends(get_current_user)):
    """Endpoint to get a patient's complete information by ID, with merged profile data."""
    try:
        patient = await patients_collection.find_one({
            "_id": ObjectId(patient_id),
            "doctor_id": current_user["doctor_id"]
        })
        if patient:
            patient["_id"] = str(patient["_id"])
            patient = await merge_patient_profile(patient)
            return patient
        else:
            raise HTTPException(status_code=404, detail="Patient not found or unauthorized access")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class PatientClinicalUpdate(BaseModel):
    temperature: Optional[float] = None
    pulse: Optional[int] = None
    bloodPressure: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    condition: Optional[str] = None
    description: Optional[str] = None
    symptoms: Optional[str] = None
    remarks: Optional[str] = None

@app.put("/patient/{patient_id}")
async def update_patient_clinical(patient_id: str, update: PatientClinicalUpdate, current_user: dict = Depends(get_current_user)):
    """Doctor updates clinical data (vitals, condition, symptoms, etc.) for a patient."""
    try:
        # Verify the patient belongs to this doctor
        patient = await patients_collection.find_one({
            "_id": ObjectId(patient_id),
            "doctor_id": current_user.get("doctor_id")
        })
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found or unauthorized.")
        
        # Build update dict with only non-None fields
        update_dict = {k: v for k, v in update.dict().items() if v is not None}
        if not update_dict:
            raise HTTPException(status_code=400, detail="No fields to update.")
        
        await patients_collection.update_one(
            {"_id": ObjectId(patient_id)},
            {"$set": update_dict}
        )
        return {"message": "Patient updated successfully."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# @app.get("/query")
# async def query_chat(req: str = Query(...)):
#     """Endpoint to handle chatbot queries."""
#     # Parse the query parameters
#     query_data = eval(req)  # Convert string to dictionary
#     patient_id = query_data.get("id")
#     prompt = query_data.get("prompt")

#     # Simulate a chatbot response
#     response = f"Bot response for patient {patient_id}: {prompt}"
#     return {"Output": response}

# @app.get("/query/")
# @app.get("/query/")
# async def query(question: str = Query(..., title="User Question")):
#     try:
#         response = generate_ai_response(question)
#         return {"answer": response}
#     except Exception as e:
#         logging.error(f"Error occurred: {str(e)}")
#         traceback.print_exc()  # Print detailed error
#         raise HTTPException(status_code=500, detail="Internal Server Error")

# class QueryRequest(BaseModel):
#     question: str

# @app.get("/query/")
# def query(request: QueryRequest):
#     return {"question": request.question}

@app.get("/query/")
def query_medical_ai(question: str):
    try:
        # Simulate AI response generation
        response = generate_ai_response(question)
        return {"query": question, "response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# @app.get("/query_patient/")
# async def query_medical_patient_ai(question: str, patient_id: str):
#     try:
#         # Retrieve patient details from MongoDB
#         patient = await patients_collection.find_one({"_id": ObjectId(patient_id)})
#         if not patient:
#             raise HTTPException(status_code=404, detail="Patient not found")

        
#         patient_info = {
#             "name": patient["name"],
#             "age": patient["age"],
#             "gender": patient["gender"],
#             "Email": patient["Email"],
#             "condition": patient["condition"],
#             "symptoms": patient["symptoms"],
#             "medications": patient["medications"],
#             "allergies": patient["allergies"],
#             "personalHistory": patient["personalHistory"],
#             "familyHistory": patient["familyHistory"],
#             "remarks": patient["remarks"]
#         }
#         past_questions = patient.get("therapeutic_optimisation_question", "").split(" || ")
#         past_questions = past_questions[-2:] if past_questions else []
#         therapeutic_optimisation_question = " || ".join(past_questions + [question])
#         response = generate_patient_ai_response(question, patient_info, therapeutic_optimisation_question)

#         # Generate AI response
#         response,score,risk_factor = generate_patient_ai_response(question, patient_info,therapeutic_optimisation_question)
#         chat_entry = {
#             "question": question,
#             "response": response,
#             "risk_factor": risk_factor,  
#             "confidence_score": score,
#             "timestamp": datetime.utcnow()
#         }
#         await patients_collection.update_one(
#             {"_id": ObjectId(patient_id)},
#             {"$push": {"chat_history": chat_entry}, "$set": {"therapeutic_optimisation_question": therapeutic_optimisation_question, 
#               "latest_risk_factor": risk_factor}}
#         )
        
#         return {"query": question, "patient_info": patient_info, "response": response,"score":score}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

@app.get("/query_patient/")
async def query_medical_patient_ai(question: str, patient_id: str):
    try:
        # Retrieve patient details from MongoDB
        patient = await patients_collection.find_one({"_id": ObjectId(patient_id)})
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")

        # Merge patient's self-reported profile data (gender, dob/age, medications, etc.)
        patient["_id"] = str(patient["_id"])
        patient = await merge_patient_profile(patient)
        
        patient_info = {
            "name": patient.get("name", "N/A"),
            "Email": patient.get("Email", ""),
            "age": patient.get("age", 0),
            "gender": patient.get("gender", "Unknown"),
            "condition": patient.get("condition", ""),
            "symptoms": patient.get("symptoms", ""),
            "medications": patient.get("medications", ""),
            "allergies": patient.get("allergies", ""),
            "personalHistory": patient.get("personalHistory", ""),
            "familyHistory": patient.get("familyHistory", ""),
            "remarks": patient.get("remarks", ""),
            "score": patient.get("score", 0.0),
            "latest_risk_factor": patient.get("latest_risk_factor", "")
        }
        past_questions = patient.get("therapeutic_optimisation_question", "").split(" || ")
        past_questions = past_questions[-2:] if past_questions else []
        therapeutic_optimisation_question = " || ".join(past_questions + [question])
        response = generate_patient_ai_response(question, patient_info, therapeutic_optimisation_question)

        # Generate AI response
        result = generate_patient_ai_response(question, patient_info, therapeutic_optimisation_question)

# Ensure it's unpackable
        if isinstance(result, tuple) and len(result) == 3:
            response, risk, cscore = result
            
        else:
            response = result
            risk, cscore = None, None
        # print(risk)
        # print(result)
        # if risk and risk.lower() == "critical":
        #     send_risk_alert_email(patient_info)
        # else:
        #     print("no call")
        if risk and risk.lower() == "critical":
            send_risk_alert_email(patient_info)
        chat_entry = {
            "question": question,
            "response": response,
            "latest_risk_factor":risk,
            "score":cscore,
            "timestamp": datetime.utcnow()
        }
        await patients_collection.update_one(
            {"_id": ObjectId(patient_id)},
            {"$push": {"chat_history": chat_entry}, "$set": {"therapeutic_optimisation_question": therapeutic_optimisation_question,"latest_risk_factor":risk,"score":cscore}}
        )
        
        return {"query": question, "patient_info": patient_info, "response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def send_risk_alert_email(patient:dict):
    """
    Sends an email alert if the latest risk factor is 'critical'.
    """
    if patient.get("latest_risk_factor", "").lower() != "critical":
        print(f"✅ {patient.get('name', '')} is not in a critical condition. No email sent.")
        return {"message": f"No alert needed for {patient.get('name', '')}."}

    subject = f"🚨 Urgent Medical Risk Alert for {patient.get('name', '')}"

    body = f"""
    Dear {patient.get("name", "")},

    Our latest health analysis has flagged your condition as *CRITICAL*.
   
    📌 *Risk Assessment Summary:*
    - *Risk Level:* {patient.get('latest_risk_factor','')}
    - *Condition:* {patient.get('condition','')}
    - *Symptoms:* {patient.get('symptoms','')}
    - *Recommended Action:* Please seek immediate medical attention.

    Regards,
    Your Healthcare Team
    """

    try:
        yag = yagmail.SMTP(SENDER_EMAIL, SENDER_PASSWORD)
        yag.send(to=patient.get("Email",""), subject=subject, contents=body)
        print(f"📧 Alert email sent to {patient.get('Email','')}")
        return {"message": f"Alert email sent to {patient.get('name','')} at {patient.get('Email','')}."}
    except Exception as e:
        print(f"❌ Failed to send email: {str(e)}")
        return {"error": "Failed to send email", "details": str(e)}

# Run the application
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
