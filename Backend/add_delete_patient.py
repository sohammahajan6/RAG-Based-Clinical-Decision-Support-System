import os

main_py_path = r'e:\RAG-Based Clinical Decision Support System\Backend\main.py'
with open(main_py_path, 'r', encoding='utf-8') as f:
    content = f.read()

delete_endpoint = """
@app.delete("/patients/{patient_id}")
async def remove_patient(patient_id: str, current_user: dict = Depends(get_current_user)):
    \"\"\"Doctor removes a patient from their list.\"\"\"
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
"""

if "@app.delete(\"/patients/{patient_id}\")" not in content:
    content = content.replace('@app.get("/patients", response_model=List[Patient])', delete_endpoint + '\n@app.get("/patients", response_model=List[Patient])')
    
    with open(main_py_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Backend delete endpoint added.")
else:
    print("Backend endpoint already exists.")
