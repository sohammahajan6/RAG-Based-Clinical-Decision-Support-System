import re

file_path = r'e:\RAG-Based Clinical Decision Support System\Frontend\project\src\components\PatientDashboard.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Imports
if "Check" not in content:
    content = content.replace("X,\n    Plus,", "Check,\n    X,\n    Plus,")

# 2. Add state for requests
state_insert = "    const [requests, setRequests] = useState<any[]>([]);"
if "const [requests, setRequests] = useState" not in content:
    content = content.replace("const [records, setRecords] = useState<PatientRecord[]>([]);", "const [records, setRecords] = useState<PatientRecord[]>([]);\n" + state_insert)

# 3. Add fetchRequests to useEffect
if "fetchRequests();" not in content:
    fetch_func = """
    const fetchRequests = async () => {
        try {
            const response = await fetch('http://localhost:8000/patient/requests', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) setRequests(await response.json());
        } catch (error) {
            console.error('Error fetching requests:', error);
        }
    };

    const handleRequestAction = async (requestId: string, action: string) => {
        try {
            const res = await fetch(`http://localhost:8000/patient/requests/${requestId}/respond?action=${action}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchRequests();
                fetchMyRecords();
            }
        } catch (e) { console.error(e); }
    };
"""
    content = content.replace("const fetchMyRecords = async () => {", fetch_func + "\n    const fetchMyRecords = async () => {")
    content = content.replace("fetchMyReports();", "fetchMyReports();\n        fetchRequests();")

# 4. Insert Request UI into overview tab
request_ui = """
                                {requests.length > 0 && (
                                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
                                        <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-400 mb-4 flex items-center gap-2">
                                            <Bell className="w-5 h-5" />
                                            Pending Doctor Requests
                                        </h3>
                                        <div className="space-y-3">
                                            {requests.map(req => (
                                                <div key={req._id} className="bg-white dark:bg-slate-900 rounded-lg p-4 flex items-center justify-between border border-amber-100 dark:border-amber-800/50">
                                                    <div>
                                                        <p className="font-semibold text-slate-800 dark:text-slate-100">{req.doctor_name}</p>
                                                        <p className="text-sm text-slate-500 dark:text-slate-400">Requested access to your medical records</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => handleRequestAction(req._id, 'approve')} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1">
                                                            <Check className="w-4 h-4" /> Approve
                                                        </button>
                                                        <button onClick={() => handleRequestAction(req._id, 'reject')} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-1">
                                                            <X className="w-4 h-4" /> Reject
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
"""
if "Pending Doctor Requests" not in content:
    # Need to add Bell to imports
    if "Bell," not in content:
        content = content.replace("Check,", "Bell,\n    Check,")
        
    content = content.replace(
        '<p className="text-slate-500 dark:text-slate-400 dark:text-slate-500 text-sm mt-1">Here\'s a summary of your health records.</p>\n                                    </div>',
        '<p className="text-slate-500 dark:text-slate-400 dark:text-slate-500 text-sm mt-1">Here\'s a summary of your health records.</p>\n                                    </div>\n' + request_ui
    )

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("PatientDashboard.tsx updated.")
