/** Simple 8x8 grayscale pixel grid for display. */
export default function PixelGrid({ pixels, size = 8, cellSize = 6 }) {
  if (!pixels || pixels.length === 0) return null

  return (
    <div
      className="inline-grid border border-slate-200"
      style={{
        gridTemplateColumns: `repeat(${size}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${size}, ${cellSize}px)`,
      }}
    >
      {pixels.flat().map((val, i) => {
        const intensity = Math.round((1 - val / 16) * 255)
        return (
          <div
            key={i}
            style={{
              width: cellSize,
              height: cellSize,
              backgroundColor: `rgb(${intensity},${intensity},${intensity})`,
            }}
          />
        )
      })}
    </div>
  )
}
