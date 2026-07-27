import { useTranslation } from '../i18n/context'

function LanguageSelector() {
  const { language, setLanguage } = useTranslation()

  return (
    <div style={{ position: 'fixed', top: '12px', right: '12px', zIndex: 1000 }}>
      <button
        onClick={() => setLanguage('en')}
        style={{
          padding: '8px 12px',
          marginRight: '4px',
          backgroundColor: language === 'en' ? '#0066cc' : '#e0e0e0',
          color: language === 'en' ? '#fff' : '#000',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '0.9rem',
        }}
      >
        English
      </button>
      <button
        onClick={() => setLanguage('sv')}
        style={{
          padding: '8px 12px',
          backgroundColor: language === 'sv' ? '#0066cc' : '#e0e0e0',
          color: language === 'sv' ? '#fff' : '#000',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '0.9rem',
        }}
      >
        Svenska
      </button>
    </div>
  )
}

export default LanguageSelector
