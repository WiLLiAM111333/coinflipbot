const { User } = require('../db/models/User');

async function createUser(userData) {
  try {
    const newUser = new User({
      tag: userData.tag,
      id: userData.id,
      wins: 0,
      losses: 0,
      winRate: '0%'
    });

    await newUser.save();

    return newUser;
  } catch (err) {
    console.error(err);
  }
}

function flipCoin() {
  const random = Math.floor(Math.random() * 2);
  return random ? 'heads' : 'tails';
}

function getWinRatio({ wins, losses }) {
  if (wins === 0 && losses === 0) {
    return '0'
  } else if (wins === 1 && losses === 0) {
    return '100%'
  } else {
    return `${((wins * 100) / (wins + losses)).toFixed(2)}%`
  }
}

async function handleWin(user) {
  try {
    user.wins = user.wins + 1;
    user.winRate = getWinRatio(user);

    await user.save();
  } catch (err) {
    console.error(err);
  }
}

async function handleLoss(user) {
  try {
    user.losses = user.losses + 1;
    user.winRate = getWinRatio(user);

    await user.save();
  } catch (err) {
    console.error(err);
  }
}

async function handleStandOff(winner, loser) {
  try {
    winner.wins = winner.wins + 1;

    if(loser.wins > 0) {
      loser.wins = loser.wins - 1;
    }

    winner.winRate = getWinRatio(winner);
    loser.winrate = getWinRatio(loser);

    await winner.save();
    await loser.save();
  } catch (err) {
    console.error(err);
  }
}

module.exports = {
  createUser,
  getWinRatio,
  flipCoin,
  handleWin,
  handleLoss,
  handleStandOff
}
