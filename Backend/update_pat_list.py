import re

file_path = r'e:\RAG-Based Clinical Decision Support System\Frontend\project\src\components\PatientList.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add Trash2 back to imports
if "Trash2" not in content:
    content = content.replace("User, Calendar, HeartPulse }", "User, Calendar, HeartPulse, Trash2 }")

# 2. Add prop and state
if "onPatientSelect: (patient: Patient) => void;" in content:
    content = content.replace("onPatientSelect: (patient: Patient) => void;", "onPatientSelect: (patient: Patient) => void;\n  onPatientRemove: (patientId: string) => void;")
    content = content.replace("onPatientSelect, isDarkMode = false", "onPatientSelect, onPatientRemove, isDarkMode = false")

# 3. Add delete endpoint logic (handled in Dashboard mostly, here we just emit event but maybe we ask for confirmation)
delete_modal = """
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const confirmDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // prevent opening patient details
    setDeleteId(id);
  };

  const handleRemove = () => {
    if (deleteId) {
        onPatientRemove(deleteId);
        setDeleteId(null);
    }
  };
"""
if "const [searchTerm, setSearchTerm] = useState('');" in content:
    content = content.replace("const [searchTerm, setSearchTerm] = useState('');", "const [searchTerm, setSearchTerm] = useState('');\n" + delete_modal)

# 4. Add the delete button and Modal to UI
# Delete button
delete_btn = """
                <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                        {patient.name}
                      </h3>
                      <span className={`inline-block mt-1 px-3 py-1 text-xs font-semibold rounded-full ${isDarkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800'}`}>
                        {patient.condition || "Linked Patient"}
                      </span>
                    </div>
                    <button 
                        onClick={(e) => confirmDelete(e, patient.id)}
                        className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'text-gray-400 hover:bg-gray-800 hover:text-red-400' : 'text-gray-500 hover:bg-red-50 hover:text-red-500'}`}
                        title="Remove Patient"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
"""
# Replace old header
old_header = """              <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex justify-between items-center">
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                    {patient.name}
                  </h3>
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${isDarkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800'
                      }`}
                  >
                    {patient.condition}
                  </span>
                </div>
              </div>"""

content = content.replace(old_header, delete_btn)

# Insert the confirmation modal
modal_ui = """
      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className={`rounded-xl shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
                <h3 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Remove Patient?</h3>
                <p className={`mb-6 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Are you sure you want to remove this patient from your dashboard? This will not delete their account, but you will lose access to their records until they approve a new request.
                </p>
                <div className="flex justify-end gap-3">
                    <button 
                        onClick={() => setDeleteId(null)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleRemove}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                    >
                        Yes, Remove Patient
                    </button>
                </div>
            </div>
        </div>
      )}
"""

content = content.replace("    </div>\n  );\n};\n\nexport default PatientList;", modal_ui + "\n    </div>\n  );\n};\n\nexport default PatientList;")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("PatientList updated.")
