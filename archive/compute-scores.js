const fs = require('fs');

// Read the JSON file and parse the data
const data = fs.readFileSync('_data/cards.json');
const cardslist = JSON.parse(data);

// Specify the ids to include in the filtered array
const ids = [1, 3, 5];

// Filter the cardslist array based on the specified ids
const filteredCards = cardslist.filter(card => ids.includes(card.id));

// Compute the total score for the filtered cards
let totalScore = 0;

for (let i = 0; i < filteredCards.length; i++) {
  const card = filteredCards[i];
  let cardScore = card.scores.vitality + card.scores.intellect + card.scores.social + card.scores.balance;

  if (card.rules.socialScore.type === "additive" && card.rules.socialScore.criteria.type === card.type) {
    cardScore += card.rules.socialScore.value;
  }

  totalScore += cardScore;
}

console.log(totalScore);
