# Teal Bot

###### 对了，你知道我为什么比较喜欢 teal 这个颜色吗？

Teal Bot 是 @estel_de_hikari@erica.moe 的还在开发中的的目前不知道作用是什么的机器人。

## 用法

Teal Bot 的大多数技能都可以通过发布一则格式如下的嘟文来召唤：

`@teal #技能 内容`

为了不污染标签环境，所有技能的名字都有个额外的字母“t”作开头。

其中 `#技能` 目前可以是：

`#thelp`: 显示本则帮助

`#techo`: 回显你发给 Teal Bot 的嘟文

`#ttrans`: 翻译指定嘟文（目前使用百度翻译）

`#tshit`：众所周知的狗屁不通生成器。

快乐聊天功能为了自然的体验不需要技能标签。（目前使用青云客的菲菲人工智障）

它们各自的详细用法如下。

### 聊天

和 Teal Bot 一起快乐聊天。 ~~目前使用青云客的[菲菲](https://api.qingyunke.com/)聊天机器人。为什么？因为不要钱。~~ 目前使用腾讯云 NLP 闲聊 API。`tencentcloud-sdk-nodejs` SDK 真的是好东西，手搓 request 的难受谁知道（

**使用示例**

`@teal 你叫什么呀？`

**示例回复**

```
@estel_de_hikari 亲，叫我菲菲就可以了
```

### #thelp

显示 Teal Bot 的使用帮助。

**使用示例**

`@teal #thelp`

**示例回复**

```
我是 @estel_de_hikari 的还在开发中的的目前不知道作用是什么的机器人。

用法：
我的所有技能都可以通过发布一则格式如下的嘟文来召唤：
@teal #技能 内容
为了不污染标签环境，所有技能的名字都有个额外的字母“t”作开头。
其中 #技能 目前可以是：

#thelp: 显示本则帮助
#techo: 回显你发给我的嘟文
#tchat: 和我一起快乐聊天（目前使用青云客的菲菲人工智障）
#ttrans: 翻译指定嘟文（目前使用百度翻译）

关于每个技能的详细用法，请参考 https://github.com/BedrockDigger/teal-bot/main/README.md
```

### #techo

回显你发给 Teal Bot 的嘟文。此功能其实主要用于调试。

**使用示例**

`@teal #techo 你好呀！`

**示例回复**

```
@estel_de_hikari 刚才你对我说：
你好呀！
```

### #ttrans

翻译调用`#ttrans`技能的嘟文所回复的那则嘟文。翻译的目标语言默认为中文。

**使用示例**

（以下嘟文回复了内容为“To be or not to be?”的嘟文。）

`@teal #ttrans `

**示例回复**

```
@estel_de_hikari 百度翻译说，上面那句话的意思是：
生存还是毁灭？
```

如果要指定其他的目标语言，可以附上该语言的简写标签：

| 名称         | 代码 | 名称       | 代码 | 名称       | 代码 |
| ------------ | ---- | ---------- | ---- | ---------- | ---- |
| 自动检测     | auto | 中文       | zh   | 英语       | en   |
| 粤语         | yue  | 文言文     | wyw  | 日语       | jp   |
| 韩语         | kor  | 法语       | fra  | 西班牙语   | spa  |
| 泰语         | th   | 阿拉伯语   | ara  | 俄语       | ru   |
| 葡萄牙语     | pt   | 德语       | de   | 意大利语   | it   |
| 希腊语       | el   | 荷兰语     | nl   | 波兰语     | pl   |
| 保加利亚语   | bul  | 爱沙尼亚语 | est  | 丹麦语     | dan  |
| 芬兰语       | fin  | 捷克语     | cs   | 罗马尼亚语 | rom  |
| 斯洛文尼亚语 | slo  | 瑞典语     | swe  | 匈牙利语   | hu   |
| 繁体中文     | cht  | 越南语     | vie  |            |      |

**使用示例**

（以下嘟文回复了内容为“To be or not to be?”的嘟文。）

`@teal #ttrans #el `

**示例回复**

```
@estel_de_hikari 百度翻译说，上面那句话的意思是：
Να είσαι ή να μην είσαι?
```

### #tshit

根据主题生成一篇[狗屁不通的文章](https://github.com/menzi11/BullshitGenerator)。

**使用示例**

`@teal #tshit 非人情之美`

**示例回复**

```
@estel_de_hikari 　　非人情之美因何而发生?既然如此，非人情之美，发生了会如何，不发生又会如何。 每个人都不得不面对这些问题。  在面对这种问题时， 我们一般认为，抓住了问题的关键，其他一切则会迎刃而解。 我们都知道，只要有意义，那么就必须慎重考虑。 黑塞曾经说过，有勇气承担命运这才是英雄好汉。这不禁令我深思。 所谓非人情之美，关键是非人情之美需要如何写。 马尔顿曾经说过，坚强的信心，能使平凡的人做出惊人的事业。这启发了我， 我认为， 非人情之美，到底应该如何实现。 而这些并不是完全重要，更加重要的问题是， 了解清楚非人情之美到底是一种怎么样的存在，是解决一切问题的关键。 本人也是经过了深思熟虑，在每个日日夜夜思考这个问题。 问题的关键究竟为何? 非人情之美，到底应该如何实现。 裴斯泰洛齐曾经说过，今天应做的事没有做，明天再早也是耽误了。这不禁令我深思。 既然如此， 现在，解决非人情之美的问题，是非常非常重要的。 所以， 莫扎特在不经意间这样说过，谁和我一样用功，谁就会和我一样成功。这启发了我， 带着这 (1/6)
```

（后五则嘟文已省略）

## 部署

1. 克隆源码。依据源码的绝对路径更改 teal-bot.service。

2. 复制 systemd unit file。

   ```bash
   $ sudo cp teal-bot.service /etc/systemd/system/
   ```

3. 填写 .env 里的环境变量，详情见 .env.example 中的注释。

   ```bash
   $ cp .env.example .env
   $ vim .env
   ```

4. 安装依赖。

   ```bash\
   $ npm i
   ```

5. Enable systemd unit 来开机自启。可选 `--now` 同时开始执行。

   ```bash
   $ sudo systemctl enable --now teal-bot.service
   ```
