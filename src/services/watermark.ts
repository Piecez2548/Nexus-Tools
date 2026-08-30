/** Draw a faint, fitted diagonal watermark without obscuring the source. */
export function drawWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  text: string,
) {
  const label = text.trim();
  if (!label) return;
  ctx.save();
  const angle = -Math.atan2(height, width);
  const cos = Math.abs(Math.cos(angle));
  const sin = Math.abs(Math.sin(angle));
  ctx.font = "600 100px system-ui";
  const ratio = Math.max(0.1, ctx.measureText(label).width / 100);
  const size = Math.min(
    (width * 0.82) / (ratio * cos + 1.2 * sin),
    (height * 0.82) / (ratio * sin + 1.2 * cos),
    Math.min(width, height) * 0.28,
  );
  ctx.translate(width / 2, height / 2);
  ctx.rotate(angle);
  ctx.font = `600 ${size}px system-ui`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = "#808080";
  ctx.fillText(label, 0, 0);
  ctx.restore();
}
