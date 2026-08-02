import { useTranslation } from '../i18n/context'
import { Container, Row, Col } from 'react-bootstrap';

function HowToPlay() {
  const { tList, t } = useTranslation()
  const steps = tList('howToPlay.steps')

  const midPoint = Math.ceil(steps.length / 2);
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