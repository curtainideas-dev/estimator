import { lookupRollerPrice } from './rollerGrids'

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
    const wM = w / 1000
    const dM = d / 1000
    const fullness = config.fullness || 2.5
    const maxFabW = (config.maxFabricWidth || 2700) / 1000
    let usage
    if (dM <= maxFabW) {
      usage = fullness * wM
    } else {
      const drops = Math.ceil(wM / maxFabW)
      usage = fullness * drops * dM
    }
    const fabMid = (fab.min + fab.max) / 2
    const fabCost = usage * fabMid
    const makeCost = usage * config.make
    const hemSaving = line.noHem ? usage * (config.hemReduction || 0) : 0
    const liningCost = lining ? usage * config.lining : 0
    const trackCfg = heading === 'Wavefold' ? config.wavefold : config.pinch
    const trackW = Math.max(w, trackCfg.min)
    const trackCost = trackCfg.fixed + (trackW > trackCfg.min ? (trackW - trackCfg.min) * trackCfg.perMm : 0)
    const installCost = type === 'Sheer' ? config.install.sheer : config.install.drape
    const base = fabCost + makeCost - hemSaving + liningCost + trackCost + installCost
    return {
      low: base * (1 - buf / 2),
      high: base * (1 + buf / 2),
      install: installCost * (1 - buf / 2),
      installHigh: installCost * (1 + buf / 2),
      desc: `${heading} · ${fabric}${lining ? ' + lining' : ''} · ${wM.toFixed(2)}m × ${dM.toFixed(2)}m`,
    }
  }

  if (type === 'Roller blind') {
    if (!line.rollerCategory) return null
    const blindPrice = lookupRollerPrice(line.rollerCategory, w, d, config.rollerGrids)
    if (blindPrice === null) return null
    const motorCost = line.motorised ? (config.motorisation || 200) : 0
    const installCost = config.install.roller
    const base = blindPrice + installCost + motorCost
    return {
      low: base * (1 - buf / 2),
      high: base * (1 + buf / 2),
      install: installCost * (1 - buf / 2),
      installHigh: installCost * (1 + buf / 2),
      desc: `Roller blind · ${line.rollerCategory}${line.motorised ? ' · motorised' : ''} · ${(w/1000).toFixed(2)}m × ${(d/1000).toFixed(2)}m`,
    }
  }

  if (type === 'Shutter') {
    if (!material) return null
    const sqm = (w / 1000) * (d / 1000)
    const rate = material === 'Basswood' ? config.shutterBass : config.shutterPvc
    const panelCount = Math.ceil(w / (config.maxPanelWidth || 750))
    const shutterCost = sqm * rate
    const installCost = panelCount * config.install.shutter
    const base = shutterCost + installCost
    return {
      low: base * (1 - buf / 2),
      high: base * (1 + buf / 2),
      install: installCost * (1 - buf / 2),
      installHigh: installCost * (1 + buf / 2),
      desc: `${material} shutter · ${sqm.toFixed(2)}m² · ${panelCount} panel${panelCount > 1 ? 's' : ''}`,
    }
  }

  return null
}

export function fmt(n) {
  return Math.round(n).toLocaleString('en-AU')
}

export function calcLineBreakdown(line, config) {
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
    const wM = w / 1000
    const dM = d / 1000
    const fullness = config.fullness || 2.5
    const maxFabW = (config.maxFabricWidth || 2700) / 1000
    let usage, usageDesc
    if (dM <= maxFabW) {
      usage = fullness * wM
      usageDesc = `${usage.toFixed(2)}lm (single drop)`
    } else {
      const drops = Math.ceil(wM / maxFabW)
      usage = fullness * drops * dM
      usageDesc = `${usage.toFixed(2)}lm (${drops} drop${drops > 1 ? 's' : ''})`
    }
    const fabMid = (fab.min + fab.max) / 2
    const fabCost = usage * fabMid
    const makeCost = usage * config.make
    const hemSaving = line.noHem ? usage * (config.hemReduction || 0) : 0
    const liningCost = lining ? usage * config.lining : 0
    const trackCfg = heading === 'Wavefold' ? config.wavefold : config.pinch
    const trackW = Math.max(w, trackCfg.min)
    const trackCost = trackCfg.fixed + (trackW > trackCfg.min ? (trackW - trackCfg.min) * trackCfg.perMm : 0)
    const installCost = type === 'Sheer' ? config.install.sheer : config.install.drape
    const base = fabCost + makeCost - hemSaving + liningCost + trackCost + installCost
    return {
      components: [
        { label: `Fabric (${fabric}, ${usageDesc} @ $${fabMid}/lm)`, value: fabCost },
        { label: `Make cost (${usageDesc})`, value: makeCost },
        ...(hemSaving > 0 ? [{ label: `No bottom hem saving (${usageDesc})`, value: -hemSaving }] : []),
        ...(lining ? [{ label: `Lining (${usageDesc})`, value: liningCost }] : []),
        { label: `${heading} track (${(trackW / 1000).toFixed(2)}m)`, value: trackCost },
        { label: 'Installation', value: installCost },
      ],
      base,
      low: base * (1 - buf / 2),
      high: base * (1 + buf / 2),
    }
  }

  if (type === 'Roller blind') {
    if (!line.rollerCategory) return null
    const blindPrice = lookupRollerPrice(line.rollerCategory, w, d, config.rollerGrids)
    if (blindPrice === null) return null
    const motorCost = line.motorised ? (config.motorisation || 200) : 0
    const installCost = config.install.roller
    const base = blindPrice + installCost + motorCost
    return {
      components: [
        { label: `Blind (${line.rollerCategory}, ${(w/1000).toFixed(2)}m × ${(d/1000).toFixed(2)}m)`, value: blindPrice },
        { label: 'Installation', value: installCost },
        ...(line.motorised ? [{ label: 'Motorisation', value: motorCost }] : []),
      ],
      base,
      low: base * (1 - buf / 2),
      high: base * (1 + buf / 2),
    }
  }

  if (type === 'Shutter') {
    if (!material) return null
    const sqm = (w / 1000) * (d / 1000)
    const rate = material === 'Basswood' ? config.shutterBass : config.shutterPvc
    const panelCount = Math.ceil(w / (config.maxPanelWidth || 750))
    const shutterCost = sqm * rate
    const installCost = panelCount * config.install.shutter
    const base = shutterCost + installCost
    return {
      components: [
        { label: `${material} panels (${sqm.toFixed(2)}m²)`, value: shutterCost },
        { label: `Installation (${panelCount} panel${panelCount > 1 ? 's' : ''} × $${config.install.shutter})`, value: installCost },
      ],
      base,
      low: base * (1 - buf / 2),
      high: base * (1 + buf / 2),
    }
  }

  return null
}
