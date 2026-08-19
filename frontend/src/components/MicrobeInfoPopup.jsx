import { useEffect } from 'react'
import { useTranslation } from '../i18n/context'

function MicrobeInfoPopup({ open, onClose, microbe }) {
  const { t, language } = useTranslation()

  useEffect(() => {
    window.dispatchEvent(new Event(open ? 'popup-opened' : 'popup-closed'))
  }, [open])

  if (!open || !microbe) {
    return null
  }

  const localized = (field) => {
    if (!microbe) {
      return ''
    }
    if (language === 'sv' || language === 'fi') {
      return microbe[`${field}_${language}`] || microbe[field]
    }
    return microbe[field]
  }

  return (
    <div className="popup-overlay">
      <div className="popup-box">
        <button className="popup-close-button" onClick={onClose}>
          {t('common.close')}
        </button>
        <h2>{t('microbeInfoPopup.title')}</h2>
        <dl>
          <dt>{t('microbeInfoPopup.scientificName')}</dt>
          <dd>{microbe.scientific_name}</dd>

          <dt>{t('microbeInfoPopup.commonName')}</dt>
          <dd>{localized('common_name')}</dd>

          <dt>{t('microbeInfoPopup.type')}</dt>
          <dd>{localized('type')}</dd>

          <dt>{t('microbeInfoPopup.description')}</dt>
          <dd>{localized('lecture_text')}</dd>
        </dl>
      </div>
    </div>
  )
}

export default MicrobeInfoPopup
