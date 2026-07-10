import { useEffect } from 'react'
import { useTranslation } from '../../i18n/context'

function AnswerPopup({ open, onClose, isCorrect, level, microbe }) {
  // Lock player movement while the verdict is showing (Phaser listens for these).
  useEffect(() => {
    window.dispatchEvent(new Event(open ? 'popup-opened' : 'popup-closed'))
  }, [open])

const { t, language } = useTranslation()

if (!open) {
  return null
}

  const headline = isCorrect
  ? t('answerPopup.correct')
  : t('answerPopup.incorrect')

  const headlineColor = isCorrect ? '#1a8a34' : '#c51a1a'

  // With a microbe loaded, use the backend's feedback text; otherwise fall back
  // to a generic verdict. The chosen room is always shown for context.
  const feedback = microbe
      ? (
          isCorrect
            ? (
                language === 'sv'
                  ? microbe.feedback_correct_sv
                  : microbe.feedback_correct
              )
            : (
                language === 'sv'
                  ? microbe.feedback_incorrect_sv
                  : microbe.feedback_incorrect
              )
        )
      : (
          isCorrect
            ? t('answerPopup.correctFallback')
            : t('answerPopup.incorrectFallback')
        )

  return (
      <div className="popup-overlay">
        <div className="popup-box">
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '12px', right: '12px', padding: '8px 16px',
            backgroundColor: '#c51a1a', color: '#fff', border: '1px solid #ccc',
            borderRadius: '4px', cursor: 'pointer', zIndex: 10,
          }}
        >
          {t('common.close')}
        </button>

        <h2 style={{ margin: '0 0 12px', color: headlineColor }}>{headline}</h2>
        <p style={{ margin: 0, fontSize: '1.05rem' }}>{feedback}</p>
        <p style={{ margin: '12px 0 0', fontSize: '0.95rem' }}>{t('answerPopup.chosenLevel').replace('{level}', level)}</p>
        {microbe && (
          <p style={{ margin: '4px 0 0', fontSize: '0.95rem' }}>
            {
              t('answerPopup.belongs')
                .replace(
                  '{name}',
                  language === 'sv'
                    ? microbe.common_name_sv
                    : microbe.common_name
                )
                .replace('{level}', microbe.bsl_level)
            }
          </p>
        )}
      </div>
    </div>
  )
}

export default AnswerPopup
