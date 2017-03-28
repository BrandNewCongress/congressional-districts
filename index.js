const express = require('express')
const app = express()
const monk = require('monk')
const db = monk(process.env.MONGODB_URI)

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
