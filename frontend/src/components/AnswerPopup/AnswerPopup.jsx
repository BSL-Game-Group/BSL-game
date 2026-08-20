import { useEffect, useRef } from 'react'
import { useTranslation } from '../../i18n/context'
import { CATEGORY_CONFIG, CATEGORY_IDS } from '../../utils/equipmentCategories'

function AnswerPopup({
  open,
  onClose,
  isLevelCorrect,
  isEquipmentCorrect,
  isCorrect,
  level,
  microbe,
  equipmentSlots,
  onRetry,
  attempt,
}) {
  useEffect(() => {
    window.dispatchEvent(new Event(open ? 'popup-opened' : 'popup-closed'))
  }, [open])

  const retryButton = useRef(null)
  const canRetry = Boolean(onRetry)

  // Keyed on whether the button exists, not on every render: an inline ref callback
  // re-runs on each one and would drag focus back off Close.
  useEffect(() => {
    if (open && canRetry) { retryButton.current?.focus() }
  }, [open, canRetry])

  const { t, language } = useTranslation()

  if (!open) {
    return null
  }

  const headline = isCorrect ? t('answerPopup.correct') : t('answerPopup.incorrect')
  const headlineColor = isCorrect ? '#1a8a34' : '#c51a1a'

  const localized = (field) => {
    if (language === 'sv' || language === 'fi') {
      return microbe[`${field}_${language}`]
    }
    return microbe[field]
  }

  // Every microbe feedback string names the level, so the prose gives the answer away
  // just as much as the "belongs to" line below it. Both wait until there is nothing
  // left to retry, or the retry is pointless.
  const revealsAnswer = !onRetry

  // The fallback describes the room, so it turns on the room alone: the right room
  // with the wrong gear must not be told it picked the wrong room.
  const feedback =
    microbe && revealsAnswer
      ? (isLevelCorrect ? localized('feedback_correct') : localized('feedback_incorrect'))
      : (isLevelCorrect ? t('answerPopup.correctFallback') : t('answerPopup.incorrectFallback'))

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
        {equipmentSlots && (
          <ul className="list-unstyled" style={{ margin: '8px 0 0', fontSize: '0.95rem' }}>
            {CATEGORY_IDS.map((id) => {
              const ok = equipmentSlots[id]?.status === 'ok'

              return (
                <li key={id} style={{ color: ok ? '#1a8a34' : '#c51a1a' }}>
                  <span aria-hidden="true">{ok ? '✓' : '✗'}</span>{' '}
                  {t(CATEGORY_CONFIG[id].labelKey)}
                  <span className="visually-hidden">
                    {' '}
                    {ok ? t('answerPopup.slotCorrect') : t('answerPopup.slotIncorrect')}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
        <p style={{ margin: '12px 0 0', fontSize: '0.95rem' }}>{t('answerPopup.chosenLevel').replace('{level}', level)}</p>
        {microbe && revealsAnswer && (
          <p style={{ margin: '4px 0 0', fontSize: '0.95rem' }}>
            {t('answerPopup.belongs')
                .replace('{name}', localized('common_name'))
                .replace('{level}', microbe.bsl_level)}
          </p>
        )}
        {onRetry && (
          <button
            ref={retryButton}
            onClick={onRetry}
            className="btn btn-primary mt-3 align-self-start"
          >
            {t('answerPopup.tryAgain')}
          </button>
        )}
        {!onRetry && !isCorrect && attempt === 2 && (
          <p style={{ margin: '12px 0 0', fontSize: '0.95rem', fontStyle: 'italic' }}>
            {t('answerPopup.lastAttempt')}
          </p>
        )}
      </div>
    </div>
  )
}

export default AnswerPopup