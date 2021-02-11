const { join } = require('path');

const COINFLIP_IMAGES = {
  tails: join(
    __dirname,
    '..',
    '..',
    'assets',
    'tails.png'
  ),
  heads: join(
    __dirname,
    '..',
    '..',
    'assets',
    'heads.png'
  )
}

module.exports = {
  COINFLIP_IMAGES
}
