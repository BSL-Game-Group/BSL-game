import { useTranslation } from '../i18n/context'
import { Container, Row, Col } from 'react-bootstrap';

function HowToPlay() {
  const { tList, t } = useTranslation()
  const steps = tList('howToPlay.steps')

  // Split where the columns come closest to equal TEXT length, not at the halfway
  // step: the steps differ enough in length that an even count left the right column
  // visibly taller. Recomputed per language, since the translations differ in length.
  const totalLength = steps.reduce((sum, step) => sum + step.length, 0);

  let midPoint = steps.length;
  let smallestGap = Infinity;
  let leftLength = 0;

  for (let i = 0; i < steps.length - 1; i += 1) {
    leftLength += steps[i].length;
    const gap = Math.abs(totalLength - 2 * leftLength);

    if (gap < smallestGap) {
      smallestGap = gap;
      midPoint = i + 1;
    }
  }

  const firstHalf = steps.slice(0, midPoint);
  const secondHalf = steps.slice(midPoint);

  return (
    <section className="game-instructions">
      <h2>{t('howToPlay.title')}</h2>
      
      <Container fluid>
        <Row>
          <Col xs={12} md={6}>
            <ol className="instruction-steps">
              {firstHalf.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          </Col>
          <Col xs={12} md={6}>
            <ol className="instruction-steps" style={{ counterReset: `step ${firstHalf.length}` }}>
              {secondHalf.map((step, index) => (
                <li key={index + firstHalf.length}>{step}</li>
              ))}
            </ol>
          </Col>
        </Row>
      </Container>

      <p className="game-instructions__controls">
        {t('howToPlay.controls')}
      </p>
    </section>
  )
}

export default HowToPlay