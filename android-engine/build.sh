#!/bin/bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

NDK=${NDK:-/home/juwimana/Android/Sdk/ndk/27.1.12297006}
TOOLCHAIN=$NDK/toolchains/llvm/prebuilt/linux-x86_64
JNI_ROOT="$DIR/../android/app/src/main/jniLibs"

mkdir -p "$JNI_ROOT/arm64-v8a" "$JNI_ROOT/armeabi-v7a"

echo "=== Building libtorrentstreamer.so for arm64-v8a ==="
CGO_ENABLED=1 GOOS=android GOARCH=arm64 \
  CC=$TOOLCHAIN/bin/aarch64-linux-android24-clang \
  CXX=$TOOLCHAIN/bin/aarch64-linux-android24-clang++ \
  go build -ldflags="-s -w" -buildmode=c-shared -o "$JNI_ROOT/arm64-v8a/libtorrentstreamer.so" .

echo "=== Building libtorrentstreamer.so for armeabi-v7a (Sony BRAVIA TV) ==="
CGO_ENABLED=1 GOOS=android GOARCH=arm GOARM=7 \
  CC=$TOOLCHAIN/bin/armv7a-linux-androideabi24-clang \
  CXX=$TOOLCHAIN/bin/armv7a-linux-androideabi24-clang++ \
  go build -ldflags="-s -w" -buildmode=c-shared -o "$JNI_ROOT/armeabi-v7a/libtorrentstreamer.so" .

echo "=== Verification ==="
ls -lh "$JNI_ROOT/arm64-v8a/libtorrentstreamer.so" "$JNI_ROOT/armeabi-v7a/libtorrentstreamer.so"
echo "=== Done ==="
