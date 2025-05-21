import { db, LoginUser } from "./platform";
import {
  User,
  ContactMethod,
  Location,
} from "./generated/graphql";
import { ItemService } from "./itemService";
import { MapService } from "./mapService";
import * as geofire from "geofire-common";

type UserModel = User & {
  geohash?: string;
};
export class UserService {
  constructor(private itemService: ItemService,
    private mapService: MapService = new MapService()  // geofire.geohashForLocation is a function that takes a location and returns a geohash
  ) {}

  async me(loginUser: LoginUser | null): Promise<User | null> {
    if (!loginUser) throw new Error("Not authenticated");
    const userDoc = await db.collection("users").doc(loginUser.uid).get();
    if (!userDoc.exists) return null;

    const data = userDoc.data() as User;
    return { ...data };
  }

  async userById(
    loginUser: LoginUser | null,
    userId: string
  ): Promise<User | null> {
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) return null;
    const data = userDoc.data() as User;
    return { ...data };
  }

  async createUser(
    loginUser: LoginUser | null,
    nickname: string,
    address: string
  ): Promise<User> {
    if (!loginUser) throw new Error("Not authenticated");
    // location should use google map api to resolve from address

    let location: Location | undefined = undefined;
    let g: geofire.Geohash | undefined = undefined;
    if (address) {
      const result = this.mapService.resolveLocation(address);
      if (result) {
        location = result.location;
        g = result.geohash;
      }
      // require to resolve from google map base on address
    }

    const userData: UserModel = {
      id: loginUser.uid,
      email: loginUser.email,
      nickname: nickname || undefined,
      location: location, // require to resolve from google map base on address
      address: address || undefined,
      createdAt: new Date().toISOString(),
      geohash: g || undefined,
    };
    await db.collection("users").doc(loginUser.uid).set(userData);
    return userData as User;
  }

  async updateUser(
    loginUser: LoginUser | null,
    nickname: string,
    address: string,
    contactMethods: ContactMethod[]
  ): Promise<User> {
    if (!loginUser) throw new Error("Not authenticated");
    let location: Location | undefined = undefined;
    let g: geofire.Geohash | undefined = undefined;
    if (address) {
      const result = this.mapService.resolveLocation(address);
      if (result) {
        location = result.location;
        g = result.geohash;
      }
      // require to resolve from google map base on address
    }
    const updates: Partial<UserModel> = {
      nickname: nickname || undefined,
      contactMethods: contactMethods || undefined,
      location: location, // require to resolve from google map base on address
      address: address || undefined,
      geohash: g || undefined,
    };
    await db.collection("users").doc(loginUser.uid).update(updates);
    const updatedDoc = await db.collection("users").doc(loginUser.uid).get();
    return { ...(updatedDoc.data() as User) };
  }
}
