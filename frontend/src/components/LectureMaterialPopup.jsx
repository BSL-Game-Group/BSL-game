import { useEffect, useState } from 'react'
import { useTranslation } from '../i18n/context'
import bslMaterialService from '../services/bslMaterial'

function LectureMaterialPopup({ open, onClose }) {
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
    setMaterial(null)

    bslMaterialService.getMaterial(language).then((data) => {
      if (!cancelled) {
        setMaterial(data)
      }
    })

    return () => {
      cancelled = true
    }
  }, [open, language])

  if (!open) {
    return null
  }

  const tableHeaders = tList('bslMaterial.tableHeaders')

  return (
    <div className="popup-overlay">
      <div
        className="popup-box"
        style={{
          width: '92%',
          maxWidth: '820px',
          minHeight: '320px',
          maxHeight: '85vh',
          gap: '20px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <button className="popup-close-button" onClick={onClose}>
          {t('common.close')}
        </button>

        {material === null ? (
          <div style={{ padding: '20px' }}>
            <h2>{t('bslMaterial.title')}</h2>
            <p>{t('common.loading') ?? 'Loading...'}</p>
          </div>
        ) : (
          <div style={{ overflowY: 'auto', color: '#000', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ margin: 0 }}>{t('bslMaterial.title')}</h2>

            <section>
              <h3>{material.intro.heading}</h3>
              {material.intro.paragraphs.map((p) => (
                <p key={p.slice(0, 20)} style={{ fontSize: '0.95rem', lineHeight: 1.5 }}>{p}</p>
              ))}
            </section>

            <section>
              <h3>{material.riskGroups.heading}</h3>
              <p style={{ fontSize: '0.95rem' }}>{material.riskGroups.intro}</p>
              <ol>
                {material.riskGroups.factors.map((f) => <li key={f}>{f}</li>)}
              </ol>
            </section>

            {material.bslLevels.map((lvl) => (
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

            {material.organismTables.map((table) => (
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
                {material.sources.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} target="_blank" rel="noreferrer">{s.text}</a>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}

export default LectureMaterialPopup
