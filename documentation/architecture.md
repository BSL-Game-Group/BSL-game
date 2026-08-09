# Architecture

## System architecture

```mermaid
flowchart TB
    User[Player]

    subgraph Client["Client (Browser)"]
        React[React UI]
        Phaser[Phaser Game]
        Shared[Services / Utils / i18n]
    end

    subgraph Server["Application Server"]
        API[REST API]
        Logic[Game & user logic]
        Auth[Authentication / session]
    end

    subgraph Data["Data & Assets"]
        DB[(Database)]
        Media[(Static assets / media)]
    end

    User --> React
    User --> Phaser

    React --> Shared
    Phaser --> Shared

    Shared --> API
    API --> Logic
    API --> Auth
    Logic --> DB
    API --> Media
    React --> Media
```

## Deployment

- Docker
- Docker Compose

## Frontend

- React
- Vite
- Game engine: Phaser
- Bootstrap

### Frontend Component Diagram

```mermaid
graph TD

    User[Player]

    User --> ReactUI
    User --> PhaserGame

    subgraph Frontend
        ReactUI[React UI]
        App[App.jsx]
        Game[Game.jsx]

        Components[components/]
        GameLogic[game/]
        Services[services/]
        Utils[utils/]
        I18N[i18n/]
    end

    ReactUI --> App
    App --> Game
    App --> Components

    Game --> PhaserGame

    PhaserGame --> GameLogic

    Components --> Services
    Components --> Utils
    Components --> I18N

    Services --> Backend[(REST API)]
```

## Backend

- Sequalize
- PostreSQL
- Express

### Sequence diagram

Player choosing a equipment and dragging it on the character

```mermaid
sequenceDiagram
    actor Player
    participant InventoryUI as React Inventory UI
    participant GameScene as Phaser Game Scene
    participant Character as Character Entity
    participant GameState as Game State

    Player->>InventoryUI: Click equipment item
    InventoryUI->>InventoryUI: Mark item as selected

    Player->>InventoryUI: Drag selected item
    InventoryUI->>GameScene: emit dragStart(equipmentId, pointer)

    GameScene->>GameScene: Highlight valid character slots
    Player->>GameScene: Drop item on character

    GameScene->>Character: Validate drop target and slot
    Character-->>GameScene: Valid target

    GameScene->>GameState: equipItem(characterId, equipmentId, slot)
    GameState->>Character: Update equipment slot
    Character-->>GameState: Equipment updated

    GameState-->>GameScene: Success + inventory changed
    GameScene->>InventoryUI: Refresh inventory and character visuals
    InventoryUI-->>Player: Show equipped item feedback
```

### Entity relationship diagrams

### Class diagrams