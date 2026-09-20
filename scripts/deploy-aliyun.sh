#!/usr/bin/env bash
# 将 dist/ 同步到阿里云 OSS（仅作媒体源；页面仍用 GitHub Pages）
# 推荐华东，例如杭州：
#   export OSS_BUCKET=zyp-love-zy-hz
#   export OSS_ENDPOINT=oss-cn-hangzhou.aliyuncs.com
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
: "${OSS_ENDPOINT:?请设置 OSS_ENDPOINT，例如 oss-cn-hangzhou.aliyuncs.com}"
: "${OSS_AK:?请设置 OSS_AK}"
: "${OSS_SK:?请设置 OSS_SK}"

cd "$ROOT"
# 本地构建可不设 VITE_ASSET_BASE；上传的是 media 等静态文件
npm run build

echo "同步 dist/ -> oss://${OSS_BUCKET}/ ..."
"$OSSUTIL" sync "$ROOT/dist/" "oss://${OSS_BUCKET}/" \
  -e "$OSS_ENDPOINT" \
  -i "$OSS_AK" \
  -k "$OSS_SK" \
  -f \
  --delete \
  --jobs 8 \
  --parallel 8 \
  --meta "Cache-Control:public,max-age=31536000"

echo
echo "完成。桶需：关闭「阻止公共访问」+ 公共读。"
echo "媒体示例："
echo "  https://${OSS_BUCKET}.${OSS_ENDPOINT}/media/thumbs/01_maozi_01.webp"
echo "网页仍用 GitHub Pages；确认 Actions 里 VITE_ASSET_BASE 已指向上述域名。"
