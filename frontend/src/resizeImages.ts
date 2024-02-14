import Resizer from "react-image-file-resizer";

export const resizeImage = (file: File) => {
    return new Promise((resolve) => {
        Resizer.imageFileResizer(
            file as File,
            800,
            800,
            "JPEG",
            95,
            0,
            (uri) => {
              resolve(uri as File);
            },
            "file"
          );
    })
}