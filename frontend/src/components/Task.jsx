import { useEffect, useState } from 'react'
import { EventBus } from '../game/EventBus'
import { useTranslation } from '../i18n/context'

const Task = () => {
    const { t, language } = useTranslation()
    const [microbe, setMicrobe] = useState(null)

    useEffect(() => {
        const handleMicrobeUpdate = (microbe) => {
            setMicrobe({ ...microbe })
        }

        EventBus.on('current-microbe-updated', handleMicrobeUpdate)

        return () => {
            EventBus.off('current-microbe-updated', handleMicrobeUpdate)
        }
    }, [])

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