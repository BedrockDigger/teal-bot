const agent = require('superagent');

function getRandomInt(min, max) {
  const realMin = Math.ceil(min);
  const realMax = Math.floor(max);
  return Math.floor(Math.random() * (realMax - realMin) + realMin);
}

agent.get('https://nlp.tencentcloudapi.com')
.query({
  Action: 'ChatBot',
  Version: '2019-04-08',
  Region: 'ap-guangzhou',
  Query: '你好呀',
  Timestamp: Date.now(),
  Nonce: getRandomInt()
})