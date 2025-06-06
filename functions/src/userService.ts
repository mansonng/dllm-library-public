import { db, LoginUser } from "./platform";
import {
  User,
  ContactMethod,
  Location,
  Role,
} from "./generated/graphql";
import { ItemService } from "./itemService";
import { MapService, createMapService } from "./mapService";
import * as geofire from "geofire-common";
import { Timestamp } from "firebase-admin/firestore";
import { create } from "domain";


type UserModel = Omit<User, "createdAt" > & {
  geohash?: string;
  created: Timestamp;
};

export class UserService {
  private mapService: MapService;
  private itemService: ItemService;

  constructor(itemService: ItemService) {
    this.mapService = createMapService();
    this.itemService = itemService;
  }

  async me(loginUser: LoginUser | null): Promise<User | null> {
    if (!loginUser) throw new Error("Not authenticated");
    // check if user's email is verified
    const userDoc = await db.collection("users").doc(loginUser.uid).get();
    if (!userDoc.exists) return null;
    const data = userDoc.data() as UserModel;
    if (!data.isVerified && loginUser.emailVerified) {
      // update user to verified if email is verified
      await db.collection("users").doc(loginUser.uid).update({ isVerified: true });
    }
    return { createdAt: data.created.seconds * 1000, ...data } as User;
  }

  async userById(
    loginUser: LoginUser | null,
    userId: string
  ): Promise<User | null> {
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) return null;
    const data = userDoc.data() as UserModel;
    return { createdAt: data.created.seconds * 1000, ...data } as User;
  }

  async createUser(
    loginUser: LoginUser | null,
    nickname: string,
    address: string
  ): Promise<User> {
    if (!loginUser) throw new Error("Not authenticated");

    let resolvedLocation: Location | undefined | null = undefined;
    
    if (address) {
      resolvedLocation = await this.mapService.resolveLocationAndGeohash(address); 
    }

    const userData: UserModel = {
      id: loginUser.uid,
      email: loginUser.email,
      nickname: nickname || undefined,
      location: resolvedLocation ? { latitude: resolvedLocation.latitude, longitude: resolvedLocation.longitude } : undefined,
      address: address || undefined,
      role: Role.User,
      isActive: true,
      isVerified: false,
      created: Timestamp.now(),
      geohash: resolvedLocation?.geohash || undefined,
    };
    await db.collection("users").doc(loginUser.uid).set(userData);
    return {createdAt: userData.created.seconds * 1000, ...userData} as User;
  }

  async updateUser(
    loginUser: LoginUser | null,
    nickname?: string | null,
    address?: string | null,
    contactMethods?: ContactMethod[] | null
  ): Promise<User> {
    if (!loginUser) throw new Error("Not authenticated");

    const userRef = db.collection("users").doc(loginUser.uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new Error("User not found");
    }

    const updates: { [key: string]: any } = {};

    if (nickname != null) {
      updates.nickname = nickname;
    }

    if (contactMethods != null) {
      updates.contactMethods = contactMethods;
    }

    if (address != null) {
      const oldAddress = userDoc.data()?.address;

      if (address !== oldAddress) {
        let resolvedLocation = await this.mapService.resolveLocationAndGeohash(address);

        await this.itemService.updateUserItemsLocation(
          loginUser.uid,
          resolvedLocation
        );

        if (resolvedLocation) {
          updates.address = address;
          updates.location = {
            latitude: resolvedLocation.latitude,
            longitude: resolvedLocation.longitude,
            geohash: resolvedLocation.geohash,
          };
          updates.geohash = resolvedLocation.geohash;
        } else {
          updates.address = null;
          updates.location = null;
          updates.geohash = null;
        }
      }
    }

    if (Object.keys(updates).length > 0) {
      console.debug("update: ", updates)
      await userRef.update(updates);
    }

    const updatedDoc = await userRef.get();
    const data = updatedDoc.data() as UserModel;
    return { createdAt: data.created.seconds * 1000, ...data } as User;
  }
}
