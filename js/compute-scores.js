const fs = require('fs');
const url = require('url');

// Read the JSON file and parse the data
const data = fs.readFileSync('path/to/file.json');
const cardslist = JSON.parse(data);

// Parse the URL and extract the query string
const parsedUrl = url.parse(request.url, true);
const query = parsedUrl.query;

// Extract the ids from the query string
const ids = query.ids.split(',');

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
