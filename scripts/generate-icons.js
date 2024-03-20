const path = require("path");
const sharp = require("sharp")

const sizes = [16, 19, 24, 32, 38, 48, 64, 96, 128];
const inputFile = path.resolve("resources/logo.svg");
const outputDir = path.resolve("app/images/");

sizes.forEach((size) => sharp(inputFile)
  .resize(size, size)
  .png()
  .toFile(path.join(outputDir, `icon-${size}.png`))
  .then(() => console.log("Created", `icon-${size}.png`, "in", outputDir))
);
