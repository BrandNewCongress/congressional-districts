const express = require('express')
const app = express()
const monk = require('monk')
const db = monk(process.env.MONGODB_URI)
const fs = require('fs')
const cds = require('congressional-districts')
const ztca = require('us-zcta-counties')

const signatures = fs.readFileSync('./signatures.csv')
  .toString().split('\n').slice(1)

app.set('port', (process.env.PORT || 5000))
app.use(express.static(__dirname + '/public'))

const People = db.get('People')
const Districts = db.get('Congressional Districts')

app.get('/api/candidates', async (req, res) => {
  const rawNominees = await People.find(req.query.round
      ? roundQuery(req.query.round)
      : {nominationStatus: {$ne: 'Not Nominated'}}
    , {fields: ['id', 'district']})

  const districtDocs = await db.get('Congressional Districts').find({id: {
    $in: rawNominees.filter(n => n.district).map(n => n.district[0])
  }})

  const districts = {}

  for (let d of districtDocs) {
    if (!d.stateAbbreviation)
      console.log(d)

    const key = `${d.stateAbbreviation[0]}-${d.congressionalDistrictCode}`
    districts[key] = rawNominees.filter(n => n.district && n.district.includes(d.id)).length
  }

  return res.json(districts)
})

app.get('/api/petition', async (req, res) => {
  const districts = {}

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
        return `${state}-${districtCode[0]}`
      } catch (err) {
        return false
      }
    })

  congZips.forEach((d, idx) => {
    if (!districts[d]) districts[d] = 0
    districts[d] = districts[d] + zips[Object.keys(zips)[idx]]
  })

  return res.json(districts)
})

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'))
})

function roundQuery (round) {
  const rounds = ['R1', 'R2', 'R3', 'R4', 'R5']

  return {
    $or: rounds.slice(rounds.indexOf(round)).map(r => ({nominationStatus: {
      $regex: `.*${r}.*`
    }}))
  }
}
