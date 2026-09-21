// Turns whatever came off a phone or a camera into the one shape the site
// serves: a 480x270 WebP, the same size and format as the 289 generated photos
// already in public/recipe-images.
//
// This runs in the browser rather than on the server for two reasons. A raw
// 4 MB JPEG would have to be base64'd (+33%) into a JSON body to reach the API,
// and Vercel caps that body at 4.5 MB; and resizing server side would mean
// bundling an image library into a serverless function that currently has no
// dependencies at all. A canvas does the same job for free, and what leaves the
// browser is ~20 KB.

export const IMAGE_WIDTH = 480;
export const IMAGE_HEIGHT = 270;

// Matches the look of the existing generated files (480px wide, WebP, ~15-25 KB)
// closely enough that a hand-uploaded photo does not stand out in the grid.
const QUALITY = 0.72;

// Not a real constraint, just a guard against someone picking a RAW file or a
// video by mistake and waiting on a decode that was never going to work.
const MAX_SOURCE_BYTES = 25 * 1024 * 1024;

// createImageBitmap is the only path that applies EXIF orientation reliably, so
// a portrait phone photo does not land sideways. The <img> fallback covers
// browsers and formats it refuses.
const load = async (file) => {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch (error) {
      // Fall through: older Safari rejects the options argument outright.
    }
  }

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That file could not be read as an image."));
    };
    img.src = url;
  });
};

const encode = (canvas) =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        // A browser that cannot encode WebP silently hands back a PNG instead.
        // Committing that under a .webp name would serve bytes that do not match
        // the type the CDN declares, so it is refused here where it can be
        // explained.
        if (!blob || blob.type !== "image/webp") {
          reject(
            new Error(
              "This browser cannot create WebP images. Try Chrome, Edge, Firefox, or Safari 16 or newer."
            )
          );
          return;
        }
        resolve(blob);
      },
      "image/webp",
      QUALITY
    );
  });

const toBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = () => reject(new Error("The photo could not be read."));
    reader.readAsDataURL(blob);
  });

// Fills the 16:9 box from the middle of the source, the same crop the card and
// the hero do with object-fit: cover -- so what the author sees in the preview is
// what the site will show.
const drawCover = (source, width, height) => {
  const sourceWidth = source.width || source.naturalWidth;
  const sourceHeight = source.height || source.naturalHeight;
  if (!sourceWidth || !sourceHeight) {
    throw new Error("That image has no dimensions.");
  }

  const scale = Math.max(width / sourceWidth, height / sourceHeight);
  const cropWidth = width / scale;
  const cropHeight = height / scale;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  context.imageSmoothingQuality = "high";
  context.drawImage(
    source,
    (sourceWidth - cropWidth) / 2,
    (sourceHeight - cropHeight) / 2,
    cropWidth,
    cropHeight,
    0,
    0,
    width,
    height
  );

  return { canvas, sourceWidth, sourceHeight };
};

// Returns what the form needs: the base64 WebP to upload, a preview URL, and the
// warning to show when the source was too small to fill the box sharply.
export const prepareRecipeImage = async (file) => {
  if (!file) throw new Error("No file was chosen.");
  if (!/^image\//.test(file.type)) {
    throw new Error("That is not an image file.");
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error("That file is too big to process in the browser.");
  }

  const source = await load(file);
  try {
    const { canvas, sourceWidth, sourceHeight } = drawCover(
      source,
      IMAGE_WIDTH,
      IMAGE_HEIGHT
    );
    const blob = await encode(canvas);
    const base64 = await toBase64(blob);

    return {
      base64,
      preview: `data:image/webp;base64,${base64}`,
      bytes: blob.size,
      sourceWidth,
      sourceHeight,
      // Below the display size the photo is being blown up, not scaled down, and
      // it will look soft on the card. Worth saying, not worth blocking.
      lowResolution: sourceWidth < IMAGE_WIDTH || sourceHeight < IMAGE_HEIGHT,
    };
  } finally {
    if (source.close) source.close();
  }
};
