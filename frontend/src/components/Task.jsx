import { useEffect, useState } from 'react'
import { EventBus } from '../game/EventBus'

const Task = () => {
    const [microbe, setMicrobe] = useState(null)

    useEffect(() => {
        const handleMicrobeUpdate = (microbe) => {
            setMicrobe({...microbe})
        }

        EventBus.on('current-microbe-updated', handleMicrobeUpdate)

        return () => {
            EventBus.off('current-microbe-updated', handleMicrobeUpdate)
        }
    }, [])

    if (microbe !== null) return (
        <div>
            <h2>The microbe you will handle</h2>
            <ul>
                <li>{microbe.common_name}</li>
                <li>{microbe.scientific_name}</li>
                <li>{microbe.type}</li>
                <li>{microbe.lecture_text}</li>
            </ul>
        </div>
    )
}

export default Task