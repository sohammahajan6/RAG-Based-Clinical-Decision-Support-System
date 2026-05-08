import re

file_path = r'e:\RAG-Based Clinical Decision Support System\Frontend\project\src\components\Patient.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update imports
if "Upload" not in content:
    content = content.replace("MessageSquare\n} from 'lucide-react';", "MessageSquare,\n    Upload,\n    Download,\n    Image\n} from 'lucide-react';")

# 2. Update PatientProps
import_props = """interface PatientProps {
    isDarkMode: boolean;
    patient: PatientData;
}"""
new_props = """interface PatientProps {
    token: string;
    isDarkMode: boolean;
    patient: PatientData;
    onChatClick?: () => void;
}"""
content = content.replace(import_props, new_props)

# 3. Component Signature
comp_sig = "const Patient: React.FC<PatientProps> = ({ isDarkMode, patient: initialPatient }) => {"
new_comp_sig = "const Patient: React.FC<PatientProps> = ({ token, isDarkMode, patient: initialPatient }) => {"
content = content.replace(comp_sig, new_comp_sig)

# 4. State & useEffect for reports
state_insert_point = "const [patientData, setPatientData] = useState<PatientData | null>(initialPatient);"
reports_state = """const [patientData, setPatientData] = useState<PatientData | null>(initialPatient);
    const [reports, setReports] = useState<any[]>([]);
    const [loadingReports, setLoadingReports] = useState(false);

    useEffect(() => {
        if (patientData?._id) {
            fetchPatientReports(patientData._id);
        }
    }, [patientData?._id]);

    const fetchPatientReports = async (patientId: string) => {
        setLoadingReports(true);
        try {
            const response = await fetch(`http://localhost:8000/doctor/patient/${patientId}/reports`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setReports(data);
            }
        } catch (error) {
            console.error('Error fetching patient reports:', error);
        } finally {
            setLoadingReports(false);
        }
    };

    const handleViewReport = async (reportId: string) => {
        try {
            const res = await fetch(`http://localhost:8000/report/${reportId}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                const byteChars = atob(data.file_data);
                const byteArray = new Uint8Array(byteChars.length);
                for (let i = 0; i < byteChars.length; i++) byteArray[i] = byteChars.charCodeAt(i);
                const blob = new Blob([byteArray], { type: data.file_type });
                window.open(URL.createObjectURL(blob), '_blank');
            }
        } catch (e) { console.error(e); }
    };
"""
content = content.replace(state_insert_point, reports_state)

# 5. Add Tab
tab_html = """                        <button
                            onClick={handleChatClick}
                            className={`flex items-center py-4 px-6 font-medium transition-colors duration-200 ${activeTab === 'chat' ? (isDarkMode ? 'text-blue-400 border-b-2 border-blue-400' : 'text-blue-600 border-b-2 border-blue-600') : (isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800')}`}
                        >
                            <MessageSquare className="h-5 w-5 mr-2" />
                            Chat
                        </button>"""

new_tab_html = tab_html + """
                        <button
                            onClick={() => setActiveTab('reports')}
                            className={`flex items-center py-4 px-6 font-medium transition-colors duration-200 ${activeTab === 'reports' ? (isDarkMode ? 'text-blue-400 border-b-2 border-blue-400' : 'text-blue-600 border-b-2 border-blue-600') : (isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800')}`}
                        >
                            <Upload className="h-5 w-5 mr-2" />
                            Reports
                        </button>"""
content = content.replace(tab_html, new_tab_html)

# 6. Add Reports view content
reports_view = """
                    {activeTab === 'reports' && (
                        <div className={`rounded-xl shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6`}>
                            <h2 className={`text-xl font-semibold mb-6 flex items-center ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                                <Upload className="h-5 w-5 mr-2" />
                                Patient Reports
                            </h2>
                            {loadingReports ? (
                                <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Loading reports...</p>
                            ) : reports.length === 0 ? (
                                <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>No reports uploaded by this patient yet.</p>
                            ) : (
                                <div className="space-y-3">
                                    {reports.map((report) => (
                                        <div key={report._id} className={`rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} p-4 flex items-center justify-between`}>
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg flex items-center justify-center`}>
                                                    {report.file_type?.startsWith('image/') ? <Image className="w-5 h-5 text-purple-500" /> : <FileText className="w-5 h-5 text-blue-500" />}
                                                </div>
                                                <div>
                                                    <p className={`text-sm font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{report.report_name}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className={`text-xs ${isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'} px-2 py-0.5 rounded-full`}>{report.report_type}</span>
                                                        <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{new Date(report.uploaded_at).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button onClick={() => handleViewReport(report._id)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title="View/Download">
                                                <Download className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
"""

chat_area = "                    {activeTab === 'chat' && ("
content = content.replace(chat_area, reports_view + chat_area)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Patient.tsx updated.")
