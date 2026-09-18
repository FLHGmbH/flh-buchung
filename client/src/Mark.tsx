export function Mark({ invert = false, word = true }: { invert?: boolean; word?: boolean }) {
  const fill = invert ? "#fff" : "#006478";
  return (
    <div className="mark">
      <svg width="56" height="56" viewBox="0 0 64 64" aria-hidden="true">
        <path d="M32 4 56 18v28L32 60 8 46V18L32 4Z" fill={fill} />
        <path d="M22 24h12v3.2H26.2V31H33v3.2h-6.8V40H22V24Zm14 0h4.2v12.8H46V40H36V24Z" fill={invert ? "#006478" : "#fff"} />
        <rect x="46" y="8" width="5" height="5" fill="#FF9600" />
        <rect x="52" y="13" width="5" height="5" fill="#FF9600" />
        <rect x="46" y="14" width="5" height="5" fill="#FF9600" />
        <rect x="52" y="19" width="5" height="5" fill="#FF9600" />
      </svg>
      {word ? (
        <div className="mark-word" style={{ color: invert ? "#fff" : "#006478" }}>
          FLH <span>DIGITAL</span>
        </div>
      ) : null}
    </div>
  );
}
