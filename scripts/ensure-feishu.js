// 确保 OpenClaw 飞书网关在 dev 启动前已运行
const { execSync } = require("child_process");

function gatewayOk() {
  try {
    execSync("openclaw gateway health", { timeout: 8000, stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

if (gatewayOk()) {
  console.log("[predev] 飞书网关已在运行");
} else {
  console.log("[predev] 启动飞书网关…");
  try {
    execSync('powershell -Command "schtasks /Run /TN \'OpenClaw Gateway\'"', { stdio: "ignore", timeout: 15000 });
    // 同步等待最多 5 秒
    const end = Date.now() + 5000;
    let ok = false;
    while (Date.now() < end && !ok) {
      ok = gatewayOk();
    }
    console.log(ok ? "[predev] 飞书网关已就绪" : "[predev] 网关启动中，继续启动 dev…");
  } catch {
    console.log("[predev] 网关启动失败，继续启动 dev…");
  }
}
