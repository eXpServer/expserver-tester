/**
 * reverses a string by keeping /n intact if exists at the end
 * @param input string
 * @returns reversed string
 */
export const reverseString = (input: string): string => {
    const len = input.length;
    if (input[len - 1] == '\n') {
        const arr = input.split('');
        const excludeNewLine = arr.slice(0, len - 1).reverse();

        return [...excludeNewLine, arr[len - 1]].join('');
    }
    return input.split('').reverse().join('');
}


/**
 * generates a random string
 * @param length of the string
 * @returns random string of given length
 */
export const generateRandomString = (length: number): string => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;

    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
}

/**
 * generates
 */