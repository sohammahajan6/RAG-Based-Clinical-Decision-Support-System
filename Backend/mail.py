import os
import yagmail
from fastapi import HTTPException


# Configure Gmail Credentials
SENDER_EMAIL = "sohamnmahajan@gmail.com"  # Replace with your Gmail
SENDER_PASSWORD = "hnjl ozjr bjga tpvg"  # Use an App Password for security

def send_risk_alert_email(patient): 
    """
    Sends an email alert if the latest risk score is 'High'.
    """
    if patient.latest_risk_factor.lower() != "critical":
        print(f"✅ {patient.name} is not in critical condition. No email sent.")
        return {"message": f"No alert needed for {patient.name}."}

    subject = f"🚨 Urgent Medical Risk Alert for {patient.name}"

    # Email Body
    body = f"""
    Dear {patient.name},

    Our latest health analysis has flagged your condition as **High Risk (Critical Condition)**.
   
    📌 **Risk Assessment Summary:**
    - **Risk Level:** {patient.latest_risk_factor} 🚨
    - **Reasoning:**You  have the following the symptoms leading to need for immediate care :{patient.symptoms}
    - **Immediate Actions Needed:** Please contact your doctor as soon as possible and  the following medications on time:{patient.medications}

    🏥 **Recommended Next Steps:**
    - Schedule an **urgent medical consultation**.
    - Monitor your vital signs regularly.
    - Follow any prescribed emergency procedures.

    **This is an automated alert. If you have any urgent concerns, please seek medical attention immediately.**
   
    Stay safe,  
    📍 **Your Healthcare AI Assistant**
    """

    # Send Email
    try:
        yag = yagmail.SMTP(SENDER_EMAIL, SENDER_PASSWORD)
        yag.send(to=patient.Email, subject=subject, contents=body)
        print(f"✅ Risk alert email sent successfully to {patient.Email}!")
        return {"message": f"Risk alert email sent successfully to {patient.Email}."}
    
    except Exception as e:
        print(f"❌ Failed to send email: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to send email: {e}")
