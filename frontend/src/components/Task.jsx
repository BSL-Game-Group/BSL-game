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

    return (
        <div>
            <h2>{t('task.title')}</h2>

            <ul>
                <li>
                    {language === 'sv'
                        ? microbe.common_name_sv
                        : microbe.common_name}
                </li>

                <li>{microbe.scientific_name}</li>

                <li>
                    {language === 'sv'
                        ? microbe.type_sv
                        : microbe.type}
                </li>

                <li>
                    {language === 'sv'
                        ? microbe.lecture_text_sv
                        : microbe.lecture_text}
                </li>
            </ul>
        </div>
    )
}

export default Task