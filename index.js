const HTMLParser = require("node-html-parser");
const agent = require("superagent-use")(require("superagent"));
const prefix = require("superagent-prefix");
require("dotenv").config();
const tencentcloud = require("tencentcloud-sdk-nodejs");
const bullshitGenerator = require("./bullshit/generator");

// env vars
agent.use(prefix(process.env.MASTODON_DOMAIN));
const mastodonToken = process.env.MASTODON_ACCESS_TOKEN;
const translationApi = process.env.TRANSLATION_API;

// global vars - my little "Redux store"
let queryId = ""; // aka the ID of the notification object: we'll be calling the object "query"
let queryObject;
let currentQueryId = "";
let queryStatusId = "";
let queryStatusContent = ""; // stripped by value assignment
let queryReplyStatusContent = "";
let queryReplyStatusId = ""; // optional
let selfStatusId = ""; // aka the ID of the last posted thing
let queryTagsArray = []; // mandatory, but can be empty
let queryCommandsArray = [];

// commands except tchat
const commands = ["thelp", "techo", "ttrans", "tshit"];

// translate target language abbrs
let languages;
if (translationApi === "TENCENT") {
  languages = [
    "zh",
    "en",
    "ja",
    "ko",
    "fr",
    "es",
    "it",
    "de",
    "tr",
    "ru",
    "pt",
    "vi",
    "id",
    "th",
    "ms",
  ];
} else if (translationApi === "DEEPL") {
  languages = [
    "bg",
    "cs",
    "da",
    "de",
    "el",
    "en",
    "es",
    "et",
    "fi",
    "fr",
    "hu",
    "it",
    "ja",
    "lt",
    "lv",
    "nl",
    "pl",
    "pt",
    "ro",
    "ru",
    "sk",
    "sl",
    "sv",
    "zh",
  ];
}
function mainLoop() {
  agent
    .get("/api/v1/notifications")
    .set("Authorization", mastodonToken)
    .set("Content-Type", "multipart/form-data")
    .field("limit", "1")
    .then((res) => {
      queryObject = JSON.parse(res.text)[0];
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
            postStatus("??????????????????????????????????????? :blobmiou:", true, false);
          } else if (hasCommand("techo")) {
            commandEcho();
          } else if (hasCommand("thelp")) {
            commandHelp();
          } else if (hasCommand("ttrans")) {
            const queryLanguageArray = queryTagsArray.filter((language) =>
              languages.includes(language)
            );
            const predictedLang = queryLanguageArray[0];
            if (queryLanguageArray.length > 1) {
              postStatus(
                "???????????? tag ??????????????????????????? :blobmiou:",
                true,
                false
              );
            } else if (!languages.includes(predictedLang) && predictedLang) {
              postStatus("???????????????????????? :blobmiou:", true, false);
            } else {
              queryReplyStatusId = queryObject.status.in_reply_to_id;
              commandTranslate(predictedLang);
            }
          } else if (hasCommand("tshit")) {
            commandShit();
          } else {
            queryReplyStatusId = queryObject.status.in_reply_to_id;
            commandChat();
          }
        } else if (queryObject.type === "follow") {
          postStatus(
            "Teal Bot ?????????????????????????????? follow ?????? :blobcatrainbow: \n\
  ????????????????????? @teal #thelp ?????????????????????????????????",
            false,
            false
          );
        }
      }
      currentQueryId = queryId;
    })
    .catch((err) => console.error("mainLoop() failed with error: " + err));
  setTimeout(mainLoop, 5000);
}

// command functions

async function commandEcho() {
  const message = "?????????????????????\n" + queryStatusContent;
  postStatus(message, true, false);
}
async function commandChat() {
  let originalText;
  if (queryStatusContent) {
    originalText = queryStatusContent;
  } else {
    await setupMetaReply();
    originalText = queryReplyStatusContent;
  }
  if (hasSingleParenthesis(originalText)) {
    await postStatus(
      "??????(????????????)\n\
An unmatched left parenthesis creates an unresolved tension that will stay with you all day.",
      true,
      false
    );
  }
  const NlpClient = tencentcloud.nlp.v20190408.Client;
  const clientConfig = {
    credential: {
      secretId: process.env.TENCENT_CLOUD_API_SECRETID,
      secretKey: process.env.TENCENT_CLOUD_API_SECRETKEY,
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
    Query: originalText,
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
  let originalText, targetText;
  if (queryStatusContent) {
    originalText = queryStatusContent;
  } else {
    await setupMetaReply();
    originalText = queryReplyStatusContent;
  }
  if (translationApi === "TENCENT") {
    targetText = await tencentTranslate(lang, originalText);
  } else if (translationApi === "DEEPL") {
    targetText = await deeplTranslate(lang, originalText);
  }
  await postSlicedStatus(targetText, false, true);
}

async function commandShit() {
  const bullshit = bullshitGenerator(queryStatusContent);
  await postStatus("???????????????????????????????????????\n", true, false);
  await postSlicedStatus(bullshit, false, true);
}

async function commandHelp() {
  const message =
    "?????? @estel_de_hikari ?????? bot??????????????????????????????????????????????????????????????????????????????24???????????????????????????????????????????????????\
???????????? https://github.com/BedrockDigger/teal-bot/blob/master/README.md ??????????????????????????????????????????\n\
??????300?????? JavaScript ???????????????????????? :blobcat:";
  postStatus(message, true, false);
}

// utility functions

async function postStatus(message, doReply, doReplySelf) {
  const content = (await getMentionPrefix()) + message;
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

function hasSingleParenthesis(string) {
  let fullWidthCounter = 0,
    halfWidthCounter = 0;
  for (let i = string.length - 1; i > -1; i--) {
    const charl = string.charAt(i);
    if (charl === "(") {
      halfWidthCounter += 1;
    } else if (charl === "???") {
      fullWidthCounter += 1;
    } else if (charl === ")") {
      halfWidthCounter -= 1;
    } else if (charl === "???") {
      fullWidthCounter -= 1;
    }
  }
  return fullWidthCounter > 0 || halfWidthCounter > 0;
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

async function setupMetaReply() {
  queryReplyStatusId = queryObject.status.in_reply_to_id;
  queryReplyStatusContent = stripContent(
    (await getQueryReplyStatusObject()).content,
    true
  );
}

async function getQueryReplyStatusObject() {
  const sourceBody = JSON.parse(
    (
      await agent
        .get("/api/v1/statuses/" + queryReplyStatusId)
        .set("Authorization", mastodonToken)
        .catch((err) =>
          console.error(
            "getQueryReplyStatusObject().content failed with error: " + err
          )
        )
    ).text
  );
  console.log("-----getStatus-----\n" + JSON.stringify(sourceBody) + "\n");
  return sourceBody;
}

// has a trailing space
async function getMentionPrefix() {
  let mentions,
    mentionPrefix = "";
  const originalTooter = queryObject.account.acct;
  if (queryStatusContent || hasCommand("thelp")) {
    mentions = queryObject.status.mentions
      .map((userObject) => userObject.acct)
      .filter((acct) => acct !== "teal");
    mentions.unshift(originalTooter);
  } else {
    mentions = [
      originalTooter,
      (await getQueryReplyStatusObject()).account.acct,
    ];
  }
  mentions = [...new Set(mentions)];
  for (acct of mentions) {
    mentionPrefix += "@" + acct + " ";
  }
  return mentionPrefix;
}

async function tencentTranslate(lang, originalText) {
  const TmtClient = tencentcloud.tmt.v20180321.Client;
  const clientConfig = {
    credential: {
      secretId: process.env.TENCENT_CLOUD_API_SECRETID,
      secretKey: process.env.TENCENT_CLOUD_API_SECRETKEY,
    },
    region: "ap-hongkong",
    profile: {
      httpProfile: {
        endpoint: "tmt.tencentcloudapi.com",
      },
    },
  };
  const client = new TmtClient(clientConfig);
  const params = {
    SourceText: originalText,
    Source: "auto",
    Target: lang ? lang : "zh",
    ProjectId: 0,
  };
  const translatedObject = await client.TextTranslate(params);
  await postStatus("?????????????????????????????????????????????????????????", true, false);
  return translatedObject.TargetText;
}

async function deeplTranslate(lang, originalText) {
  const translatedObject = JSON.parse(
    (
      await agent
        .post("https://api-free.deepl.com/v2/translate")
        .set(
          "Authorization",
          "DeepL-Auth-Key " + process.env.DEEPL_AUTHENTICATION_KEY
        )
        .query({ text: originalText })
        .query({ target_lang: lang ? lang : "ZH" })
    ).text
  );
  await postStatus("DeepL ??????????????????????????????????????????", true, false);
  return translatedObject.translations[0].text;
}

mainLoop(5000);
