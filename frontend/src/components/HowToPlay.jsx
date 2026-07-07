// The "How to play" instructions, shared between the start screen and the info
// desk popup so both always show exactly the same steps.
function HowToPlay() {
  return (
    <section className="game-instructions">
      <h2>How to play</h2>
      <ol className="instruction-steps">
        <li>If you need to reread these instructions, visit the <strong>INFO</strong> desk in the corridor.</li>
        <li>Remember the BSL level — it decides everything.</li>
        <li>Go to the lecture room to read the microbe&apos;s details and its BSL level.</li>
        <li>In the lecture room you can also study the materials to learn about different microbes and BSL classes (1–4).</li>
        <li>Go to the dressing room and open the closet (press <kbd>E</kbd>).</li>
        <li>Put on the protective equipment the level requires (lab coat, mask, glasses…).</li>
        <li>Go to the matching BSL room (1–4).</li>
        <li>Press <kbd>E</kbd> at the dark green ring to handle the microbe.</li>
        <li>The game checks your work — were the equipment and room correct for this microbe?</li>
        <li>Wash up at the shower or eyewash station to decontaminate before leaving.</li>
        <li>A new microbe is drawn — try again!</li>
        <li>After several rounds, see your summary: score, correct vs. wrong, and the levels you mastered.</li>
        <li>You can leave any time through the Exit — the game shuts down.</li>
      </ol>
      <p className="game-instructions__controls">
        <strong>Controls:</strong> Arrow keys / click to move · <kbd>E</kbd> or click to interact · <strong>Close</strong> button to close windows
      </p>
    </section>
  )
}

export default HowToPlay
