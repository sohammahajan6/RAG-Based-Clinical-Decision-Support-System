import os
import re

main_py_path = r'e:\RAG-Based Clinical Decision Support System\Backend\main.py'
with open(main_py_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add requests_collection
if "requests_collection =" not in content:
    content = content.replace('reports_collection = database.get_collection("reports")', 'reports_collection = database.get_collection("reports")\nrequests_collection = database.get_collection("patient_requests")')

# 2. Add Pydantic model for request
if "class AccessRequest(" not in content:
    model_code = """
class AccessRequest(BaseModel):
    patient_email: EmailStr
"""
    content = content.replace("class UserInDB(BaseModel):", model_code + "\nclass UserInDB(BaseModel):")

# 3. Add endpoints for access requests
endpoints = """

@app.post("/doctor/request-access")
async def request_patient_access(req: AccessRequest, current_user: dict = Depends(get_current_user)):
    \"\"\"Doctor requests access to an existing patient's records.\"\"\"
    if current_user.get("role") != "doctor":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    patient_email = req.patient_email
    
    # Check if patient exists in users
    patient_user = await users_collection.find_one({"email": patient_email, "role": "patient"})
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
    \"\"\"Get pending access requests for the patient.\"\"\"
    if current_user.get("role") != "patient":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    requests = await requests_collection.find({
        "patient_email": current_user.get("email"),
        "status": "pending"
    }).to_list(100)
    
    for r in requests:
        r["_id"] = str(r["_id"])
    return requests

@app.post("/patient/requests/{request_id}/respond")
async def respond_to_request(request_id: str, action: str = Query(...), current_user: dict = Depends(get_current_user)):
    \"\"\"Patient approves or rejects a doctor's access request.\"\"\"
    if current_user.get("role") != "patient":
        raise HTTPException(status_code=403, detail="Not authorized")
        
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
        {"$set": {"status": f"{{action}}d"}} # 'approved' or 'rejected'
    )
    
    if action == "approve":
        # Create a patient link for the doctor
        patient_link = {
            "name": f"{current_user.get('first_name')} {current_user.get('last_name')}",
            "gender": "Unknown",
            "Email": current_user.get("email"),
            "doctor_id": req["doctor_id"],
            "age": 0,
            "dob": "",
            "temperature": 0.0,
            "pulse": 0,
            "bloodPressure": "",
            "height": 0.0,
            "weight": 0.0,
            "condition": "Linked Profile",
            "description": "Patient linked via profile request.",
            "symptoms": "",
            "personalHistory": "",
            "familyHistory": "",
            "allergies": "",
            "medications": "",
            "reports": "",
            "remarks": "",
            "latest_risk_factor": "",
            "score": ""
        }
        await patients_collection.insert_one(patient_link)
        
    return {"message": f"Request {action}d successfully."}
"""
if "/doctor/request-access" not in content:
    content = content.replace("@app.get(\"/patients\", response_model=List[Patient])", endpoints + "\n@app.get(\"/patients\", response_model=List[Patient])")

with open(main_py_path, 'w', encoding='utf-8') as f:
    f.write(content.replace("{action}d", "{action}d"))

print("main.py updated successfully for requests")

