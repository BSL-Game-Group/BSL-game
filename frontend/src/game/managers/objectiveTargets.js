// Maps an objective's symbolic target (from resolveObjective) to a world
// point in the scene, using the same interaction points the hints already
// point at. Pure with respect to its `scene` argument: reads only known
// properties, no Phaser calls — a plain object with the right shape is
// enough to test it.
export function targetWorldPoint(scene, target) {
  if (!target || !scene) {
    return null
  }

  if (target.startsWith('BSL-')) {
    const entry = scene.bslGlows?.find((glow) => glow.key === target)
    return entry?.center ?? null
  }

  switch (target) {
    case 'lectureRoom':
      return scene.lecturePoint ?? null
    case 'dressingRoom':
      // Same offset DressingRoomInteraction uses to find the closet's center
      // from its top-left zone.
      return scene.closetZone
        ? { x: scene.closetZone.x + 35, y: scene.closetZone.y + 60 }
        : null
    case 'showerRoom':
      return scene.undressPoint ?? null
    default:
      return null
  }
}
