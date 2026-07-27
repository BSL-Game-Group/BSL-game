import { useEffect } from 'react'
import { useTranslation } from '../i18n/context'

function SidebarPopup({ open, onClose }) {
  const { t } = useTranslation()

  useEffect(() => {
    window.dispatchEvent(new Event(open ? 'popup-opened' : 'popup-closed'))
  }, [open])

  if (!open) {
    return null
  }

  return (
    <div className="popup-overlay">
      <div
        className="popup-box"
        style={{
          width: '88%',
          maxWidth: '620px',
          minHeight: '320px',
          gap: '20px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <button
          onClick={onClose}
          className="popup-close-button"
        >
          {t('common.close')}
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ margin: 0, color: '#000' }}>
            {t('lecturePanel.title')}
          </h2>

          <p style={{ margin: 0, color: '#000', fontSize: '1rem' }}>
            {t('lecturePanel.description')}
          </p>

          <ul style={{ margin: 0, paddingLeft: '20px', color: '#000' }}>
            <li>
              <a
                href="https://consteril.com/biosafety-levels-difference/"
                target="_blank"
                rel="noreferrer"
              >
                {t('lecturePanel.links.link1')}
              </a>
            </li>

            <li>
              <a
                href="https://www.ncbi.nlm.nih.gov/books/NBK535351/"
                target="_blank"
                rel="noreferrer"
              >
                {t('lecturePanel.links.link2')}
              </a>
            </li>

            <li>
              <a
                href="https://www.sciencedirect.com/science/chapter/monograph/pii/B9780128092316000119"
                target="_blank"
                rel="noreferrer"
              >
                {t('lecturePanel.links.link3')}
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default SidebarPopup