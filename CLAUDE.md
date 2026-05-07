# 零食补货系统 (snack-replenish)

## 项目概述

给 Pascal 的健康零食门店开发的内部补货管理网页应用。店长在手机上提交补货需求，老板查看并填写订货信息，店长收货后确认验收。

## 技术栈

- Next.js 16 (App Router) + TypeScript + Turbopack
- Tailwind CSS v4
- Supabase PostgreSQL（生产数据库）
- Vercel 部署（通过 GitHub OAuth 关联）
- 本地 dev 也直连 Supabase，无本地 SQLite

## 业务规则

- 产品名由店员手动输入，无固定产品列表
- 补货请求必填：所属门店、产品名、公斤数；其余选填
- 到货验收必填：收货日期、实收数量、验货反馈；其余选填
- 状态流转：待处理 → 已订货 → 已收货

## 角色

- OWNER（老板）：看全部数据，管理门店和用户，填写订货信息
- STORE_MANAGER（店长）：只看自己门店数据，提交补货，确认到货

## 品牌设计

- 品牌名待定（商标注册中）
- 风格关键词：Fresh, Healthy, Professional, Premium, Natural, Appetizing, Comfortable
- 品牌色：绿 #4A6B3A (Pantone 574C, 30%) / 金 #D5A84A (Pantone 7555C, 10%) / 米 #F5EFDB (Pantone 7506C, 60%)
- CSS 中已定义：brand-green, brand-gold, brand-cream, brand-green-dark, brand-gold-light

## 约定

- UI 语言：中文
- 代码注释：中文（因为 Pascal 不是技术背景）
- 移动优先：所有页面以手机端为主要设计目标
- 简洁优先：不过度设计，不做没被要求的功能
- 改动前先在 Plan Mode 出方案，Pascal 确认后再动手

## 运行命令

```bash
npm run dev    # 启动开发服务器 (http://localhost:3000)
npm run build  # 构建生产版本
npm run lint   # 代码检查
npx tsx scripts/seed.ts  # 重置种子数据
```

## 环境变量 (.env)

- `DATABASE_URL` — Supabase PostgreSQL 连接串（端口 5432 本地/直连，6543 Vercel 连接池）
- `SUPABASE_URL` — https://prvgbgouexmhinxphuwh.supabase.co
- `SUPABASE_ANON_KEY` — 可发布密钥

## 关键文件

- `src/lib/db.ts` — 数据库层（pg Pool，async/await）
- `src/lib/session.ts` — Cookie HMAC 认证
- `src/proxy.ts` — 路由守卫（Next.js 16 规范，替代旧 middleware）
