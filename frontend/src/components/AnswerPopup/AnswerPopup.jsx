import { useEffect } from 'react'
import { useTranslation } from '../../i18n/context'

function AnswerPopup({ open, onClose, isLevelCorrect, isEquipmentCorrect, isCorrect, level, microbe }) {
  useEffect(() => {
    window.dispatchEvent(new Event(open ? 'popup-opened' : 'popup-closed'))
  }, [open])

  const { t, language } = useTranslation()

  if (!open) return null

  const headline = isCorrect ? t('answerPopup.correct') : t('answerPopup.incorrect')
  const headlineColor = isCorrect ? '#1a8a34' : '#c51a1a'

  const localized = (field) => {
    if (language === 'sv' || language === 'fi') {
      return microbe[`${field}_${language}`]
    }
    return microbe[field]
  }

  const feedback = microbe
      ? (isLevelCorrect ? localized('feedback_correct') : localized('feedback_incorrect'))
      : (isCorrect ? t('answerPopup.correctFallback') : t('answerPopup.incorrectFallback'))

  const equipmentFeedback = isEquipmentCorrect
    ? t('answerPopup.equipmentCorrect')
    : t('answerPopup.equipmentIncorrect')
    
  const boxClass = `popup-box ${!isCorrect ? 'popup-box--incorrect' : ''}`

  return (
    <div className="popup-overlay">
      <div className={boxClass}>
        <button onClick={onClose} className="popup-close-button position-absolute top-0 end-0 m-3">
          {t('common.close')}
        </button>

        <h2 style={{ margin: '0 0 12px', color: headlineColor }}>{headline}</h2>
        <p style={{ margin: 0, fontSize: '1.05rem' }}>{feedback}</p>
        <p style={{ margin: '8px 0 0', fontSize: '0.95rem' }}>{equipmentFeedback}</p>
        <p style={{ margin: '12px 0 0', fontSize: '0.95rem' }}>{t('answerPopup.chosenLevel').replace('{level}', level)}</p>
        {microbe && (
          <p style={{ margin: '4px 0 0', fontSize: '0.95rem' }}>
            {t('answerPopup.belongs')
                .replace('{name}', localized('common_name'))
                .replace('{level}', microbe.bsl_level)}
          </p>
        )}
      </div>
    </div>
  )
}

export default AnswerPopup