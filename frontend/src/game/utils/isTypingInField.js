// Phaser's keyboard listener sits on the document and fires regardless of
// focus, so a key press meant for a text field (e.g. "E" while typing a
// username) would also trigger game interactions bound to the same key.
export function isTypingInField() {
    const el = document.activeElement;
    return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
}
