# Shadowrocket 安装与真机排障

本文根据 QPin iOS Network Location 在真实 iPhone、Shadowrocket、VLESS 节点环境中的安装和排障过程整理。

## 先确认工具边界

QPin iOS Network Location 修改的是 Apple 的 **Wi-Fi / 基站网络定位**，不是 GPS 硬件信号。

- 适合室内、Wi-Fi 环境以及依赖网络定位的测试场景
- 户外 GPS 信号较强时，系统或 App 仍可能显示真实 GPS 位置
- 不保证所有 App 都采用网络定位结果
- 不提供“防封”“绝对安全”或未经验证的 iOS 版本承诺

## 一、安装最新版模块

1. 在 iPhone Safari 打开：

   <https://ios-location.qpinmap.com/zh-CN/>

2. 在页面的“选择代理模块”中点击 **Shadowrocket**。
3. 允许 Safari 打开 Shadowrocket。
4. 确认安装 `QPin iOS Network Location` 模块。
5. 进入 Shadowrocket 当前正在使用的配置，确认模块已启用。
6. 将“全局路由”设置为 **配置**，再开始排障。

如果点击按钮没有跳转，可以在 Shadowrocket 中手动添加：

```text
https://ios-location.qpinmap.com/modules/qpin-nl.module
```

模块更新后需要执行：

1. 刷新模块
2. 确认当前配置仍然启用该模块
3. 断开并重新连接 Shadowrocket

不要使用旧的本地副本反复测试。最新版模块包含 HTTP/2 MITM 设置和仅针对两个 WLOC 域名的 QUIC 回退规则。

## 二、安装并完全信任 HTTPS 解密证书

Shadowrocket 需要在本机解密 Apple WLOC 请求，证书只应作用于以下主机：

```text
gs-loc.apple.com
gs-loc-cn.apple.com
```

典型安装流程：

1. Shadowrocket → 配置 → 当前已勾选配置右侧的信息按钮
2. HTTPS 解密 → 证书 → 生成新的 CA 证书
3. 安装系统弹出的描述文件
4. iPhone 设置 → 通用 → VPN 与设备管理 → 安装描述文件
5. iPhone 设置 → 通用 → 关于本机 → 证书信任设置
6. 对刚安装的 Shadowrocket CA 开启“完全信任”
7. 回到 Shadowrocket，开启 HTTPS 解密并重新连接

不要把 `*.apple.com`、`*.icloud.com` 加入 MITM。扩大解密范围会增加安全风险，也可能导致其他 Apple 服务异常。

## 三、检查模块的关键配置

最新版 Shadowrocket 模块应包含三部分：

### WLOC 响应脚本

匹配：

```text
https://gs-loc.apple.com/clls/wloc
https://gs-loc-cn.apple.com/clls/wloc
```

### 网页设置接口

匹配：

```text
https://gs-loc.apple.com/qpin-nl/settings
https://gs-loc-cn.apple.com/qpin-nl/settings
```

网页通过这个接口把坐标写入 Shadowrocket 本地存储。坐标不会上传到 QPin 后端。

### MITM 与 QUIC 回退

模块应包含：

```ini
[MITM]
enable = true
h2 = true
hostname = %APPEND% gs-loc.apple.com, gs-loc-cn.apple.com
```

同时应有只针对这两个域名的 UDP/443 拒绝规则，让 `locationd` 从 QUIC 回退到可解密的 HTTP/2。不要为了排障全局屏蔽所有 UDP/443。

## 四、VLESS 节点与伪装域名

使用 VLESS 节点、并把节点 TLS/SNI 伪装成其他域名，不会直接改变 QPin 模块的 MITM 主机名。

- VLESS 的 SNI 是手机连接代理服务器时的外层传输参数
- `gs-loc.apple.com` 和 `gs-loc-cn.apple.com` 是手机访问 Apple WLOC 时的目标域名
- 不要把 VLESS 的伪装域名加入 QPin MITM 列表
- 不需要为了 QPin 修改服务器端 VLESS 证书或伪装域名

日志中看到类似下面的内容：

```text
DOMAIN,gs-loc-cn.apple.com,苹果服务 # DIRECT
```

只说明该请求最终匹配了“苹果服务”的出站分流策略。`DIRECT` 或 `PROXY` 本身不能证明响应脚本是否运行，因为 MITM 和脚本处理发生在 Shadowrocket 本机。

判断是否生效，应以网页的模块状态、设置接口返回结果和 QPin 脚本日志为准。

## 五、第一次设置位置

1. 保持 Shadowrocket 已连接，当前配置和模块已启用。
2. 用 Safari 打开 QPin 选点页面。
3. 等待顶部状态显示“模块已就绪”。
4. 搜索地点、点击地图或拖动地图选择目标。
5. 确认页面显示正确的地点名称和经纬度。
6. 点击“储存到设备”。
7. 等待按钮下方显示“已储存到设备”。
8. 展开“高级工具”，点击“刷新”，确认“当前生效坐标”与目标一致。

如果网页一直显示“模块未生效”，先不要测试地图定位，直接按照下一节排查设置接口。

## 六、网页显示“模块未生效”

按顺序检查：

1. **当前配置**：模块必须安装在 Shadowrocket 当前勾选、当前正在使用的配置中。
2. **模块开关**：在当前配置的模块列表中确认 `QPin iOS Network Location` 已启用。
3. **全局路由**：排障阶段使用“配置”模式，不要使用可能跳过模块规则的特殊全局模式。
4. **证书安装**：仅安装描述文件还不够，必须在“证书信任设置”里开启完全信任。
5. **HTTPS 解密**：当前配置的 HTTPS 解密开关必须开启，并包含两个 WLOC 主机。
6. **HTTP/2**：当前配置和模块中的 HTTP/2 MITM 必须启用。
7. **模块版本**：刷新模块，确认包含两个 UDP/443 回退规则，然后重新连接 Shadowrocket。
8. **冲突模块**：临时关闭其他会修改 Apple 域名、HTTPS 解密或 `/clls/wloc` 的模块后重试。
9. **重新诊断**：回到网页，展开“高级工具”并运行诊断。

Shadowrocket 的不同版本不一定在单条请求详情中显示字面上的 `MITM` 标签。不要只看标签判断，应检查网页是否能成功执行 `query/save`，以及日志中是否出现 QPin 脚本记录。

## 七、储存成功但地图位置没有变化

先区分“坐标没有写入”和“iOS 没有采用网络定位”。

### 检查坐标是否写入

1. 展开“高级工具”
2. 查看“当前生效坐标”
3. 点击“刷新”
4. 确认坐标与刚选择的目标一致

如果坐标不一致：

1. 点击“清除并恢复真实网络定位”
2. 重新选择目标
3. 再次储存
4. 刷新当前生效坐标

### 处理 iOS 定位缓存

如果坐标一致但系统位置没有变化：

1. 在室内或 Wi-Fi 环境测试
2. 完全退出并重新打开地图 App
3. 关闭再开启定位服务
4. 断开并重新连接 Shadowrocket
5. 必要时重启 iPhone，清理 `locationd` 缓存

QPin 修改的是网络定位。户外 GPS 信号较强时，iOS 可能继续采用 GPS，这不是模块写入失败。

## 八、日志中只有 `gs-loc-cn.apple.com/clls/wloc`

中国大陆网络环境更常出现：

```text
https://gs-loc-cn.apple.com/clls/wloc
```

其他环境可能使用：

```text
https://gs-loc.apple.com/clls/wloc
```

模块同时覆盖两个域名。只出现其中一个是正常现象，不需要强制把请求改到另一个域名。

如果能看到 `/clls/wloc` 请求但位置不变：

1. 确认 QPin 响应脚本已触发
2. 确认当前生效坐标正确
3. 检查 iOS 缓存和强 GPS 覆盖
4. 检查是否有其他模块改写同一响应

## 九、坐标不是刚选择的位置

常见原因：

- Shadowrocket 本地存储仍保留上一次坐标
- 页面只选点但没有点击“储存到设备”
- 安装的是旧模块，模块参数里写死了经纬度
- 收藏位置被再次点击并设为目标

处理方法：

1. 高级工具 → 清除并恢复真实网络定位
2. 刷新最新版模块
3. 确认模块参数中的 `longitude` 和 `latitude` 为空
4. 重新选点并储存
5. 刷新“当前生效坐标”

坐标优先级：

```text
网页储存坐标 > 模块参数坐标 > 透传真实网络定位
```

## 十、恢复真实网络定位

1. 网页 → 高级工具 → 清除并恢复真实网络定位
2. 在 Shadowrocket 中禁用或删除 QPin 模块
3. 不再使用时，删除 Shadowrocket CA 描述文件并关闭证书完全信任
4. 如果仍显示缓存位置，重启 iPhone

## 安全提醒

Shadowrocket 完整配置导出文件可能包含：

- 代理节点地址和凭证
- VLESS UUID
- CA 证书私钥数据
- CA 密码

不要把完整配置、`ca-p12`、`ca-passphrase` 或节点凭证发布到 GitHub、论坛或聊天群。如果已经公开，应重新生成 Shadowrocket CA，并轮换代理节点凭证。

## 相关文档

- [通用安装说明](./install.md)
- [代理模块说明](./proxy-modules.md)
- [MITM 证书说明](./mitm-certificate.md)
- [故障排查](./troubleshooting.md)
- [真机测试清单](./device-test-checklist.md)
