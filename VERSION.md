# 零食补货系统 · 版本记录

## v1.0.0 — 2026-05-09

### 首个正式版本

系统达到可投产状态，支持 CP静安店日常补货管理。

### 核心功能

- 登录认证（HMAC Cookie）
- 补货流程：提交补货需求 → 订货 → 收货验收
- 补货日历：按日期查看提交/订货/到货
- 角色系统：超级管理员、合伙人、店长、店员
- 门店管理
- 用户管理（创建/编辑/删除）
- PWA 支持（手机主屏幕安装，类 App 体验）

### 技术栈

- Next.js 16 + TypeScript + Turbopack
- Supabase PostgreSQL（Supavisor 连接池）
- Vercel 部署（1muyanxuan.xin）

### 关键修复（v1.0.0 前）

- 数据库连接：从直连 IPv6 切到 Supavisor 连接池（IPv4），解决 Vercel 无法解析纯 IPv6 域名的问题
- 清理测试数据，保留 CP静安店和 Pascal 超级管理员账号
