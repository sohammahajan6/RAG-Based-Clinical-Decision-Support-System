import re

file_path = r'e:\RAG-Based Clinical Decision Support System\Frontend\project\src\components\PatientDashboard.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace Tailwind classes to include dark mode variants
replacements = {
    r'\bbg-slate-50\b': 'bg-slate-50 dark:bg-slate-950',
    r'\bbg-white\b': 'bg-white dark:bg-slate-900',
    r'\bbg-slate-100\b': 'bg-slate-100 dark:bg-slate-800',
    r'\bbg-slate-200\b': 'bg-slate-200 dark:bg-slate-700',
    r'\bborder-slate-200\b': 'border-slate-200 dark:border-slate-800',
    r'\bborder-slate-100\b': 'border-slate-100 dark:border-slate-800/50',
    r'\btext-slate-800\b': 'text-slate-800 dark:text-slate-100',
    r'\btext-slate-700\b': 'text-slate-700 dark:text-slate-200',
    r'\btext-slate-600\b': 'text-slate-600 dark:text-slate-300',
    r'\btext-slate-500\b': 'text-slate-500 dark:text-slate-400',
    r'\btext-slate-400\b': 'text-slate-400 dark:text-slate-500',
    r'\btext-slate-300\b': 'text-slate-300 dark:text-slate-600',
    
    r'\bhover:bg-slate-50\b': 'hover:bg-slate-50 dark:hover:bg-slate-800/50',
    r'\bhover:bg-slate-100\b': 'hover:bg-slate-100 dark:hover:bg-slate-800',
    r'\bhover:text-slate-600\b': 'hover:text-slate-600 dark:hover:text-slate-300',
    r'\bhover:text-slate-700\b': 'hover:text-slate-700 dark:hover:text-slate-200',
    r'\bbg-teal-50\b': 'bg-teal-50 dark:bg-teal-900/30',
    r'\bbg-teal-100\b': 'bg-teal-100 dark:bg-teal-900/50',
    r'\bborder-teal-200\b': 'border-teal-200 dark:border-teal-800',
    r'\bhover:border-teal-200\b': 'hover:border-teal-200 dark:hover:border-teal-800',
    r'\bhover:bg-teal-50\b': 'hover:bg-teal-50 dark:hover:bg-teal-900/30'
}

for pat, repl in replacements.items():
    # Only replace if not already replaced
    content = re.sub(pat + r'(?! dark:)', repl, content)

# Import Moon, Sun
import_target = r"import {"
if "Moon," not in content:
    content = content.replace(import_target, "import {\n    Moon,\n    Sun,", 1)

# Add the dark mode state
state_block = "const [expandedRecord, setExpandedRecord] = useState<string | null>(null);"
if "isDarkMode" not in content:
    content = content.replace(
        state_block,
        state_block + "\n    const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'));\n" +
        "    useEffect(() => { if (isDarkMode) document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark'); }, [isDarkMode]);"
    )

# Add the toggle button
header_actions = r"<button onClick={onLogout}"
if "setIsDarkMode" not in content:
    toggle_button = """<button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" title="Toggle Dark Mode">
                                {isDarkMode ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5" />}
                            </button>
                            <button onClick={onLogout}"""
    content = content.replace(header_actions, toggle_button)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated successfully")
