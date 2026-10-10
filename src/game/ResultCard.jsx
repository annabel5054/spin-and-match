// Card shown over the ball when a level ends: a heading, a line of text, and one button.
export default function ResultCard({ title, children, button, onClick }) {
  return (
    <div className="sam-win" role="status">
      <div className="sam-win-card">
        <h2>{title}</h2>
        <p>{children}</p>
        <button type="button" className="sam-btn" onClick={onClick}>
          {button}
        </button>
      </div>
    </div>
  );
}
