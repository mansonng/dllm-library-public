import { db, GetPublicUrlForGSFile } from "./platform";
import {
  Item,
  Location,
  LocationInput,
  ItemCondition,
  ItemStatus,
  Language,
  User,
} from "./generated/graphql";
import * as geofire from "geofire-common";
import firebase from "firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import { p } from "graphql-ws/dist/common-DY-PBNYy";

type CategoryModel = {
  count: number;
  updated: Timestamp;
  recommended: boolean;
};

export class CategoryService {
  constructor() {}

  async upsertCategories(categories: string[]): Promise<void> {
    if (!categories || categories.length === 0) {
      console.warn("No categories provided for upsert");
      return;
    }

    const batch = db.batch();
    const now = Timestamp.now();

    for (const category of categories) {
      const categoryRef = db.collection("categories").doc(category);
      batch.set(
        categoryRef,
        {
          count: firebase.firestore.FieldValue.increment(1),
          updated: now,
        },
        { merge: true }
      );
    }

    await batch.commit();
    console.log(`Upserted categories: ${categories.join(", ")}`);
  }

  /**
   * @param categoriesMap Array of objects: { category: string, count: number }
   */
  async initializeUserCategories(
    userId: string,
    categoriesMap: { [category: string]: number }
  ): Promise<{ category: string; count: number }[]> {
    if (!categoriesMap || Object.keys(categoriesMap).length === 0) {
      console.warn("No categories provided for upsert");
      return [];
    }

    const batch = db.batch();
    const now = Timestamp.now();

    // Update global categories
    for (const [category, count] of Object.entries(categoriesMap)) {
      if (!category || typeof count !== "number") continue;
      const categoryRef = db.collection("categories").doc(category);
      batch.set(
        categoryRef,
        {
          count: firebase.firestore.FieldValue.increment(count),
          updated: now,
        },
        { merge: true }
      );
    }

    // Update user's itemCategory subcollection
    const userCategoryCollection = db
      .collection("users")
      .doc(userId)
      .collection("itemCategory");

    for (const [category, count] of Object.entries(categoriesMap)) {
      if (!category || typeof count !== "number") continue;
      const userCategoryRef = userCategoryCollection.doc(category);
      batch.set(
        userCategoryRef,
        {
          count: firebase.firestore.FieldValue.increment(count),
          updated: now,
        },
        { merge: true }
      );
    }

    await batch.commit();
    console.log(
      `Upserted categories with counts: ${Object.entries(categoriesMap)
        .map(([category, count]) => `${category} (+${count})`)
        .join(", ")}`
    );

    const itemCategory = Object.entries(categoriesMap).map(([category, count]) => ({
      category,
      count,
    }));

    return itemCategory;
  }

  async getUserItemCategory( userId: string )
  {
    const categorySnapshot = await db.collection("users").doc(userId).collection("itemCategory").get();
    var itemCategory = categorySnapshot.docs.map(doc => ({
      category: doc.id,
      count: doc.data().count
    }));
    return itemCategory;
  }

  async getRecentUpdateCategories(limit: number = 10): Promise<string[]> {
    const snapshot = await db
      .collection("categories")
      .orderBy("updated", "desc")
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => doc.id);
  }

  async getHotCategories(limit: number = 10): Promise<string[]> {
    const snapshot = await db
      .collection("categories")
      .orderBy("count", "desc")
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => doc.id);
  }

  async getDefaultCategories(): Promise<string[]> {
    const snapshot = await db
      .collection("categories")
      .where("recommended", "==", true)
      .get();

    return snapshot.docs.map((doc) => doc.id);
  }
}
