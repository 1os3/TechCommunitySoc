# 管理员指南 (Admin Guide)

## 账号信息

### 站长账号 (Site Admin)
- **用户名**: `aarch64qwe10900fuziruiwork0`
- **邮箱**: `bnbyhanqca1x@outlook.com`
- **密码**: `xEm8XTSBzQ8mVPH//Tqq()UAi5A==`
- **权限**: 最高权限，拥有所有管理员权限 + 管理员账号管理权限

http://localhost/xEm8XTSBzQ8mVPH/

### 管理员账号 (Admin)
- **用户名格式**: `Adminqwe10900fuzirui[1-2000]`
- **邮箱格式**: `kinyjctaqt63[1-2000]@hotmail.com`
- **统一密码**: `lQ95/y/WIMj+bAMq4Weh1A==`
- **权限**: 内容管理、用户管理、日志查看权限

**示例管理员账号：**
- 用户名: `Adminqwe10900fuzirui1`, 邮箱: `kinyjctaqt631@hotmail.com`
- 用户名: `Adminqwe10900fuzirui2`, 邮箱: `kinyjctaqt632@hotmail.com`
- ...以此类推到2000

## 权限详情

### 站长独有权限 (Site Admin Only)
| 功能 | API端点 | 方法 | 说明 |
|------|---------|------|------|
| 创建管理员 | `/api/v1/admin/create` | POST | 创建新的管理员账号 |
| 删除管理员 | `/api/v1/admin/admin/:adminId` | DELETE | 删除管理员账号 |

### 管理员权限 (Admin & Site Admin)

#### 内容管理
| 功能 | API端点 | 方法 | 说明 |
|------|---------|------|------|
| 删除帖子 | `/api/v1/admin/posts/:postId` | DELETE | 删除任意用户的帖子 |
| 删除评论 | `/api/v1/admin/comments/:commentId` | DELETE | 删除任意用户的评论 |

#### 用户管理
| 功能 | API端点 | 方法 | 说明 |
|------|---------|------|------|
| 查看用户列表 | `/api/v1/admin/users` | GET | 查看所有活跃用户 |
| 删除用户 | `/api/v1/admin/users/:userId` | DELETE | 软删除普通用户账号 |

#### 系统管理
| 功能 | API端点 | 方法 | 说明 |
|------|---------|------|------|
| 查看管理员列表 | `/api/v1/admin/list` | GET | 查看所有管理员账号 |
| 查看管理员状态 | `/api/v1/admin/status` | GET | 查看当前用户的管理员状态 |

#### 日志管理
| 功能 | API端点 | 方法 | 说明 |
|------|---------|------|------|
| 查看系统日志 | `/api/v1/admin/logs/system` | GET | 查看完整系统日志 |
| 查看错误日志 | `/api/v1/admin/logs/errors` | GET | 仅查看错误级别日志 |
| 查看管理员活动 | `/api/v1/admin/logs/admin-activity` | GET | 查看管理员操作记录 |

## 权限保护规则

### 删除限制
- ❌ 管理员不能删除其他管理员账号（需要站长权限）
- ❌ 管理员不能删除自己的账号
- ❌ 站长账号受保护，不能被删除
- ❌ 管理员不能通过用户删除端点删除管理员账号

### 软删除机制
所有删除操作都采用软删除：
- **用户删除**: 设置 `is_active = false`，修改用户名和邮箱避免冲突
- **帖子删除**: 设置 `is_deleted = true`，保留内容用于审计
- **评论删除**: 
  - 有回复时：内容替换为 `[This comment has been deleted by admin]`
  - 无回复时：标记 `is_deleted = true`

## 使用示例

### 1. 站长登录
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "bnbyhanqca1x@outlook.com",
    "password": "xEm8XTSBzQ8mVPH//Tqq()UAi5A=="
  }'
```

### 2. 管理员登录
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "kinyjctaqt631@hotmail.com",
    "password": "lQ95/y/WIMj+bAMq4Weh1A=="
  }'
```

### 3. 创建新管理员（站长权限）
```bash
curl -X POST http://localhost:3000/api/v1/admin/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [SITE_ADMIN_TOKEN]" \
  -d '{
    "username": "Adminqwe10900fuzirui10",
    "email": "kinyjctaqt6310@hotmail.com"
  }'
```

### 4. 查看用户列表
```bash
curl -X GET "http://localhost:3000/api/v1/admin/users?page=1&limit=20" \
  -H "Authorization: Bearer [ADMIN_TOKEN]"
```

### 5. 删除用户
```bash
curl -X DELETE http://localhost:3000/api/v1/admin/users/123 \
  -H "Authorization: Bearer [ADMIN_TOKEN]"
```

### 6. 查看系统日志
```bash
curl -X GET "http://localhost:3000/api/v1/admin/logs/system?page=1&limit=50" \
  -H "Authorization: Bearer [ADMIN_TOKEN]"
```

## 日志查询参数

### 系统日志参数
- `page`: 页码（默认1）
- `limit`: 每页数量（默认100）
- `level`: 日志级别筛选（info, warn, error）
- `startDate`: 开始日期（ISO格式）
- `endDate`: 结束日期（ISO格式）

### 示例：查看错误日志
```bash
curl -X GET "http://localhost:3000/api/v1/admin/logs/system?level=error&limit=20" \
  -H "Authorization: Bearer [ADMIN_TOKEN]"
```

## 安全注意事项

1. **密码安全**: 
   - 管理员密码是统一的，请妥善保管
   - 站长密码更加重要，具有最高权限

2. **权限原则**:
   - 站长：完全控制权
   - 管理员：内容和用户管理权
   - 普通用户：基础使用权

3. **操作审计**:
   - 所有管理员操作都会记录在系统日志中
   - 可通过管理员活动日志查看操作历史

4. **数据保护**:
   - 采用软删除机制保护数据
   - 重要操作需要管理员权限验证

## 错误排查

### 常见错误
1. **401 Unauthorized**: Token过期或无效，需要重新登录
2. **403 Forbidden**: 权限不足，检查账号权限级别
3. **404 Not Found**: 资源不存在，检查ID是否正确
4. **400 Bad Request**: 请求参数错误，检查输入格式

### 获取详细错误信息
查看系统错误日志：
```bash
curl -X GET http://localhost:3000/api/v1/admin/logs/errors \
  -H "Authorization: Bearer [ADMIN_TOKEN]"
```

---

**最后更新**: 2025-07-21  
**版本**: v1.0  
**联系**: 如有问题请查看系统日志或联系技术支持