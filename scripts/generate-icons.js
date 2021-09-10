const fs = require("fs");
const path = require("path");
const svg2png = require("svg2png");

const sizes = [16, 19, 24, 38, 48, 96, 128];
const inputFile = path.resolve("resources/entrust_lockup_icon.min.svg");
const outputDir = path.resolve("app/images/");

sizes.forEach((size) => {
  const input = fs.readFileSync(inputFile);
  const output = svg2png.sync(input, { width: size, height: size });

  const outputFilename = "icon-" + size.toString() + ".png";
  fs.writeFileSync(path.join(outputDir, outputFilename), output, {
    flag: "w",
  });
  console.log("Created", outputFilename, "in", outputDir);
});
