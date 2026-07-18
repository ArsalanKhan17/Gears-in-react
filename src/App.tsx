import { useMemo, useState, type CSSProperties } from 'react'

type GearId = 'input' | 'large' | 'small' | 'output'
type Gear = { id: GearId; label: string; size: number; color: string }

const palette = ['#f6c84c', '#5e84f6', '#ee7267', '#50c5a6', '#a87cf0']

const initialGears: Gear[] = [
  { id: 'input', label: 'Input gear', size: 36, color: '#f6c84c' },
  { id: 'large', label: 'Large compound gear', size: 48, color: '#9fb2cc' },
  { id: 'small', label: 'Small compound gear', size: 24, color: '#6f85a2' },
  { id: 'output', label: 'Output gear', size: 36, color: '#5e84f6' },
]

function gearPath(radius: number, teeth: number) {
  const points: string[] = []
  const steps = teeth * 4
  for (let i = 0; i < steps; i += 1) {
    const phase = i % 4
    const r = phase === 0 || phase === 3 ? radius : radius * 0.84
    const angle = (i / steps) * Math.PI * 2 - Math.PI / 2
    points.push(`${(Math.cos(angle) * r).toFixed(2)},${(Math.sin(angle) * r).toFixed(2)}`)
  }
  return `M ${points.join(' L ')} Z`
}

function GearShape({ gear, speed, paused, position, selected }: { gear: Gear; speed: number; paused: boolean; position: [number, number]; selected: boolean }) {
  const [x, y] = position
  const teeth = Math.max(10, Math.round(gear.size / 2.25))
  const labelOffset = gear.id === 'input'
    ? { x: -38, y: -gear.size - 34 }
    : gear.id === 'large'
      ? { x: -22, y: -gear.size - 30 }
      : gear.id === 'small'
        ? { x: gear.size + 48, y: gear.size + 42 }
        : { x: 0, y: -gear.size - 28 }
  return (
    <g transform={`translate(${x} ${y})`} className={paused ? 'paused' : undefined}>
      {selected && (
        <g className="selection-halo" aria-label={`${gear.label} selected`}>
          <circle r={gear.size + 10} />
          <circle r={gear.size + 15} className="selection-pulse" />
          <text x={labelOffset.x} y={labelOffset.y}>CONFIGURING</text>
        </g>
      )}
      <g className="spin" style={{ '--speed': `${Math.max(0.45, 12 / Math.abs(speed || 0.1))}s`, '--direction': speed >= 0 ? 'normal' : 'reverse' } as CSSProperties}>
        <path d={gearPath(gear.size, teeth)} fill={gear.color} stroke="currentColor" strokeWidth="2.5" className="gear-body" />
        <circle r={gear.size * 0.56} fill="none" stroke="rgba(22, 48, 83, .18)" strokeWidth="2" />
        <path d={`M 0 0 L ${gear.size * .78} 0`} stroke="rgba(22, 48, 83, .23)" strokeWidth="2" strokeDasharray="3 5" />
        <circle r={gear.size * 0.16} fill="#fff" stroke="currentColor" strokeWidth="2" />
      </g>
    </g>
  )
}

function App() {
  const [gears, setGears] = useState(initialGears)
  const [selected, setSelected] = useState<GearId>('input')
  const [paused, setPaused] = useState(false)
  const [lesson, setLesson] = useState<'basics' | 'compound'>('compound')

  const gear = gears.find((item) => item.id === selected)!
  const input = gears[0]
  const large = gears[1]
  const small = gears[2]
  const output = gears[3]

  const speeds = useMemo(() => ({
    input: 1,
    large: -input.size / large.size,
    small: -input.size / large.size,
    output: (input.size / large.size) * (small.size / output.size),
  }), [input.size, large.size, small.size, output.size])

  const basicOutputSpeed = -input.size / output.size
  const outputSpeed = lesson === 'compound' ? speeds.output : basicOutputSpeed
  const visibleGears = lesson === 'compound' ? gears : [input, output]

  const layout = useMemo(() => {
    const axle: [number, number] = [395, 220]
    const positionAt = (angle: number, distance: number): [number, number] => [
      axle[0] + Math.cos(angle) * distance,
      axle[1] + Math.sin(angle) * distance,
    ]
    return {
      axle,
      input: positionAt((145 * Math.PI) / 180, input.size + large.size - 4),
      output: positionAt((-38 * Math.PI) / 180, small.size + output.size - 4),
      basicInput: [300, 220] as [number, number],
      basicOutput: [300 + input.size + output.size - 4, 220] as [number, number],
    }
  }, [input.size, large.size, small.size, output.size])

  const updateSelected = (patch: Partial<Gear>) => setGears((items) => items.map((item) => item.id === selected ? { ...item, ...patch } : item))
  const reset = () => { setGears(initialGears); setSelected('input'); setPaused(false) }
  const percentage = Math.round(Math.abs(outputSpeed) * 100)

  return (
    <main>
      <header className="topbar">
        <div className="brand"><span className="brand-mark">✦</span><span>GEAR LAB</span></div>
        <div className="lesson-pill"><span className="pulse" /> Interactive physics lesson</div>
        <button className="reset-button" onClick={reset}>↻ Reset lab</button>
      </header>

      <section className="intro">
        <p className="eyebrow">MECHANICS 101 · LESSON 03</p>
        <h1>Gears turn force into motion.</h1>
        <p>Change the gears, watch the teeth mesh, and discover what happens when two gears share one axle.</p>
      </section>

      <nav className="lesson-tabs" aria-label="Lesson type">
        <button className={lesson === 'basics' ? 'active' : ''} onClick={() => { setLesson('basics'); setSelected('input') }}>01 <span>Gear basics</span></button>
        <button className={lesson === 'compound' ? 'active' : ''} onClick={() => { setLesson('compound'); setSelected('input') }}>02 <span>Compound gears</span></button>
      </nav>

      <section className="lab-grid">
        <aside className="control-card">
          <div className="card-heading"><span>BUILD YOUR SYSTEM</span><span className="step">STEP 1</span></div>
          <h2>Pick a gear to customize</h2>
          <div className="gear-selectors">
            {visibleGears.map((item) => (
              <button key={item.id} className={`gear-selector ${selected === item.id ? 'selected' : ''}`} onClick={() => setSelected(item.id)}>
                <span className="selector-dot" style={{ background: item.color }} />
                <span><b>{item.id === 'input' ? 1 : item.id === 'large' ? 2 : item.id === 'small' ? 3 : lesson === 'basics' ? 2 : 4}</b>{item.id === 'large' || item.id === 'small' ? `${item.id === 'large' ? 'Large' : 'Small'} axle gear` : item.label}</span>
              </button>
            ))}
          </div>

          <div className="control-group">
            <label>COLOR <strong>{gear.label}</strong></label>
            <div className="color-row">
              {palette.map((color) => <button key={color} aria-label={`Set color ${color}`} className={`color-swatch ${gear.color === color ? 'chosen' : ''}`} style={{ background: color }} onClick={() => updateSelected({ color })} />)}
            </div>
          </div>
          <div className="control-group">
            <label>SIZE <strong>{gear.size} teeth</strong></label>
            <div className="size-buttons">
              {[24, 36, 48].map((size) => <button key={size} className={gear.size === size ? 'selected' : ''} onClick={() => updateSelected({ size })}>{size === 24 ? 'Small' : size === 36 ? 'Medium' : 'Large'}<span>{size} teeth</span></button>)}
            </div>
          </div>
          <p className="tip"><b>Try this:</b> Make the output gear small. What changes?</p>
        </aside>

        <section className="stage-card">
          <div className="stage-head">
            <div><p className="eyebrow">LIVE MODEL</p><h2>{lesson === 'compound' ? 'A compound gear train' : 'A simple gear pair'}</h2></div>
            <button className="play-button" onClick={() => setPaused(!paused)}>{paused ? '▶ Play' : 'Ⅱ Pause'}</button>
          </div>
          <div className="gear-stage">
            <svg viewBox="0 0 750 430" role="img" aria-label="Animated compound gear system">
              <defs><pattern id="dots" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="#dce7f2" /></pattern></defs>
              <rect width="750" height="430" fill="url(#dots)" rx="20" />
              {lesson === 'compound' ? <>
                <path d={`M ${layout.input.join(' ')} L ${layout.axle.join(' ')} L ${layout.output.join(' ')}`} className="force-line" />
                <GearShape gear={input} speed={speeds.input} paused={paused} position={layout.input} selected={selected === 'input'} />
                <GearShape gear={large} speed={speeds.large} paused={paused} position={layout.axle} selected={selected === 'large'} />
                <GearShape gear={small} speed={speeds.small} paused={paused} position={layout.axle} selected={selected === 'small'} />
                <GearShape gear={output} speed={speeds.output} paused={paused} position={layout.output} selected={selected === 'output'} />
                <text x={layout.axle[0]} y={layout.axle[1] + Math.max(large.size, small.size) + 38} className="compound-label">same axle</text>
              </> : <>
                <path d={`M ${layout.basicInput.join(' ')} L ${layout.basicOutput.join(' ')}`} className="force-line" />
                <GearShape gear={input} speed={1} paused={paused} position={layout.basicInput} selected={selected === 'input'} />
                <GearShape gear={output} speed={basicOutputSpeed} paused={paused} position={layout.basicOutput} selected={selected === 'output'} />
              </>}
              <g className="annotation"><rect x="59" y="342" width="150" height="42" rx="10" /><text x="75" y="360">INPUT</text><text x="75" y="376">1 rotation / sec</text></g>
              <g className="annotation"><rect x="526" y="46" width="156" height="42" rx="10" /><text x="542" y="64">OUTPUT</text><text x="542" y="80">{Math.abs(outputSpeed).toFixed(2)} rotations / sec</text></g>
            </svg>
          </div>
          <div className="stage-footer"><span><i className="arrow" style={{ background: input.color }} /> Input turns clockwise</span><span><i className="arrow" style={{ background: output.color }} /> Output turns {lesson === 'compound' ? 'clockwise' : 'counterclockwise'}</span>{lesson === 'compound' ? <span>● Gears on the same axle turn together</span> : <span>↔ Meshed gears always turn opposite ways</span>}</div>
        </section>
      </section>

      <section className="concept-card">
        <div className="concept-number">02</div>
        <div><p className="eyebrow">THE BIG IDEA</p><h2>{lesson === 'compound' ? 'Compound gears can change speed twice.' : 'One gear mesh reverses the direction.'}</h2><p>{lesson === 'compound' ? 'The large and small center gears are locked to the same axle, so they always rotate at the same speed. But each one can have a different number of teeth — creating a second gear ratio.' : 'When two gears mesh, their teeth push in opposite directions. A smaller output gear spins faster; a larger output gear spins slower.'}</p></div>
        <div className="math-card"><span>OUTPUT SPEED</span><strong>{percentage}%</strong><p>of input speed</p><div className="formula">{lesson === 'compound' ? `${input.size} ÷ ${large.size} × ${small.size} ÷ ${output.size}` : `${input.size} ÷ ${output.size}`}</div></div>
      </section>
    </main>
  )
}

export default App
