const normalize = (state, district) => district.length == 1
  ? `${state}-0${district}`
  : `${state}-${district}`

const districts = {}

const fs = require('fs')
const cds = require('congressional-districts')
const ztca = require('us-zcta-counties')
const stateColors = require('./data/state-colors')
const signers = fs.readFileSync('./data/signers.csv').toString().split('\n')
const topojson = require('topojson')

const ushexRaw = require('./data/ushex')
const hexFeatures = topojson.feature(ushexRaw, ushexRaw.objects.states).features

const legislators = fs.readFileSync('./data/legislators.csv')
  .toString().split('\n').slice(1).map(line => {
    const [_rep, first, middle, last, _suf, _nick, party, state, district] = line.split(',')
    if (typeof parseInt(district) == 'number' && !isNaN(parseInt(district))) {
      const n = normalize(state, district)

      if (!districts[n]) districts[n] = {}

      Object.assign(districts[n], {
        key: n,
        rep: `${first} ${middle} ${last} (${party})`,
        supporting: signers.includes(n),
        color: stateColors[state]
      })
    }
  })

const signatures = fs.readFileSync('./data/signatures.csv')
  .toString().split('\n').slice(1)

const zips = {}
signatures.forEach(zip => {
  if (!zips[zip]) zips[zip] = 0
  zips[zip]++
})

const congZips = Object.keys(zips)
  .map(z => z.slice(0,5))
  .map(zip => {
    try {
      const { state }  = ztca.find({zip})
      const districtCode = cds.getDistricts(zip)
      return normalize(state, districtCode[0])
    } catch (err) {
      return false
    }
  })
  .filter(z => z)

congZips.forEach((d, idx) => {
  if (districts[d]) {
    if (typeof districts[d].count != 'number') {
      districts[d].count = 0
    }

    districts[d].count = districts[d].count + zips[Object.keys(zips)[idx]]
  }
})

ushexRaw.objects.states.geometries.forEach(item => {
  const { state, district } = item.properties
  const n = normalize(state, district)
  Object.assign(item.properties, districts[n] || {})
})

fs.writeFileSync('./updated-raw.json', JSON.stringify(ushexRaw))
console.log('Done!')
