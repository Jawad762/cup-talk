import { getDownloadURL, getStorage, ref, uploadBytesResumable } from "firebase/storage";
import { verifyImage } from "./verifyImage";
import { resizeImage } from "./resizeImages";
import { app } from "./firebase";

export const uploadImageToFirebase = async (file: File, storePath: string): Promise<string> => {
    const storage = getStorage(app)

    const metadata = {
        contentType: 'image/*'
    };

    const resizedFile = file && await resizeImage(file) as File
    const storageRef = ref(storage, storePath + resizedFile.name);
    const uploadTask = uploadBytesResumable(storageRef, resizedFile as File, metadata);
 
    try {
        await uploadTask;
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        const verify = await verifyImage(downloadURL);

        if (verify.summary.action === 'reject') {
            return 'rejected';
        } else {
            return downloadURL;
        }
    } catch (error) {
        return 'error';
    }
    
}