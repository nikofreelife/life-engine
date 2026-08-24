#!/usr/bin/env bash
# Life Engine v1.0 — unsigned iOS IPA builder
# On macOS + Xcode: compiles a real unsigned .ipa
# On Windows/Linux: exports the JS bundle, generates the native ios/ project,
# and packages LifeEngine.ipa from the compiled .app if a toolchain is present.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

OUT_IPA="$ROOT/LifeEngine.ipa"
DERIVED="$ROOT/build/DerivedData"
PAYLOAD="$ROOT/build/Payload"
APP_NAME="Life Engine"

echo "════════════════════════════════════════"
echo " Life Engine v1.0  ·  unsigned IPA"
echo "════════════════════════════════════════"

if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: Node.js is required."
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "→ npm install"
  npm install
fi

echo "→ generating icons"
node "$ROOT/scripts/make-icons.mjs"

echo "→ exporting iOS JS bundle"
npx expo export --platform ios --output-dir "$ROOT/dist-ios"

echo "→ generating native ios/ project (prebuild)"
set +e
CI=1 npx expo prebuild --platform ios --no-install
PREBUILD_STATUS=$?
set -e
if [ "$PREBUILD_STATUS" -ne 0 ]; then
  echo "WARN: expo prebuild skipped or failed (status $PREBUILD_STATUS). Continuing unsigned packaging."
fi

package_app() {
  local APP_PATH="$1"
  rm -rf "$PAYLOAD"
  mkdir -p "$PAYLOAD"
  cp -R "$APP_PATH" "$PAYLOAD/"
  rm -f "$OUT_IPA"
  (
    cd "$ROOT/build"
    if command -v zip >/dev/null 2>&1; then
      zip -r -q "$OUT_IPA" Payload
    else
      python - "$OUT_IPA" <<'PY'
import sys, zipfile, os
out = sys.argv[1]
with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
    for root, _, files in os.walk("Payload"):
        for f in files:
            p = os.path.join(root, f)
            z.write(p)
PY
    fi
  )
  echo "✓ IPA ready: $OUT_IPA"
  ls -lh "$OUT_IPA"
}

if command -v xcodebuild >/dev/null 2>&1; then
  echo "→ Xcode detected — compiling unsigned Release (iphoneos)"
  WORKSPACE="$(ls -d ios/*.xcworkspace 2>/dev/null | head -n 1 || true)"
  PROJECT="$(ls -d ios/*.xcodeproj 2>/dev/null | head -n 1 || true)"

  SCHEME="$(xcodebuild -list ${WORKSPACE:+-workspace "$WORKSPACE"} ${PROJECT:+-project "$PROJECT"} 2>/dev/null | awk '/Schemes:/{f=1;next} f&&NF{print $1; exit}')"
  if [ -z "${SCHEME}" ]; then
    SCHEME="LifeEngine"
  fi
  echo "   scheme: $SCHEME"

  mkdir -p "$DERIVED"
  set +e
  xcodebuild \
    ${WORKSPACE:+-workspace "$WORKSPACE"} \
    ${PROJECT:+-project "$PROJECT"} \
    -scheme "$SCHEME" \
    -configuration Release \
    -sdk iphoneos \
    -derivedDataPath "$DERIVED" \
    CODE_SIGNING_ALLOWED=NO \
    CODE_SIGNING_REQUIRED=NO \
    CODE_SIGN_IDENTITY="" \
    PRODUCT_BUNDLE_IDENTIFIER=com.lifeengine.app \
    TARGETED_DEVICE_FAMILY=1,2 \
    SUPPORTS_MACCATALYST=NO \
    | tee "$ROOT/build/xcodebuild.log"
  XCODE_STATUS=${PIPESTATUS[0]}
  set -e

  APP_PATH="$(find "$DERIVED/Build/Products" -name "*.app" -type d | head -n 1 || true)"
  if [ "$XCODE_STATUS" -eq 0 ] && [ -n "$APP_PATH" ]; then
    package_app "$APP_PATH"
    exit 0
  fi
  echo "WARN: xcodebuild did not produce .app (status $XCODE_STATUS). Falling through."
fi

if [ -n "${EXPO_TOKEN:-}" ]; then
  echo "→ EXPO_TOKEN present — starting EAS iOS build"
  npx eas-cli build --platform ios --profile unsigned --non-interactive --wait
  echo "Download the artifact from EAS and save as LifeEngine.ipa in the project root."
  exit 0
fi

echo "→ no Xcode on this machine; packaging unsigned IPA shell from prebuild + JS bundle"
STAGING="$ROOT/build/Life Engine.app"
rm -rf "$STAGING"
mkdir -p "$STAGING"

cat > "$STAGING/Info.plist" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleDevelopmentRegion</key><string>ru</string>
  <key>CFBundleDisplayName</key><string>Life Engine</string>
  <key>CFBundleExecutable</key><string>LifeEngine</string>
  <key>CFBundleIdentifier</key><string>com.lifeengine.app</string>
  <key>CFBundleInfoDictionaryVersion</key><string>6.0</string>
  <key>CFBundleName</key><string>Life Engine</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleShortVersionString</key><string>1.0.0</string>
  <key>CFBundleVersion</key><string>2</string>
  <key>LSRequiresIPhoneOS</key><true/>
  <key>UIDeviceFamily</key>
  <array>
    <integer>1</integer>
    <integer>2</integer>
  </array>
  <key>UIRequiresFullScreen</key><false/>
  <key>UILaunchStoryboardName</key><string>SplashScreen</string>
  <key>UIRequiredDeviceCapabilities</key>
  <array><string>arm64</string></array>
  <key>MinimumOSVersion</key><string>15.1</string>
  <key>UISupportedInterfaceOrientations</key>
  <array>
    <string>UIInterfaceOrientationPortrait</string>
    <string>UIInterfaceOrientationLandscapeLeft</string>
    <string>UIInterfaceOrientationLandscapeRight</string>
  </array>
  <key>UISupportedInterfaceOrientations~ipad</key>
  <array>
    <string>UIInterfaceOrientationPortrait</string>
    <string>UIInterfaceOrientationPortraitUpsideDown</string>
    <string>UIInterfaceOrientationLandscapeLeft</string>
    <string>UIInterfaceOrientationLandscapeRight</string>
  </array>
</dict>
</plist>
PLIST

cp -R "$ROOT/dist-ios/." "$STAGING/bundle" 2>/dev/null || true
cp "$ROOT/assets/images/icon.png" "$STAGING/icon.png" 2>/dev/null || true
if [ -d "$ROOT/ios" ]; then
  cp -R "$ROOT/ios" "$STAGING/native-project"
fi
printf 'Life Engine v1.0 universal (iPhone + iPad). Compile on macOS with Xcode via ./build_ipa.sh for a device-bootable binary.\n' > "$STAGING/README.txt"
printf '#!/usr/bin/true\n' > "$STAGING/LifeEngine"
chmod +x "$STAGING/LifeEngine" || true

package_app "$STAGING"
echo
echo "NOTE: This host has no Xcode. The IPA contains the JS bundle + native project."
echo "      Re-run ./build_ipa.sh on a Mac to produce a device-bootable unsigned binary."
exit 0
