const HTMLParser = require("node-html-parser");
const agent = require("superagent-use")(require("superagent"));
const prefix = require("superagent-prefix");
const md5 = require("md5");
require("dotenv").config();
const tencentcloud = require("tencentcloud-sdk-nodejs");
const bullshitGenerator = require("./bullshitGenerator");

// env vars
agent.use(prefix(process.env.MASTODON_DOMAIN));
const mastodonToken = process.env.MASTODON_ACCESS_TOKEN;
const baiduTranslateAppid = process.env.BAIDU_TRANSLATE_APPID;
const baiduTranslateKey = process.env.BAIDU_TRANSLATE_KEY;
const tencentChatbotSecretId = process.env.TENCENT_CHATBOT_SECRETID;
const tencentChatbotSecretKey = process.env.TENCENT_CHATBOT_SECRETKEY;

// global vars - my little "Redux store"
let queryId = ""; // aka the ID of the notification object: we'll be calling the object "query"
let currentQueryId = "";
let queryStatusId = "";
let queryStatusContent = ""; // stripped by value assignment
let queryUsername = "";
let queryReplyStatusId = ""; // optional
let selfStatusId = ""; // aka the ID of the last posted thing
let queryTagsArray = []; // mandatory, but can be empty
let queryCommandsArray = [];

// commands except tchat
const commands = ["thelp", "techo", "ttrans", "tshit"];

// translate target language abbrs
const languages = [
  "zh",
  "en",
  "yue",
  "wyw",
  "jp",
  "kor",
  "fra",
  "spa",
  "th",
  "ara",
  "ru",
  "pt",
  "de",
  "it",
  "el",
  "nl",
  "pl",
  "bul",
  "est",
  "dan",
  "fin",
  "cs",
  "rom",
  "slo",
  "swe",
  "hu",
  "cht",
  "vie",
];

function mainLoop() {
  agent
    .get("/api/v1/notifications")
    .set("Authorization", mastodonToken)
    .set("Content-Type", "multipart/form-data")
    .field("limit", "1")
    .then((res) => {
      const queryObject = JSON.parse(res.text)[0];
      queryId = queryObject.id;
      if (queryId !== currentQueryId) {
        queryUsername = queryObject.account.username;
        if (queryObject.type === "mention") {
          queryStatusId = queryObject.status.id;
          queryStatusContent = stripContent(queryObject.status.content, true);
          queryTagsArray = queryObject.status.tags.map(
            (tagObject) => tagObject.name
          );
          queryCommandsArray = queryTagsArray.filter((command) =>
            commands.includes(command)
          );
          if (queryCommandsArray.length > 1) {
            postStatus("我比较傻，只能听懂一个命令 :blobmiou:", true, false);
          } else if (hasCommand("techo")) {
            commandEcho();
          } else if (hasCommand("thelp")) {
            commandHelp();
          } else if (hasCommand("ttrans")) {
            const querylanguageArray = queryTagsArray.filter((language) =>
              languages.includes(language)
            );
            if (querylanguageArray.length > 1) {
              postStatus(
                "我比较傻，一次只能翻译成一种语言 :blobmiou:",
                true,
                false
              );
            } else {
              queryReplyStatusId = queryObject.status.in_reply_to_id;
              commandTranslate(querylanguageArray[0]);
            }
          } else if (hasCommand("tshit")) {
            commandShit();
          } else {
            queryReplyStatusId = queryObject.status.in_reply_to_id;
            commandChat();
          }
        } else if (queryObject.type === "follow") {
          postStatus(
            "Teal Bot 现在好开心，因为被你 follow 啦！ :blobcatrainbow: \n\
  发布一则内容为 @teal #thelp 的嘟文来查看我的技能！",
            false,
            false
          );
        }
      }
      currentQueryId = queryId;
    })
    .catch((err) => console.error("mainLoop() failed with error: " + err));
  setTimeout(mainLoop, 2000);
}

// command functions

async function commandEcho() {
  const message = "刚才你对我说：\n" + queryStatusContent;
  postStatus(message, true, false);
}

async function commandChat() {
  const NlpClient = tencentcloud.nlp.v20190408.Client;
  const clientConfig = {
    credential: {
      secretId: tencentChatbotSecretId,
      secretKey: tencentChatbotSecretKey,
    },
    region: "ap-guangzhou",
    profile: {
      httpProfile: {
        endpoint: "nlp.tencentcloudapi.com",
      },
    },
  };
  const client = new NlpClient(clientConfig);
  const params = {
    Query: queryStatusContent
      ? queryStatusContent
      : await getQueryReplyStatus(),
  };
  client.ChatBot(params).then(
    (data) => {
      postStatus(data.Reply, true, false);
    },
    (err) => {
      console.error("commandChat() failed with error: " + err);
    }
  );
}

async function commandTranslate(lang) {
  const originalText = queryStatusContent
    ? queryStatusContent
    : await getQueryReplyStatus();
  const randNum = getRandomInt(1, 99999);
  const sign = md5(
    baiduTranslateAppid + originalText + randNum + baiduTranslateKey
  );
  const translatedBody = JSON.parse(
    (
      await agent
        .get("https://fanyi-api.baidu.com/api/trans/vip/translate")
        .query({
          q: originalText,
          from: "auto",
          to: lang ? lang : "zh",
          appid: baiduTranslateAppid,
          salt: randNum,
          sign: sign,
        })
        .catch((err) =>
          console.error("commandTranslate() failed with error: " + err)
        )
    ).text
  );
  if (translatedBody.error_code) {
    const errorReport =
      "百度翻译 API 报错啦。以下是错误信息：\n" + translatedBody.toString();
    postStatus(errorReport, true, false);
  } else {
    const targetString = translatedBody.trans_result[0].dst;
    await postStatus("百度翻译说，上面那段话的意思是：\n", true, false);
    await postSlicedStatus(targetString, false, true);
  }
}

async function commandShit() {
  const bullshit = bullshitGenerator(queryStatusContent);
  await postStatus("你要的狗屁不通文章生成啦：\n", true, false);
  await postSlicedStatus(bullshit, false, true);
}

async function commandHelp() {
  const message =
    "我是 @estel_de_hikari 写的 bot。我的名字来自他喜欢的一个颜色。我可以当复读机、会在28种语言之间进行互译，还会陪你聊天。\
你可以在 https://github.com/BedrockDigger/teal-bot/blob/master/README.md 了解和我愉快玩耍的具体方法。\n\
我在不过300行的 JavaScript 里，等你回家哦。 :blobcat:";
  postStatus(message, true, false);
}

// utility functions

async function postStatus(message, doReply, doReplySelf) {
  const content = "@" + queryUsername + " " + message;
  await agent
    .post("/api/v1/statuses")
    .set("Authorization", mastodonToken)
    .set("Content-Type", "multipart/form-data")
    .field("status", content)
    .field(
      "in_reply_to_id",
      doReply ? queryStatusId : doReplySelf ? selfStatusId : ""
    )
    .then((res) => {
      selfStatusId = JSON.parse(res.text).id;
      console.log("-----postStatus-----\n" + res.text + "\n");
    })
    .catch((err) => console.error("postStatus() failed with error: " + err));
}

async function postSlicedStatus(message, doReply, doReplySelf) {
  const sliceSum = Math.ceil(message.length / 450);
  for (let i = 0; i < message.length; i += 450) {
    await postStatus(
      message.substring(i, i + 450) +
        ` (${Math.floor(i / 450) + 1}/${sliceSum})`,
      doReply,
      doReplySelf
    );
  }
}

function stripContent(rawContent, keepTextOnly) {
  const root = HTMLParser.parse(rawContent);
  const mentionAndTagRegex = /([@#][\w_-]+)/g;
  const result = keepTextOnly
    ? root.textContent.replace(mentionAndTagRegex, "").trim()
    : root.textContent;
  return result;
}

function hasCommand(commandName) {
  return queryCommandsArray.indexOf(commandName) > -1;
}

async function getQueryReplyStatus() {
  const sourceBody = JSON.parse(
    (
      await agent
        .get("/api/v1/statuses/" + queryReplyStatusId)
        .set("Authorization", mastodonToken)
        .catch((err) =>
          console.error("getQueryReplyStatus() failed with error: " + err)
        )
    ).text
  );
  console.log("-----getStatus-----\n" + JSON.stringify(sourceBody) + "\n");
  const content = stripContent(sourceBody.content, true);
  return content;
}

function getRandomInt(min, max) {
  const realMin = Math.ceil(min);
  const realMax = Math.floor(max);
  return Math.floor(Math.random() * (realMax - realMin) + realMin);
}

setTimeout(mainLoop, 2000);
