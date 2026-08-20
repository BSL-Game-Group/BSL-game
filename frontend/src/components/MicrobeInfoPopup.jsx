import { useTranslation } from '../i18n/context'
import { useModalDialog } from '../hooks/useModalDialog'

function MicrobeInfoPopup({ open, onClose, microbe }) {
  const { t, language } = useTranslation()
  const dialogRef = useModalDialog(open, onClose)

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
      <div
        className="popup-box"
        role="dialog"
        aria-modal="true"
        aria-labelledby="microbe-info-title"
        ref={dialogRef}
        tabIndex={-1}
      >
        <button className="popup-close-button" onClick={onClose}>
          {t('common.close')}
        </button>
        <h2 id="microbe-info-title">{t('microbeInfoPopup.title')}</h2>
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
