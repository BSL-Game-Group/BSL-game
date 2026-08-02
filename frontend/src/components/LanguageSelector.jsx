import { useTranslation } from '../i18n/context'

function LanguageSelector() {
  const { language, setLanguage } = useTranslation()

  return (
    <div className="position-fixed top-0 end-0 p-3 z-3">
        <button className="btn btn-sm btn-primary m-1" onClick={() => setLanguage('en')}>EN</button>
        <button className="btn btn-sm btn-primary m-1" onClick={() => setLanguage('sv')}>SV</button>
        <button className="btn btn-sm btn-primary m-1" onClick={() => setLanguage('fi')}>FI</button>
    </div>
  )
}

export default LanguageSelector
