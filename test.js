const tencentcloud = require("tencentcloud-sdk-nodejs");

const tencentChatbotSecretId = process.env.TENCENT_CHATBOT_SECRETID;
const tencentChatbotSecretKey = process.env.TENCENT_CHATBOT_SECRETKEY;
const TmtClient = tencentcloud.tmt.v20180321.Client;
console.log(tencentChatbotSecretId);
const clientConfig = {
  credential: {
    secretId: tencentChatbotSecretId,
    secretKey: tencentChatbotSecretKey,
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
  SourceText: "Hello world!",
  Source: "auto",
  Target: "zh",
  ProjectId: 0,
};
client.TextTranslate(params).then(
  (data) => {
    console.log(data);
  },
  (err) => {
    console.error("error", err);
  }
);
