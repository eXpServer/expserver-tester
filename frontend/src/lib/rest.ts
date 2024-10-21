const BACKEND_URL = 'http://localhost:6969';
import axios from 'axios';


export const getToken = async () => {
    try {
        const response = await axios.get<{ token: string }>(`${process.env.NEXT_PUBLIC_SERVER_URL}}/token`);
        return response.data.token;
    }
    catch {
        return null;
    }
}

export const getStageDescription = async (stageNo: number, token: string) => {
    try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_SERVER_URL}/stage/${stageNo}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            }
        });
        return response.data;
    }
    catch {
        return null;
    }
}

export const uploadBinary = async (stageNo: number, token: string, file: File) => {
    const formData = new FormData();
    formData.append('binary', file);

    try {
        const response = await axios.post<{ binaryId: string, stageNo: number }>(
            `${BACKEND_URL}/stage/${stageNo}/binary`,
            formData,
            {
                headers: {
                    "Content-Type": 'multipart/f',
                    Authorization: `Bearer ${token}`,
                }
            }
        )
        return response.data.binaryId;
    }
    catch {
        return null;
    }
}

export const deleteBinary = async (stageNo: number, token: string) => {
    try {
        await axios.delete(
            `${BACKEND_URL}/stage/${stageNo}/binary`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            }
        )

        return true;
    }
    catch {
        return false;
    }
}