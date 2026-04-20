export function calcLine(line, config) {
  const { type, heading, fabric, lining, material, width, drop } = line
  if (!type || !width || !drop) return null
  const w = parseFloat(width)
  const d = parseFloat(drop)
  if (!w || !d) return null
  const buf = config.buffer / 100

  if (type === 'Sheer' || type === 'Drape') {
    if (!heading || !fabric) return null
    const fab = config.fabrics.find(f => f.name === fabric)
    if (!fab) return null
    const wM = w / 1000, dM = d / 1000
    const usage = 2.5 * wM * dM
    const fabMid = (fab.min + fab.max) / 2
    const fabCost = usage * fabMid
    const makeCost = usage * config.make
    const liningCost = lining ? usage * config.lining : 0
    const trackCfg = heading === 'Wavefold' ? config.wavefold : config.pinch
    const trackW = Math.max(w, trackCfg.min)
    const trackCost = trackCfg.fixed + trackCfg.perMm * trackW
    const installCost = type === 'Sheer' ? config.install.sheer : config.install.drape
    const base = fabCost + makeCost + liningCost + trackCost + installCost
    const liningTag = lining ? ' + lining' : ''
    return {
      low: base * (1 - buf / 2),
      high: base * (1 + buf / 2),
      desc: `${heading} · ${fabric}${liningTag} · ${wM.toFixed(2)}m × ${dM.toFixed(2)}m`,
    }
  }

  if (type === 'Roller blind') {
    if (!config.rollerSqm) return null
    const sqm = (w / 1000) * (d / 1000)
    const base = sqm * config.rollerSqm + config.install.roller
    return {
      low: base * (1 - buf / 2),
      high: base * (1 + buf / 2),
      desc: `Roller blind · ${sqm.toFixed(2)}m²`,
    }
  }

  if (type === 'Shutter') {
    if (!material) return null
    const sqm = (w / 1000) * (d / 1000)
    const rate = material === 'Basswood' ? config.shutterBass : config.shutterPvc
    const base = sqm * rate + config.install.shutter
    return {
      low: base * (1 - buf / 2),
      high: base * (1 + buf / 2),
      desc: `${material} shutter · ${sqm.toFixed(2)}m²`,
    }
  }

  return null
}

export function fmt(n) {
  return Math.round(n).toLocaleString('en-AU')
}
