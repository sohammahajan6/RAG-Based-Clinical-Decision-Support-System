import re

file_path = r'e:\RAG-Based Clinical Decision Support System\Frontend\project\src\components\PatientForm.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. State logic
new_state = """  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [linkingEmail, setLinkingEmail] = useState('');
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkSuccess, setLinkSuccess] = useState('');
  const [linkError, setLinkError] = useState('');

  const handleLinkPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setLinkError('');
    setLinkSuccess('');
    setLinkLoading(true);

    try {
      const response = await fetch('http://localhost:8000/doctor/request-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ patient_email: linkingEmail })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to send access request.');
      }

      setLinkSuccess(data.message);
      setLinkingEmail('');
    } catch (err) {
      setLinkError(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setLinkLoading(false);
    }
  };
"""
content = content.replace("""  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);""", new_state)


# 2. UI
ui_insertion = """      <div className={`mb-8 p-6 rounded-lg shadow-sm border ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
        <h2 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Link Existing Patient</h2>
        <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Request access to a patient's records who already has an account.</p>
        
        {linkError && <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-md text-sm">{linkError}</div>}
        {linkSuccess && <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-md text-sm">{linkSuccess}</div>}
        
        <form onSubmit={handleLinkPatient} className="flex flex-col sm:flex-row gap-3">
            <input 
                type="email" 
                placeholder="Patient's Email Address" 
                value={linkingEmail}
                onChange={e => setLinkingEmail(e.target.value)}
                required
                className={inputClassName}
            />
            <button 
                type="submit" 
                disabled={linkLoading}
                className="whitespace-nowrap px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-md font-medium transition-colors"
            >
                {linkLoading ? 'Sending Request...' : 'Send Access Request'}
            </button>
        </form>
      </div>

      <div className="relative flex items-center py-6">
        <div className={`flex-grow border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}></div>
        <span className={`flex-shrink mx-4 text-sm font-semibold uppercase ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Or Create New Patient</span>
        <div className={`flex-grow border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}></div>
      </div>
"""

content = content.replace("""    <div className={`p-6 transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
      }`}>
      <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'
        }`}>
        Add New Patient
      </h2>""", """    <div className={`p-6 transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
      }`}>
""" + ui_insertion + """
      <h2 className={`text-2xl font-bold mb-6 mt-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'
        }`}>
        Create New Patient Manually
      </h2>""")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("PatientForm.tsx updated successfully.")
