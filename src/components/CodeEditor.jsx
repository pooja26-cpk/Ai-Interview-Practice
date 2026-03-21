function buildLineNumbers(value) {
  const lineCount = Math.max(1, value.split('\n').length)
  return Array.from({ length: lineCount }, (_, index) => index + 1).join('\n')
}

function formatLanguage(language) {
  if (language === 'javascript') return 'JavaScript'
  if (language === 'python') return 'Python'
  return language
}

function CodeEditor({
  id,
  value,
  language,
  languages,
  onChange,
  onLanguageChange,
  placeholder,
}) {
  return (
    <div className="code-editor-shell">
      <div className="code-editor-toolbar">
        <label className="field-label code-language-picker" htmlFor={`${id}-language`}>
          Language
        </label>
        <select
          id={`${id}-language`}
          className="code-language-select"
          value={language}
          onChange={(event) => onLanguageChange(event.target.value)}
        >
          {languages.map((item) => (
            <option key={item} value={item}>
              {formatLanguage(item)}
            </option>
          ))}
        </select>
      </div>
      <div className="code-editor-frame">
        <pre className="code-line-numbers" aria-hidden="true">
          {buildLineNumbers(value)}
        </pre>
        <textarea
          id={id}
          className="code-editor-input"
          spellCheck="false"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
        />
      </div>
    </div>
  )
}

export default CodeEditor
