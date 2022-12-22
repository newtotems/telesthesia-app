exports.handler = async function(event, context) {
    const queryParams = event.queryStringParameters;
    if (!queryParams || !queryParams.o || !queryParams.p) {
      return {
        statusCode: 400,
        body: "Error: Both parameters 'o' and 'p' are required"
      };
    }
  
    const { o, p } = queryParams;
  
    // Check that there are no more than 5 ids for each parameter
    if (o.split(",").length > 5 || p.split(",").length > 5) {
      return {
        statusCode: 400,
        body: "Error: Both parameters must have a maximum of 5 ids each"
      };
    }
  
    // Check that the number of ids is the same for both parameters
    if (o.split(",").length !== p.split(",").length) {
      return {
        statusCode: 400,
        body: "Error: Both parameters must have the same number of ids"
      };
    }
  
    // logic here

    function calculateTotalScores(o, p) {
    let opponentTotalScore = 0;
    let playerTotalScore = 0;
  
    // Calculate the total score for each data set
    o.forEach(card => {
      opponentTotalScore += card.scores.vitality + card.scores.intelligence + card.scores.balance + card.scores.social + card.scores.energy;
    });
    p.forEach(card => {
      playerTotalScore += card.scores.vitality + card.scores.intelligence + card.scores.balance + card.scores.social + card.scores.energy;
    });
  
    // Evaluate and apply defense rules for each data set
    o.forEach(card => {
      card.rules.forEach(rule => {
        if (rule.type === "Defense") {
          if (rule.condition.value === card.type && card.scores[rule.condition.scoreType.name] > rule.condition.scoreType.threshold) {
            opponentTotalScore += rule.effect.modifier;
          }
        }
      });
    });
    p.forEach(card => {
      card.rules.forEach(rule => {
        if (rule.type === "Defense") {
          if (rule.condition.value === card.type && card.scores[rule.condition.scoreType.name] > rule.condition.scoreType.threshold) {
            playerTotalScore += rule.effect.modifier;
          }
        }
      });
    });
  
// Evaluate and apply attack rules for each data set
o.forEach(card => {
    card.rules.forEach(rule => {
      if (rule.type === "Attack") {
        if (rule.condition.value === card.type && card.scores[rule.condition.scoreType.name] < rule.condition.scoreType.threshold) {
          playerTotalScore += rule.effect.modifier;
        }
      }
    });
  });
  p.forEach(card => {
    card.rules.forEach(rule => {
      if (rule.type === "Attack") {
        if (rule.condition.value === card.type && card.scores[rule.condition.scoreType.name] < rule.condition.scoreType.threshold) {
          opponentTotalScore += rule.effect.modifier;
        }
      }
    });
  });
  
  // Return the updated total scores
  return {
    opponentTotalScore: opponentTotalScore,
    playerTotalScore: playerTotalScore
  };
}
  
    return {
      statusCode: 200,
      body: "Success"
    };
  };
  



