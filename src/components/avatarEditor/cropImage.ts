export interface PixelCrop {
    x: number;
    y: number;
    width: number;
    height: number;
}

export const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {

        const image = new Image();

        image.addEventListener("load", () => {
            resolve(image);
        });

        image.addEventListener("error", (error) => {
            reject(error);
        });

        image.setAttribute("crossOrigin", "anonymous");

        image.src = url;
    });


export async function getCroppedImg(
    imageSrc: string,
    pixelCrop: PixelCrop
): Promise<Blob> {

    const image = await createImage(imageSrc);

    const canvas = document.createElement("canvas");

    const ctx = canvas.getContext("2d");

    if (!ctx) {
        throw new Error("Could not create canvas context");
    }

    const OUTPUT_SIZE = 400;

    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;

    ctx.drawImage(
        image,

        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,

        0,
        0,
        OUTPUT_SIZE,
        OUTPUT_SIZE
    );

    return new Promise((resolve, reject) => {

        canvas.toBlob(
            (blob) => {

                if (!blob) {
                    reject(
                        new Error("Could not create image")
                    );
                    return;
                }

                resolve(blob);
            },

            "image/webp",

            0.9
        );
    });
}