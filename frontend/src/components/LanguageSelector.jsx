import { useTranslation } from '../i18n/context'

// Positioning belongs to the HUD container in App, not here: the selector is one
// row of a stack that also holds the auth panel.
function LanguageSelector() {
  const { language, setLanguage } = useTranslation()

  return (
    <div className="d-flex">
        <button className="btn btn-sm btn-primary m-1" onClick={() => setLanguage('en')}>EN</button>
        <button className="btn btn-sm btn-primary m-1" onClick={() => setLanguage('sv')}>SV</button>
        <button className="btn btn-sm btn-primary m-1" onClick={() => setLanguage('fi')}>FI</button>
    </div>
  )
}

export default LanguageSelector
