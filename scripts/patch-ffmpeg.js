// scripts/patch-ffmpeg.js
const fs = require("fs");
const path = require("path");

console.log("🔧 Starting FFmpeg Kit patch process...");

// Path to the FFmpeg build.gradle file
const ffmpegBuildGradlePath = path.join(
  __dirname,
  "../node_modules/ffmpeg-kit-react-native/android/build.gradle"
);

// Make sure the file exists
if (!fs.existsSync(ffmpegBuildGradlePath)) {
  console.error("❌ FFmpeg build.gradle file not found!");
  console.error(`Expected path: ${ffmpegBuildGradlePath}`);
  process.exit(1);
}

console.log("📁 Found FFmpeg build.gradle file");

// Read the original content
let content = fs.readFileSync(ffmpegBuildGradlePath, "utf8");

console.log("📖 Reading original content...");

// Create backup of original file
const backupPath = ffmpegBuildGradlePath + ".backup";
if (!fs.existsSync(backupPath)) {
  fs.writeFileSync(backupPath, content, "utf8");
  console.log("💾 Created backup file");
}

// Define the patterns to search and replace
const originalDependencyPattern = /implementation\s+['"]com\.arthenica:ffmpeg-kit-['"].+?['"]com\.arthenica:ffmpeg-kit-.+?['"]/g;
const originalDependencyLine = "implementation 'com.arthenica:ffmpeg-kit-' + safePackageName(safeExtGet('ffmpegKitPackage', 'https')) + ':' + safePackageVersion(safeExtGet('ffmpegKitPackage', 'https'))";
const newDependencyLine = "implementation(name: 'ffmpeg-kit-full-gpl', ext: 'aar')";

// Step 1: Remove any existing implementation from buildscript block
console.log("🔄 Removing implementation from buildscript block...");
content = content.replace(
  /buildscript\s*{([\s\S]*?)dependencies\s*{([\s\S]*?)}([\s\S]*?)}/,
  (match, beforeDeps, depsContent, afterDeps) => {
    // Remove any ffmpeg implementation lines from buildscript dependencies
    const cleanedDeps = depsContent.replace(
      /\s*implementation\(name:\s*['"]ffmpeg-kit-full-gpl['"],\s*ext:\s*['"]aar['"]\)\s*/g,
      ""
    );
    return `buildscript {${beforeDeps}dependencies {${cleanedDeps}}${afterDeps}}`;
  }
);

// Step 2: Replace the original implementation line in main dependencies block
console.log("🔄 Updating main dependencies block...");
if (content.includes(originalDependencyLine)) {
  content = content.replace(originalDependencyLine, newDependencyLine);
  console.log("✅ Replaced original FFmpeg dependency");
} else {
  // If the exact line isn't found, try pattern matching
  const updatedContent = content.replace(originalDependencyPattern, newDependencyLine);
  if (updatedContent !== content) {
    content = updatedContent;
    console.log("✅ Replaced FFmpeg dependency using pattern matching");
  } else {
    // If neither worked, add it manually to dependencies block
    console.log("⚠️ Original dependency line not found, adding new implementation...");
    content = content.replace(
      /(dependencies\s*{[\s\S]*?)(}[\s\S]*?^})/m,
      (match, depsBlock, closing) => {
        if (!depsBlock.includes("implementation(name: 'ffmpeg-kit-full-gpl'")) {
          return depsBlock + `\n    ${newDependencyLine}\n` + closing;
        }
        return match;
      }
    );
  }
}

// Step 3: Ensure flatDir repository is present in the main repositories block (not buildscript)
console.log("🔄 Adding flatDir repository...");
const flatDirRepo = 'flatDir { dirs "$rootDir/libs" }';

// Check if flatDir is already in main repositories
if (!content.includes(flatDirRepo)) {
  // Find the main repositories block (after buildscript)
  content = content.replace(
    /(buildscript\s*{[\s\S]*?}[\s\S]*?repositories\s*{)/,
    (match) => {
      return match + `\n        ${flatDirRepo}`;
    }
  );
  console.log("✅ Added flatDir repository");
} else {
  console.log("ℹ️ flatDir repository already exists");
}

// Step 4: Update minSdkVersion if needed
console.log("🔄 Checking minSdkVersion...");
if (content.includes('minSdkVersion safeExtGet(\'ffmpegKitPackage\', \'https\').contains("-lts") ? 16 : 24')) {
  content = content.replace(
    /minSdkVersion safeExtGet\('ffmpegKitPackage', 'https'\)\.contains\("-lts"\) \? 16 : 24/,
    'minSdkVersion 24'
  );
  console.log("✅ Updated minSdkVersion to 24");
}

// Step 5: Write the modified content back
try {
  fs.writeFileSync(ffmpegBuildGradlePath, content, "utf8");
  console.log("✅ Successfully patched FFmpeg build.gradle file");
  console.log("🎉 FFmpeg Kit patch completed successfully!");
} catch (error) {
  console.error("❌ Failed to write patched file:", error);
  process.exit(1);
}

// Step 6: Verify the changes
console.log("🔍 Verifying changes...");
const verification = fs.readFileSync(ffmpegBuildGradlePath, "utf8");
if (verification.includes(newDependencyLine)) {
  console.log("✅ Verification passed: New implementation line found");
} else {
  console.error("❌ Verification failed: New implementation line not found");
  process.exit(1);
}