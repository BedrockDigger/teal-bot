(async () => {
  const superagent = require("superagent");
  require("dotenv").config();
  const accountId = "106894972450280858";
  const roundCount = 1;
  const token = process.env.MASTODON_ACCESS_TOKEN;
  try {
    for (let round = 1; round <= roundCount; round++) {
      const statuses = JSON.parse(
        (
          await superagent
            .get(`https://erica.moe/api/v1/accounts/${accountId}/statuses`)
            .set("Authorization", token)
        ).text
      );
      for (let i = 0; i < statuses.length; i++) {
        superagent
          .delete(`https://erica.moe/api/v1/statuses/${statuses[i].id}`)
          .set("Authorization", token)
          .then((res) => console.log(res.status));
      }
    }
  } catch (err) {
    console.error(err);
  }
})();
