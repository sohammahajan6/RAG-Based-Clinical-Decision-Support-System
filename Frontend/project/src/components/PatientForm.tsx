import React, { useState } from 'react';

interface PatientFormProps {
  token: string;
  onPatientCreated: () => void;
  isDarkMode?: boolean;
}

interface PatientFormData {
  name: string;
  gender: string;
  Email: string;
  age: number;
  dob: string;
  temperature: number;
  pulse: number;
  bloodPressure: string;
  height: number;
  weight: number;
  condition: string;
  description: string;
  symptoms: string;
  personalHistory: string;
  familyHistory: string;
  allergies: string;
  medications: string;
  reports: string;
  remarks: string;
  latest_risk_factor: string;
  score: string;
}

const PatientForm: React.FC<PatientFormProps> = ({ token, onPatientCreated, isDarkMode = false }) => {
  const [formData, setFormData] = useState<PatientFormData>({
    name: '',
    gender: 'Male',
    Email: '',
    age: 0,
    dob: '',
    temperature: 98.6,
    pulse: 70,
    bloodPressure: '120/80',
    height: 0,
    weight: 0,
    condition: '',
    description: '',
    symptoms: '',
    personalHistory: '',
    familyHistory: '',
    allergies: '',
    medications: '',
    reports: '',
    remarks: '',
    latest_risk_factor: '',
    score: ''
  });

  const [error, setError] = useState('');
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


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['age', 'temperature', 'pulse', 'height', 'weight'].includes(name)
        ? value === '' ? 0 : parseFloat(value)
        : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validate form data (Only Name and Email are strictly required now to quickly link a patient)
    if (!formData.name || !formData.Email) {
      setError('Please provide the patient name and email at least.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to create patient');
      }

      setSuccess(true);
      setTimeout(() => {
        onPatientCreated();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while creating the patient');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClassName = `w-full px-3 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-300 ${isDarkMode
    ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
    : 'bg-white border-gray-300 text-gray-900'
    }`;

  const labelClassName = `block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
    }`;

  const sectionHeaderClassName = `text-lg font-semibold mb-4 border-b pb-2 ${isDarkMode ? 'text-gray-100 border-gray-700' : 'text-gray-800 border-gray-200'
    }`;

  return (
    <div className={`p-6 transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
      }`}>
      <div className={`mb-8 p-6 rounded-lg shadow-sm border ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
        <h2 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Link Existing Patient</h2>
        <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Request access to a patient's records who already has an account.</p>

        {linkError && <div className="mb-4 p-4 bg-red-50 dark:bg-red-950/50 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-800 rounded-lg text-sm font-medium">{linkError}</div>}
        {linkSuccess && <div className="mb-4 p-4 bg-green-50 dark:bg-green-950/50 text-green-800 dark:text-green-200 border border-green-300 dark:border-green-800 rounded-lg text-sm font-medium">{linkSuccess}</div>}

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

      <h2 className={`text-2xl font-bold mb-6 mt-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'
        }`}>
        Create New Patient Manually
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
          Patient created successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className={`rounded-lg shadow-md p-6 transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-white'
        }`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label htmlFor="name" className={labelClassName}>
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              className={inputClassName}
              required
            />
          </div>

          <div>
            <label htmlFor="gender" className={labelClassName}>
              Gender
            </label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className={inputClassName}
              required
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label htmlFor="age" className={labelClassName}>
              Age
            </label>
            <input
              id="age"
              name="age"
              type="number"
              value={formData.age}
              onChange={handleChange}
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="dob" className={labelClassName}>
              Date of Birth
            </label>
            <input
              id="dob"
              name="dob"
              type="date"
              value={formData.dob}
              onChange={handleChange}
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="Email" className={labelClassName}>
              Email
            </label>
            <input
              id="Email"
              name="Email"
              type="email"
              value={formData.Email}
              onChange={handleChange}
              className={inputClassName}
              required
            />
          </div>
        </div>

        <h3 className={sectionHeaderClassName}>Vital Signs</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label htmlFor="temperature" className={labelClassName}>
              Temperature (°C)
            </label>
            <input
              id="temperature"
              name="temperature"
              type="number"
              step="0.1"
              value={formData.temperature}
              onChange={handleChange}
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="pulse" className={labelClassName}>
              Pulse (bpm)
            </label>
            <input
              id="pulse"
              name="pulse"
              type="number"
              value={formData.pulse}
              onChange={handleChange}
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="bloodPressure" className={labelClassName}>
              Blood Pressure
            </label>
            <input
              id="bloodPressure"
              name="bloodPressure"
              type="text"
              value={formData.bloodPressure}
              onChange={handleChange}
              placeholder="120/80"
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="height" className={labelClassName}>
              Height (cm)
            </label>
            <input
              id="height"
              name="height"
              type="number"
              step="0.1"
              value={formData.height}
              onChange={handleChange}
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="weight" className={labelClassName}>
              Weight (kg)
            </label>
            <input
              id="weight"
              name="weight"
              type="number"
              step="0.1"
              value={formData.weight}
              onChange={handleChange}
              className={inputClassName}
            />
          </div>
        </div>

        <h3 className={sectionHeaderClassName}>Medical Condition</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label htmlFor="condition" className={labelClassName}>
              Current Condition
            </label>
            <input
              id="condition"
              name="condition"
              type="text"
              value={formData.condition}
              onChange={handleChange}
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="description" className={labelClassName}>
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              className={inputClassName}
              placeholder="Describe the patient's condition in detail..."
            />
          </div>

          <div>
            <label htmlFor="symptoms" className={labelClassName}>
              Symptoms
            </label>
            <textarea
              id="symptoms"
              name="symptoms"
              rows={3}
              value={formData.symptoms}
              onChange={handleChange}
              className={inputClassName}
              placeholder="List current symptoms..."
            />
          </div>
        </div>

        <h3 className={sectionHeaderClassName}>Additional Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {[
            {
              id: 'personalHistory',
              label: 'Personal History',
              placeholder: 'Include lifestyle, habits, previous conditions...'
            },
            {
              id: 'familyHistory',
              label: 'Family History',
              placeholder: 'List relevant family medical history...'
            },
            {
              id: 'allergies',
              label: 'Allergies',
              placeholder: 'List any known allergies...'
            },
            {
              id: 'medications',
              label: 'Current Medications',
              placeholder: 'List current medications and dosages...'
            },
            {
              id: 'reports',
              label: 'Reports',
              placeholder: 'List any relevant medical reports...'
            },
            {
              id: 'remarks',
              label: 'Remarks',
              placeholder: 'Additional notes or observations...'
            },
            {
              id: 'latest_risk_factor',
              label: 'Latest Risk Factor',
              placeholder: 'Enter latest risk factor...'
            },
            {
              id: 'score',
              label: 'Score',
              placeholder: 'Enter score...'
            }
          ].map((field) => (
            <div key={field.id}>
              <label htmlFor={field.id} className={labelClassName}>
                {field.label}
              </label>
              <textarea
                id={field.id}
                name={field.id}
                rows={3}
                value={formData[field.id as keyof typeof formData]}
                onChange={handleChange}
                className={inputClassName}
                placeholder={field.placeholder}
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading || success}
            className={`py-2 px-6 rounded-md text-white font-medium transition duration-200 ${isLoading || success
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800'
              }`}
          >
            {isLoading ? 'Creating...' : success ? 'Created!' : 'Create Patient'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PatientForm;