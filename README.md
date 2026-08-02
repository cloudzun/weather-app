# 天气预报 Web（wttr.in）

一个纯前端的天气预报应用，天气数据来自 [wttr.in](https://wttr.in/)（WorldWeatherOnline 提供），空气质量优先使用监测站实测数据，无需任何后端或 API Key。

## 功能

- 城市 / 坐标搜索（如 `上海`、`Beijing`、`31.23,121.47`）与浏览器定位
- 当前天气大卡片：温度、天气描述、体感、湿度、风速、紫外线、气压、能见度、降水概率
- 跑者台（跑者专属）：
  - 跑步适宜度评分（0-100）与等级，综合体感温度、湿度/露点、风速、降水概率、紫外线、空气质量、能见度
  - 实时空气质量（AQI + PM2.5/PM10/O₃），并标注数据源与标准口径
  - 空气质量多数据源自动回退：
    - 默认：aqicn（WAQI）监测站实测（美标 AQI，无 Key）
    - 可选：在跑者台点击齿轮填入和风天气免费 Key，改用国控监测站数据（国标 AQI，与国内天气 App 口径一致）
    - 兜底：以上均不可用时，用 Open-Meteo 模型浓度按国标 HJ 633-2012 估算，并明确标注"模型估算"
  - 日出 / 日落 / 白昼时长 / 月相，及日照进度条
  - 未来 24 小时最佳跑步窗口（自动挑选温度、降水、风速、UV 最合适的 3 小时时段）
  - 针对当前天气的跑步温馨提示（补水、防晒、热身、室内备选等）
- 未来 24 小时逐时预报（可横向滑动）
- 未来 3 天预报与 24 小时气温趋势曲线（可悬停查看数值）
- 动态视觉背景：
  - 背景随当地时段变化：晨光 / 白昼 / 黄昏 / 夜晚，叠加当前天气（晴、雨、雪、雷、雾等）
  - 晴：太阳光晕、漂浮云朵
  - 雨 / 雷雨：Canvas 雨滴粒子 + 随机闪电
  - 雪：飘雪粒子
  - 夜间：星空闪烁 + 真实月相（按月相名称与照明度绘制新月/娥眉月/满月/亏凸月等）
  - 雾 / 霾：雾层流动
- °C / °F 单位切换，城市与单位自动记忆（localStorage）
- 移动端自适应

## 运行方式

方式一：直接双击打开 `index.html`（wttr.in 已开启 CORS，可直接跨域请求）。

方式二（推荐，体验更稳定）：

```bash
# Python
python -m http.server 8000
# 然后访问 http://localhost:8000
```

或用 Node：

```bash
npx serve .
```

## Docker

本地构建并运行：

```bash
docker build -t weather-app .
docker run -d -p 8080:80 weather-app
# 访问 http://localhost:8080
```

推送到 Docker Hub（chengzh）：

```bash
docker login
docker tag weather-app chengzh/weather-app:latest
docker push chengzh/weather-app:latest
```

仓库已配置 GitHub Actions 工作流（`.github/workflows/docker-publish.yml`），在 GitHub 仓库
Settings → Secrets and variables → Actions 中添加 `DOCKERHUB_USERNAME`（chengzh）和
`DOCKERHUB_TOKEN`（Docker Hub 访问令牌）后，每次 push 到 main 会自动构建并推送镜像。

## 目录结构

```text
weather-app/
├── index.html    # 页面结构
├── styles.css    # 主题、玻璃拟态卡片、动画
├── app.js        # 数据获取、渲染、粒子特效
└── README.md
```

## 说明

- 天气数据接口：`https://wttr.in/<城市>?format=j1`，含当前天气、逐小时与 3 天预报。
- 空气质量接口（按优先级）：
  - `https://api.waqi.info/feed/geo:{lat};{lon}/?token=demo`（aqicn 监测站，美标 AQI）
  - `https://devapi.qweather.com/v7/air/now`（可选，需自行申请免费 Key，国标 AQI）
  - `https://air-quality-api.open-meteo.com/v1/air-quality`（兜底模型估算）
- 口径说明：美标 AQI（US EPA）对 PM2.5 和臭氧更敏感，数值通常比国标 AQI（HJ 633-2012）偏高；国内天气 App 多显示国标 AQI。两者都是合法标准，页面会标注当前所用口径。
- wttr.in 有请求频率限制（429），频繁刷新时请稍等片刻。
- 天气图标为内联 SVG 自绘，中文描述由天气代码映射而来。
