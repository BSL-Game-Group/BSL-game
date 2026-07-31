import { useEffect, useState } from 'react'
import bslMaterialService from '../services/bslMaterial'
import { useTranslation } from '../i18n/context'

function SidebarPopup({ open, onClose }) {
  const { t, tList, language } = useTranslation()
  const [material, setMaterial] = useState(null)

  useEffect(() => {
    window.dispatchEvent(new Event(open ? 'popup-opened' : 'popup-closed'))
  }, [open])

  useEffect(() => {
    if (!open) {
      return undefined
    }
    let cancelled = false
    bslMaterialService.getMaterial(language).then((data) => {
      if (!cancelled) {
        setMaterial(data)
      }
    })
    return () => { cancelled = true }
  }, [open, language])

  if (!open) {
    return null
  }

  const tableHeaders = tList('bslMaterial.tableHeaders')

  if (!material) {
    return (
      <div className="popup-overlay">
        <div className="popup-box w-75 mw-100 h-auto d-flex flex-column">
          <button
            onClick={onClose}
            className="popup-close-button"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    )
  }

  const { intro, riskGroups, bslLevels, organismTables, sources } = material

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
          <h2 style={{ margin: 0 }}>{t('bslMaterial.title')}</h2>

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
              <p style={{ fontSize: '0.95rem', margin: '8px 0 4px' }}><strong>{t('bslMaterial.protectiveEquipment')}</strong></p>
              <ul>
                {lvl.equipment.map((e) => <li key={e}>{e}</li>)}
              </ul>
              <p style={{ fontSize: '0.95rem' }}><strong>{t('bslMaterial.exampleOrganisms')}</strong> {lvl.examples}</p>
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
                      {tableHeaders.map((h) => (
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
            <h3>{t('bslMaterial.sources')}</h3>
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