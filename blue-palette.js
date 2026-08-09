const fs = require("fs");

const files = [
  "index.html",
  "wp-content/uploads/elementor/css/post-16431.css",
];

const colors = new Map([
  ["#FF8400", "#007eff"],
  ["#ff8400", "#007eff"],
  ["#FFD000", "#5fb5ff"],
  ["#ffd000", "#5fb5ff"],
  ["#FF6F00", "#005cff"],
  ["#ff6f00", "#005cff"],
  ["#FF8000", "#007eff"],
  ["#ff8000", "#007eff"],
  ["#994D00", "#003f91"],
  ["#994d00", "#003f91"],
  ["#FFB700", "#67c1ff"],
  ["#ffb700", "#67c1ff"],
  ["#FF5900", "#005cff"],
  ["#ff5900", "#005cff"],
  ["#F57F00", "#007eff"],
  ["#f57f00", "#007eff"],
  ["#FEFAB3", "#ffffff"],
  ["#fefab3", "#ffffff"],
  ["#CDA08D", "#9bd3ff"],
  ["#cda08d", "#9bd3ff"],
  ["#9B6125", "#007eff"],
  ["#9b6125", "#007eff"],
  ["#4D2A08", "#003f91"],
  ["#4d2a08", "#003f91"],
  ["#502D09", "#007eff"],
  ["#502d09", "#007eff"],
  ["#574A40", "#007eff"],
  ["#574a40", "#007eff"],
  ["#200500", "#020b1f"],
  ["#070300", "#020817"],
  ["#998675", "#8cc8ff"],
  ["#AA9E95", "#a9d7ff"],
  ["#B7B0A5", "#7fc7ff"],
  ["#b7b0a5", "#7fc7ff"],
  ["#53463C", "#0050b8"],
  ["#53463c", "#0050b8"],
  ["#ff6900", "#007eff"],
  ["#fcb900", "#5fb5ff"],
]);

for (const file of files) {
  let content = fs.readFileSync(file, "utf8");
  const original = content;

  for (const [from, to] of colors) {
    content = content.split(from).join(to);
  }

  if (content !== original) {
    fs.writeFileSync(file, content, "utf8");
    console.log(`Atualizado: ${file}`);
  }
}
