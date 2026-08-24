import { useEffect, useRef } from 'react'
import { useTranslation } from '../../i18n/context'
import { CATEGORY_CONFIG, CATEGORY_IDS } from '../../utils/equipmentCategories'
import { scoreAnswer } from '../../utils/scoring'
import { useModalDialog } from '../../hooks/useModalDialog'

function AnswerPopup({
  open,
  onClose,
  isLevelCorrect,
  isEquipmentCorrect,
  isCorrect,
  level,
  microbe,
  equipmentSlots,
  previousAnswer,
  onRetry,
  attempt,
}) {
  const dialogRef = useModalDialog(open, onClose)

  const retryButton = useRef(null)
  const canRetry = Boolean(onRetry)

  // Keyed on whether the button exists, not on every render: an inline ref callback
  // re-runs on each one and would drag focus back off the skip button.
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

  const reminderKey = canRetry
    ? 'answerPopup.skipWashUp'
    : (!isCorrect && attempt === 2 ? 'answerPopup.lastAttempt' : 'answerPopup.washUpNext')

  // A category is worth the same at every level, so these numbers give nothing away
  // about the microbe while a retry is still on offer.
  const score = scoreAnswer({
    attempt,
    roomCorrect: isLevelCorrect,
    equipmentSlots,
    previous: previousAnswer,
  })

  const pointsColor = { earned: '#1a8a34', missed: '#c51a1a', banked: '#6c757d' }

  const points = (entry) => (
    <span style={{ color: pointsColor[entry.state], whiteSpace: 'nowrap' }}>
      +{entry.points}
      {entry.state === 'banked' && (
        <span style={{ fontSize: '0.85em' }}> ({t('answerPopup.pointsBanked')})</span>
      )}
    </span>
  )

  const boxClass = `popup-box ${!isCorrect ? 'popup-box--incorrect' : ''}`

  return (
    <div className="popup-overlay">
      <div className={boxClass} role="dialog" aria-modal="true" ref={dialogRef} tabIndex={-1}>
        {!canRetry && (
          <button onClick={onClose} className="popup-close-button position-absolute top-0 end-0 m-3">
            {t('common.close')}
          </button>
        )}

        <h2 style={{ margin: '0 0 12px', color: headlineColor }}>{headline}</h2>
        <p style={{ margin: 0, fontSize: '1.05rem' }}>{feedback}</p>
        <p style={{ margin: '8px 0 0', fontSize: '0.95rem' }}>{equipmentFeedback}</p>
        {equipmentSlots && (
          <>
            <ul className="list-unstyled" style={{ margin: '8px 0 0', fontSize: '0.95rem' }}>
              {CATEGORY_IDS.map((id) => {
                const ok = equipmentSlots[id]?.status === 'ok'

                return (
                  <li key={id} className="d-flex justify-content-between gap-3">
                    <span style={{ color: ok ? '#1a8a34' : '#c51a1a' }}>
                      <span aria-hidden="true">{ok ? '✓' : '✗'}</span>{' '}
                      {t(CATEGORY_CONFIG[id].labelKey)}
                      <span className="visually-hidden">
                        {' '}
                        {ok ? t('answerPopup.slotCorrect') : t('answerPopup.slotIncorrect')}
                      </span>
                    </span>
                    {points(score.categories[id])}
                  </li>
                )
              })}
            </ul>
            <div className="d-flex justify-content-between gap-3" style={{ fontSize: '0.95rem' }}>
              <span style={{ color: isLevelCorrect ? '#1a8a34' : '#c51a1a' }}>
                <span aria-hidden="true">{isLevelCorrect ? '✓' : '✗'}</span>{' '}
                {t('answerPopup.pointsRoom')}
                <span className="visually-hidden">
                  {' '}
                  {isLevelCorrect ? t('answerPopup.slotCorrect') : t('answerPopup.slotIncorrect')}
                </span>
              </span>
              {points(score.room)}
            </div>
            <div
              className="d-flex justify-content-between gap-3"
              style={{
                margin: '8px 0 0',
                paddingTop: '8px',
                borderTop: '1px solid rgba(0, 0, 0, 0.2)',
                fontSize: '0.95rem',
                fontWeight: 'bold',
              }}
            >
              <span>{t('answerPopup.pointsTotal')}</span>
              <span>+{score.total}</span>
            </div>
          </>
        )}
        <p style={{ margin: '12px 0 0', fontSize: '0.95rem' }}>{t('answerPopup.chosenLevel').replace('{level}', level)}</p>
        {microbe && revealsAnswer && (
          <p style={{ margin: '4px 0 0', fontSize: '0.95rem' }}>
            {t('answerPopup.belongs')
                .replace('{name}', localized('common_name'))
                .replace('{level}', microbe.bsl_level)}
          </p>
        )}
        <p style={{ margin: '12px 0 0', fontSize: '0.95rem', fontStyle: 'italic' }}>
          {t(reminderKey)}
        </p>
        {canRetry && (
          <div className="d-flex gap-2 mt-3">
            <button ref={retryButton} onClick={onRetry} className="btn btn-primary">
              {t('answerPopup.tryAgain')}
            </button>
            <button onClick={onClose} className="btn btn-outline-secondary">
              {t('answerPopup.skipMicrobe')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default AnswerPopup