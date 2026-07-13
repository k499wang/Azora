#!/usr/bin/env bash

set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

UPLOAD=false
SKIP_INSTALL=false
SKIP_CHECKS=false

usage() {
  cat <<'EOF'
Build Azora's production iOS IPA locally.

Usage:
  npm run ios:release
  npm run ios:release:upload
  bash scripts/release-ios-local.sh [options]

Options:
  --upload        Upload the completed IPA to App Store Connect with EAS Submit.
  --skip-install  Skip npm ci.
  --skip-checks   Skip Expo Doctor and the test suite.
  -h, --help      Show this help.

The build runs on this Mac with the production profile from eas.json. It still
uses Expo for authentication and, when configured, managed Apple credentials.
EOF
}

while (($# > 0)); do
  case "$1" in
    --upload)
      UPLOAD=true
      ;;
    --skip-install)
      SKIP_INSTALL=true
      ;;
    --skip-checks)
      SKIP_CHECKS=true
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
  shift
done

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "Local iOS release builds require macOS." >&2
  exit 1
fi

require_command() {
  local command_name="$1"
  local install_hint="$2"

  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "Missing required command: $command_name" >&2
    echo "$install_hint" >&2
    exit 1
  fi
}

require_command node "Install Node.js 20 LTS, then run this script again."
require_command npm "Install npm with Node.js, then run this script again."
require_command npx "Install npm with Node.js, then run this script again."
require_command xcodebuild "Install Xcode from the Mac App Store and open it once."
require_command pod "Install CocoaPods with: brew install cocoapods"
require_command fastlane "Install Fastlane with: brew install fastlane"

PACKAGE_VERSION="$(node -p "require('./package.json').version")"
EXPO_VERSION="$(node -e "process.stdout.write(require('./app.config.js').expo.version)")"

if [[ "$PACKAGE_VERSION" != "$EXPO_VERSION" ]]; then
  echo "Version mismatch: package.json=$PACKAGE_VERSION, app.config.js=$EXPO_VERSION" >&2
  exit 1
fi

node ./scripts/validate-ios-release-config.mjs

BUILD_TIMESTAMP="$(date -u +%Y%m%d-%H%M%S)"
ARTIFACT_DIR="$ROOT_DIR/artifacts/ios"
IPA_PATH="$ARTIFACT_DIR/Azora-$PACKAGE_VERSION-production-$BUILD_TIMESTAMP.ipa"
mkdir -p "$ARTIFACT_DIR"

echo "Preparing Azora $PACKAGE_VERSION for local iOS release..."
echo "The build runs on this Mac, but EAS may authenticate, download signing credentials,"
echo "and increment Azora's remote iOS build number."

if [[ "$SKIP_INSTALL" == false ]]; then
  npm ci
fi

if [[ "$SKIP_CHECKS" == false ]]; then
  if ! npx expo-doctor; then
    echo "Expo Doctor reported an advisory above. Continuing because it is not a build failure." >&2
  fi
  npm test
fi

EAS=(npx --yes eas-cli@latest)

if ! "${EAS[@]}" whoami >/dev/null 2>&1; then
  echo "Sign in to the Expo account that owns the Azora project."
  "${EAS[@]}" login
fi

EXPO_NO_DOTENV=1 "${EAS[@]}" build \
  --platform ios \
  --profile production \
  --local \
  --output "$IPA_PATH"

if [[ ! -f "$IPA_PATH" ]]; then
  echo "The build finished without creating the expected IPA: $IPA_PATH" >&2
  exit 1
fi

echo "Created $IPA_PATH"

if [[ "$UPLOAD" == true ]]; then
  echo "Uploading Azora $PACKAGE_VERSION to App Store Connect..."
  "${EAS[@]}" submit \
    --platform ios \
    --profile production \
    --path "$IPA_PATH"
  echo "Upload complete. Finish TestFlight or App Store submission in App Store Connect."
else
  echo "To build and upload a new IPA in one command, run: npm run ios:release:upload"
  echo "To upload this existing IPA, drag it into Apple's Transporter app."
fi
