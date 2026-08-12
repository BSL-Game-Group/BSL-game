import { useTranslation } from '../i18n/context'

// Pinned to the viewport rather than placed in a column: the sidebar is being
// deleted and the game goes full-screen, so nothing in the HUD may depend on a
// layout cell existing. Same trick LanguageSelector uses for the other corner.
//
// role="status" on the container, not on each line: a screen reader should hear
// "Score: 3, Microbes: 5" as one update rather than two competing ones.
function ScoreHud({ score, answered }) {
  const { t } = useTranslation()

  return (
      <div className="score-hud" data-testid="score-hud" role="status">
        <span className="score-hud__score">{t('hud.score').replace('{score}', score)}</span>
        <span className="score-hud__count">
          {t('hud.microbes').replace('{count}', answered)}
        </span>
      </div>
  )
}

export default ScoreHud
