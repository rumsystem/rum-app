export class StoreInLocalStorage {
  private data: Record<string, unknown> = {};
  private storeName: string;

  public constructor(public name: string) {
    this.storeName = `store_in_local_${name}`;
    try {
      this.data = JSON.parse(localStorage.getItem(`store_in_local_${name}`) ?? '');
    } catch (e) {
      this.data = {};
    }
  }

  public set(key: string, value: unknown) {
    this.data[key] = value;
    localStorage.setItem(this.storeName, JSON.stringify(this.data));
  }

  public get(key: string) {
    return this.data[key];
  }

  public clear() {
    this.data = {};
    localStorage.removeItem(this.storeName);
  }
}
