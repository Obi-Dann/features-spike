export default function loadKey(key: string) {
    return (window as any).keyset[key];
}
