declare module "*.json" {
    import { AddressesDataType } from "../index"; // Assuming AddressesDataType is exported from index.ts
    const value: AddressesDataType;
    export default value;
}