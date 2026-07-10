import { useEffect } from 'react'
import { intro, riskGroups, bslLevels, organismTables, sources } from '../data/bslMaterial'
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
          width: '92%', maxWidth: '820px', minHeight: '320px', maxHeight: '85vh', gap: '20px',
          display: 'flex', flexDirection: 'column',
        }}
      >
        <button
          onClick={onClose}
          className="popup-close-button"
        >
          {t('common.close')}
        </button>

        <div style={{ overflowY: 'auto', color: '#000', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ margin: 0 }}>BSL Game Material (Biosafety Levels)</h2>

          <section>
            <h3>{intro.heading}</h3>
            {intro.paragraphs.map((p) => (
              <p key={p.slice(0, 20)} style={{ fontSize: '0.95rem', lineHeight: 1.5 }}>{p}</p>
            ))}
          </section>

          <section>
            <h3>{riskGroups.heading}</h3>
            <p style={{ fontSize: '0.95rem' }}>{riskGroups.intro}</p>
            <ol>
              {riskGroups.factors.map((f) => <li key={f}>{f}</li>)}
            </ol>
          </section>

          {bslLevels.map((lvl) => (
            <section key={lvl.level}>
              <h3>{lvl.title}</h3>
              <p style={{ fontSize: '0.95rem', lineHeight: 1.5 }}>{lvl.description}</p>
              <p style={{ fontSize: '0.95rem', margin: '8px 0 4px' }}><strong>Protective equipment:</strong></p>
              <ul>
                {lvl.equipment.map((e) => <li key={e}>{e}</li>)}
              </ul>
              <p style={{ fontSize: '0.95rem' }}><strong>Example organisms:</strong> {lvl.examples}</p>
            </section>
          ))}

          {organismTables.map((table) => (
            <section key={table.level}>
              <h3>{table.heading}</h3>
              {table.note && <p style={{ fontSize: '0.85rem', fontStyle: 'italic' }}>{table.note}</p>}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      {['#', 'Common name', 'Scientific name', 'Type', 'Note'].map((h) => (
                        <th key={h} style={{ textAlign: 'left', borderBottom: '2px solid #0b6623', padding: '4px 8px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {table.rows.map((row) => (
                      <tr key={row[0]}>
                        {row.map((cell, i) => (
                          <td key={i} style={{ borderBottom: '1px solid #ddd', padding: '4px 8px' }}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}

          <section>
            <h3>Sources</h3>
            <ul>
              {sources.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noreferrer">{s.text}</a>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}

export default SidebarPopup