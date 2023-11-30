export function bail(msg: string): never {
    throw new Error(msg);
}