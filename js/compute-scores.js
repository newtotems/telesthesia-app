async function computeTotalScores(animalIds) {
  const client = new faunadb.Client({ secret: process.env.FAUNADB_SECRET });

  const animalRecords = [];
  for (const animalId of animalIds) {
    const animalRecord = await client.query(
      faunadb.query.Get(faunadb.query.Ref(faunadb.query.Collection('animals'), animalId))
    );
    animalRecords.push(animalRecord);
  }

  function computeTotalScore(animal) {
    let totalScore = 0;

    // Add the individual scores
    totalScore += animal.scores.vitality;
    totalScore += animal.scores.intellect;
    totalScore += animal.scores.social;
    totalScore += animal.scores.balance;

    // Apply the rules
    for (const key in animal.rules) {
      const rule = animal.rules[key];
      if (rule.type === "additive") {
        totalScore += rule.value;
      } else if (rule.type === "subtractive") {
        totalScore -= rule.value;
      }
    }

    return totalScore;
  }

  const animalScores = [];
  for (const animalRecord of animalRecords) {
    const totalScore = computeTotalScore(animalRecord);
    animalScores.push({
      id: animalRecord.id,
      name: animalRecord.name,
      totalScore: totalScore
    });
  }

  return animalScores;
}

const url = require('url');

const animalIds = url.parse(window.location.href, true).query.animalIds;
computeTotalScores(animalIds)
  .then(scores => {
    console.log(scores);
  })
  .catch(error => {
    console.error(error);
  });
