import { useEffect, useState } from 'react'
import { EventBus } from '../game/EventBus'
import { useTranslation } from '../i18n/context'

const Task = () => {
    const { t, language } = useTranslation()
    const [microbe, setMicrobe] = useState(null)
    const [undressRequired, setUndressRequired] = useState(false)

    useEffect(() => {
        const handleMicrobeUpdate = (microbe) => {
            setMicrobe({ ...microbe })
            setUndressRequired(false)
        }
        const handleUndressRequired = () => setUndressRequired(true)

        EventBus.on('current-microbe-updated', handleMicrobeUpdate)
        EventBus.on('undress-required', handleUndressRequired)

        return () => {
            EventBus.off('current-microbe-updated', handleMicrobeUpdate)
            EventBus.off('undress-required', handleUndressRequired)
        }
    }, [])

    if (undressRequired) {
        return <p className="task-undress-message">{t('task.undressRequired')}</p>
    }

    if (!microbe) {
        return null
    }

    const localized = (field) => {
        if (language === 'sv' || language === 'fi') {
            return microbe[`${field}_${language}`]
        }
        return microbe[field]
    }

    return (
        <div>
            <h2>{t('task.title')}</h2>

            <ul>
                <li>{localized('common_name')}</li>
                <li>{microbe.scientific_name}</li>
                <li>{localized('type')}</li>
                <li>{localized('lecture_text')}</li>
            </ul>
        </div>
    )
}

export default Task