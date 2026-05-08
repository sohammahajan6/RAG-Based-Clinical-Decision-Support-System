import os
import re

main_py_path = r'e:\RAG-Based Clinical Decision Support System\Backend\main.py'
with open(main_py_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add /doctor/patient/{patient_id}/reports endpoint before /report/{report_id}
new_endpoint = """
@app.get("/doctor/patient/{patient_id}/reports")
async def get_patient_reports_doctor(patient_id: str, current_user: dict = Depends(get_current_user)):
    \"\"\"Endpoint for doctors to view their patient's uploaded reports.\"\"\"
    if current_user.get("role") != "doctor":
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

"""

content = content.replace("@app.get(\"/report/{report_id}\")", new_endpoint + "@app.get(\"/report/{report_id}\")")

# 2. Modify get_report_file
old_get_report_file = """    try:
        report = await reports_collection.find_one({
            "_id": ObjectId(report_id),
            "user_email": current_user["email"]
        })
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        
        report["_id"] = str(report["_id"])
        return report"""

new_get_report_file = """    try:
        query = {"_id": ObjectId(report_id)}
        if current_user.get("role") != "doctor":
            query["user_email"] = current_user["email"]
            
        report = await reports_collection.find_one(query)
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
            
        if current_user.get("role") == "doctor":
            # Extra check that doctor has access to the user_email's patient
            patient_check = await patients_collection.find_one({
                "Email": report.get("user_email"),
                "doctor_id": current_user.get("doctor_id")
            })
            if not patient_check:
                raise HTTPException(status_code=403, detail="Not authorized to access this patient's reports")
                
        report["_id"] = str(report["_id"])
        return report"""
content = content.replace(old_get_report_file, new_get_report_file)


# 3. Modify analyze_report
old_analyze_report = """    try:
        # Fetch the report
        report = await reports_collection.find_one({
            "_id": ObjectId(report_id),
            "user_email": current_user["email"]
        })
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")"""

new_analyze_report = """    try:
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
                raise HTTPException(status_code=403, detail="Not authorized to access this patient's reports")"""
content = content.replace(old_analyze_report, new_analyze_report)

with open(main_py_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Backend endpoints updated successfully.")
