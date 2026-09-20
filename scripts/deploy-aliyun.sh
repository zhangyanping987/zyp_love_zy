#!/usr/bin/env bash
# 将 dist/ 同步到阿里云 OSS（静态网站根目录）
# 用法：
#   export OSS_BUCKET=你的桶名
#   export OSS_ENDPOINT=oss-cn-hongkong.aliyuncs.com   # 按实际地域改
#   export OSS_AK=你的AccessKeyId
#   export OSS_SK=你的AccessKeySecret
#   ./scripts/deploy-aliyun.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OSSUTIL="${OSSUTIL:-$HOME/.local/bin/ossutil}"
if [[ ! -x "$OSSUTIL" ]]; then
  OSSUTIL="$(command -v ossutil || true)"
fi
if [[ -z "${OSSUTIL}" || ! -x "$OSSUTIL" ]]; then
  echo "找不到 ossutil，请先安装到 ~/.local/bin/ossutil"
  exit 1
fi

: "${OSS_BUCKET:?请设置 OSS_BUCKET}"
: "${OSS_ENDPOINT:?请设置 OSS_ENDPOINT，例如 oss-cn-hongkong.aliyuncs.com}"
: "${OSS_AK:?请设置 OSS_AK}"
: "${OSS_SK:?请设置 OSS_SK}"

cd "$ROOT"
npm run build

echo "同步 dist/ -> oss://${OSS_BUCKET}/ ..."
"$OSSUTIL" sync "$ROOT/dist/" "oss://${OSS_BUCKET}/" \
  -e "$OSS_ENDPOINT" \
  -i "$OSS_AK" \
  -k "$OSS_SK" \
  -f \
  --delete \
  --jobs 8 \
  --parallel 8

echo
echo "完成。桶需公共读。"
echo "注意：Bucket 外网域名打开 index.html 会下载，不能当网站用。"
echo "推荐：媒体用 OSS，页面用 GitHub Pages（见 docs/阿里云部署.md）。"
echo "媒体示例："
echo "  https://${OSS_BUCKET}.${OSS_ENDPOINT}/media/images/01_maozi_01.webp"
