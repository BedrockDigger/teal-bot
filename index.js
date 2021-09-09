const HTMLParser = require('node-html-parser');
const request = require('request');
const md5 = require('md5');
require('dotenv').config()

// env vars
const token = process.env.MASTODON_ACCESS_TOKEN
const appid = process.env.BAIDU_TRANSLATE_APPID
const key = process.env.BAIDU_TRANSLATE_KEY

// global vars - my little "Redux store"
let queryId = '' // aka the ID of the notification object: we'll be calling the object "query"
let currentQueryId = ''
let queryStatusId = ''
let queryStatusContent = '' // stripped by value assignment
let queryUsername = ''
let queryReplyStatusId = '' // optional
let queryTagsArray = [] // mandatory, but can be empty
let queryCommandsArray = []

// static request option objects (dynamic ones are living in the funcs that call them)
const requestOptions = {
  getNotifications: {
    method: 'GET',
    url: 'https://erica.moe/api/v1/notifications',
    headers: {
      'Authorization': token,
      'Content-Type': 'multipart/form-data'
    },
    formData: { limit: '1' }
  },
}

// commands
const commands = ['thelp', 'techo', 'ttrans', 'tchat']

// translate target language abbrs
const languages = [
  'zh', 'en', 'yue', 'wyw', 'jp',
  'kor', 'fra', 'spa', 'th', 'ara',
  'ru', 'pt', 'de', 'it', 'el',
  'nl', 'pl', 'bul', 'est', 'dan',
  'fin', 'cs', 'rom', 'slo', 'swe',
  'hu', 'cht', 'vie'
]

function main() {
  request(requestOptions.getNotifications, function (error, _response, body) {
    if (error) {
      throw new Error(error);
    }
    const queryObject = JSON.parse(body)[0]
    queryId = queryObject.id
    if (queryId !== currentQueryId) {
      queryUsername = queryObject.account.username
      if (queryObject.type === 'mention') {
        queryStatusId = queryObject.status.id
        queryStatusContent = stripContent(queryObject.status.content, true)
        queryTagsArray = queryObject.status.tags.map(tagObject => tagObject.name)
        queryCommandsArray = queryTagsArray.filter(x => commands.includes(x));
        if (queryCommandsArray.length !== 1) {
          postStatus("我比较傻，只能听懂不多不少一个命令 :blobmiou:", true)
        }
        else if (hasCommand('techo')) {
          commandEcho()
        }
        else if (hasCommand('thelp')) {
          commandHelp()
        }
        else if (hasCommand('ttrans')) {
          const querylanguageArray = queryTagsArray.filter(x => languages.includes(x));
          if (querylanguageArray.length > 1) {
            postStatus("我比较傻，一次只能翻译成一种语言 :blobmiou:", true)
          }
          else {
            queryReplyStatusId = queryObject.status.in_reply_to_id
            commandTranslate(querylanguageArray[0])
          }
        }
        else if (hasCommand('tchat')) {
          commandChat()
        }
        else {
          postStatus("这个命令 @e 没教过我，怪他咯～ :blobmiou:", true)
        }
      }
      else if (queryObject.type === 'follow') {
        postStatus("Teal Bot 现在好开心，因为被你 follow 啦！ :blobcatrainbow: \n\
        发布一则内容为 @teal #thelp 的嘟文来查看我的技能！", false)
      }
    }
    currentQueryId = queryId
  }
  );
  setTimeout(main, 1000);
}

// command functions

async function commandEcho() {
  const message = "刚才你对我说：\n" + queryStatusContent
  postStatus(message, true)
}

async function commandChat() {
  const options = {
    method: 'GET',
    url: 'http://api.qingyunke.com/api.php',
    qs: { key: 'free', appid: '0', msg: queryStatusContent }
  };

  request(options, function (error, _response, body) {
    if (error) throw new Error(error);
    const answer = JSON.parse(body).content
    postStatus(answer, true)
  });

}

async function commandTranslate(lang) {
  let originalText = ""
  const getStatusOptions = {
    method: 'GET',
    url: 'https://erica.moe/api/v1/statuses/' + queryReplyStatusId,
    headers: { Authorization: token }
  }
  request(getStatusOptions, function (error, _response, body) {
    if (error) throw new Error(error);
    originalText = stripContent(JSON.parse(body).content, true)
    const randNum = getRandomInt(1, 99999);
    const sign = md5(appid + originalText + randNum + key);
    const getTranslateOptions = {
      method: 'GET',
      url: 'https://fanyi-api.baidu.com/api/trans/vip/translate',
      qs: {
        q: originalText,
        from: 'auto',
        to: lang ? lang : 'zh',
        appid: appid,
        salt: randNum,
        sign: sign
      }
    };
    request(getTranslateOptions, function (error, _response, body) {
      if (error) throw new Error(error);
      console.log(body);
      const translatedObject = JSON.parse(body)
      if (translatedObject.error_code) {
        const errorReport = "百度翻译 API 报错啦。以下是错误信息：\n" +
          translatedObject.error_code + " " + translatedObject.error_msg
        postStatus(errorReport, true)
      }
      else {
        const result = "百度翻译说，上面那句话的意思是：\n" + translatedObject.trans_result[0].dst
        postStatus(result, true)
      }
    }
    )
  }
  )
}

async function commandHelp() {
  const message =
    '我是 @estel_de_hikari 的还在开发中的的目前不知道作用是什么的机器人。\n\
\n\
:blobcatglowsticks: :blobcatglowsticks: :blobcatglowsticks: :blobcatglowsticks: :blobcatglowsticks: \
:blobcatglowsticks: :blobcatglowsticks: :blobcatglowsticks: :blobcatglowsticks: :blobcatglowsticks: \n\
\n\
用法：\n\
我的所有技能都可以通过发布一则格式如下的嘟文来召唤：\n\
@teal #技能 内容\n\
为了不污染标签环境，所有技能的名字都有个额外的字母“t”作开头。\n\
其中 #技能 目前可以是：\n\
\n\
#thelp: 显示本则帮助\n\
#techo: 回显你发给我的嘟文\n\
#tchat: 和我一起快乐聊天（目前使用青云客的菲菲人工智障）\n\
#ttrans: 翻译指定嘟文（目前使用百度翻译）\n\
\n\
关于每个技能的详细用法，请参考'

  postStatus(message, true)
}

// utility functions

function stripContent(rawContent, keepTextOnly) {
  const root = HTMLParser.parse(rawContent);
  const mentionAndTagRegex = /([@#][\w_-]+)/g
  const result = keepTextOnly ? root.textContent.replace(mentionAndTagRegex, "").trimStart()
    : root.textContent
  return result
}

function hasCommand(commandName) {
  return queryCommandsArray.indexOf(commandName) > -1;
}

async function postStatus(message, doReply) {
  const content = "@" + queryUsername + " " + message
  const options = {
    method: 'POST',
    url: 'https://erica.moe/api/v1/statuses',
    headers: {
      'Authorization': token,
      'Content-Type': 'multipart/form-data'
    },
    formData: {
      status: content,
      in_reply_to_id: doReply ? queryStatusId : undefined
    }
  }
  request(options, function (error, _response, body) {
    if (error) throw new Error(error);
    console.log(body);
  });
}

function getRandomInt(min, max) {
  const realMin = Math.ceil(min);
  const realMax = Math.floor(max);
  return Math.floor(Math.random() * (realMax - realMin) + realMin);
}

main();