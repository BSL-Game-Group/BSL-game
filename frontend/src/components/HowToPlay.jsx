// The "How to play" instructions, shared between the start screen and the info
// desk popup so both always show exactly the same steps.
import { useTranslation } from '../i18n/context'

function HowToPlay() {
  const { tList, t } = useTranslation()
  const steps = tList('howToPlay.steps')
  return (
    <section className="game-instructions">
      <h2>{t('howToPlay.title')}</h2>
      <ol className="instruction-steps">
        {steps.map((step, index) => (
          <li key={index}>{step}</li>
        ))}
      </ol>
      <p className="game-instructions__controls">
        {t('howToPlay.controls')}
      </p>
    </section>
  )
}

export default HowToPlay
